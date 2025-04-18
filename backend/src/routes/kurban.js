const express = require("express");
const router = express.Router();
const { auth, adminOnly, staffOnly, authorize } = require("../middleware/auth");

// Get all animals (public)
router.get("/", async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    // Join with kurban_statuses to get status details
    const { data, error } = await supabase
      .from("kurban")
      // Select needed fields from kurban and all fields (*) or specific fields from status
      .select(
        `
        id, no, order_number, created_at, updated_at, weight, notes, slaughter_time, butcher_name, package_count, meat_pieces,
        status:kurban_statuses ( id, name, label, color_bg, color_text, color_border, display_order )
      `
      )
      .order("order_number", { ascending: true }); // Order by kurban order_number

    if (error) {
      console.error("Error fetching kurbans with statuses:", error);
      return res.status(500).json({ error: "Failed to fetch kurbans" });
    }
    res.json(data);
  } catch (error) {
    console.error("Server error fetching kurbans:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Search animal by order number (public)
router.get("/search/order/:orderNumber", async (req, res) => {
  try {
    const { data, error } = await req.app.locals.supabase
      .from("kurban")
      .select("*")
      .eq("order_number", parseInt(req.params.orderNumber))
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Animal not found" });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subscribe to real-time updates (public)
router.get("/subscribe", (req, res) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const channel = req.app.locals.supabase
      .channel("kurban_changes")
      .on(
        "postgres_changes",
        {
          event: "*" /* or INSERT, UPDATE */,
          schema: "public",
          table: "kurban",
        },
        async (payload) => {
          // When a change occurs, fetch the full kurban data including the status details
          if (payload.new && payload.new.id) {
            const supabase = req.app.locals.supabase;
            const { data: kurbanData, error: kurbanError } = await supabase
              .from("kurban")
              .select(
                `
                        id, order_number, created_at, updated_at, weight, notes, slaughter_time, butcher_name, package_count, meat_pieces,
                        status:kurban_statuses ( id, name, label, color_bg, color_text, color_border, display_order )
                    `
              )
              .eq("id", payload.new.id)
              .single();

            if (kurbanError) {
              console.error(
                "Error fetching updated kurban for SSE:",
                kurbanError
              );
            } else if (kurbanData) {
              // Send the enriched data (including status object)
              res.write(
                `data: ${JSON.stringify({ ...payload, new: kurbanData })}\n\n`
              );
            } else {
              // Handle case where kurban might have been deleted concurrently? Or just send basic payload.
              res.write(`data: ${JSON.stringify(payload)}\n\n`);
            }
          } else {
            // Send the raw payload if it doesn't have new.id (e.g., DELETE)
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
          }
        }
      )
      .subscribe();

    req.on("close", () => {
      req.app.locals.supabase.removeChannel(channel);
    });
  } catch (error) {
    console.error("SSE setup error:", error);
    // Cannot send 500 here as headers might be sent
  }
});

// Get specific animal (public)
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await req.app.locals.supabase
      .from("kurban")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Animal not found" });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new animal entry (Staff/Admin only)
router.post("/", auth, authorize(["staff", "admin"]), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { order_number, notes } = req.body;

    // Validate order_number
    if (!order_number) {
      return res.status(400).json({ error: "Kurban numarası zorunludur" });
    }

    // Convert order_number to number if it's a string
    const orderNumber =
      typeof order_number === "string" ? parseInt(order_number) : order_number;

    if (isNaN(orderNumber) || orderNumber <= 0) {
      return res
        .status(400)
        .json({ error: "Geçerli bir kurban numarası girmelisiniz" });
    }

    // 1. Find the default status ID ('waiting')
    const { data: defaultStatus, error: statusError } = await supabase
      .from("kurban_statuses")
      .select("id")
      .eq("name", "waiting")
      .single();

    if (statusError) {
      console.error("Error finding default status:", statusError);
      return res
        .status(500)
        .json({
          error: "Durum bilgisi alınamadı",
          details: statusError.message,
        });
    }

    if (!defaultStatus) {
      return res.status(500).json({ error: "Varsayılan durum bulunamadı" });
    }

    // 2. Check if order_number already exists
    const { data: existingKurban, error: checkError } = await supabase
      .from("kurban")
      .select("order_number")
      .eq("order_number", orderNumber)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("Error checking order number:", checkError);
      return res
        .status(500)
        .json({
          error: "Kurban numarası kontrolü yapılamadı",
          details: checkError.message,
        });
    }

    if (existingKurban) {
      return res
        .status(409)
        .json({ error: "Bu kurban numarası zaten kullanılıyor" });
    }

    // 3. Insert the new kurban with the provided order_number and default status_id
    const { data, error } = await supabase
      .from("kurban")
      .insert([
        {
          order_number: orderNumber,
          status_id: defaultStatus.id,
          notes: notes || null,
          meat_pieces: { leg: 0, arm: 0, chest: 0, back: 0, ground: 0 },
        },
      ])
      .select(
        `
        id, order_number, created_at, updated_at, weight, notes, slaughter_time, butcher_name, package_count, meat_pieces,
        status:kurban_statuses ( id, name, label, color_bg, color_text, color_border, display_order )
      `
      )
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      if (error.code === "23505") {
        return res
          .status(409)
          .json({ error: "Bu kurban numarası zaten kullanılıyor" });
      }
      return res.status(500).json({
        error: "Kurban eklenirken bir hata oluştu",
        details: error.message || "Bilinmeyen veritabanı hatası",
      });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({
      error: "Sunucu hatası",
      details: err.message || "Bilinmeyen hata",
    });
  }
});

// Update animal (staff only)
router.put("/:id", auth, authorize(["staff", "admin"]), async (req, res) => {
  const { id } = req.params;
  try {
    const supabase = req.app.locals.supabase;
    const updateData = req.body;

    // Debug için log
    console.log("Updating kurban:", { id, updateData });

    // İlk olarak kurbanın var olup olmadığını kontrol et
    const { data: existingKurban, error: checkError } = await supabase
      .from("kurban")
      .select()
      .eq("id", id)
      .single();

    if (checkError) {
      console.error("Error checking kurban existence:", checkError);
      return res.status(404).json({ error: "Kurban not found" });
    }

    // Güncelleme işlemini yap
    const { error: updateError } = await supabase
      .from("kurban")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      throw updateError;
    }

    // Güncellenmiş veriyi view'dan al
    const { data: updatedKurban, error: fetchError } = await supabase
      .from("kurban_with_status")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching updated kurban:", fetchError);
      throw fetchError;
    }

    if (!updatedKurban) {
      throw new Error("Updated kurban not found");
    }

    res.json(updatedKurban);
  } catch (error) {
    console.error("Error in kurban update:", error);
    res.status(500).json({
      error: "Failed to update kurban",
      details: error.message,
    });
  }
});

// Delete animal (admin only)
router.delete("/:id", auth, authorize(["admin"]), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const kurbanId = req.params.id;

    const { error } = await supabase.from("kurban").delete().eq("id", kurbanId);

    if (error) {
      console.error("Error deleting kurban:", error);
      return res.status(500).json({ error: "Failed to delete kurban" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reorder animals (admin only)
router.post("/reorder", auth, authorize(["admin"]), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { draggedId, targetId } = req.body;

    if (!draggedId || !targetId) {
      return res
        .status(400)
        .json({ error: "Missing required fields: draggedId and targetId" });
    }

    // Call the reorder_kurbans function
    const { error } = await supabase.rpc("reorder_kurbans", {
      dragged_id: draggedId,
      target_id: targetId,
    });

    if (error) {
      console.error("Error reordering kurbans:", error);
      return res.status(500).json({ error: "Failed to reorder kurbans" });
    }

    res.json({ message: "Kurbans reordered successfully" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
