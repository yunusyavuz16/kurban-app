const express = require("express");
const router = express.Router();
const { auth, adminOnly, staffOnly, authorize } = require("../middleware/auth");

router.get("/getByOrganization/:organizationCode", async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { organizationCode } = req.params; // URL'den organizationCode parametresini al
    if(!organizationCode) {
      console.log("organizationCode", organizationCode);
      return res.status(400).json({ error: "Organization code is required" });
    }
    console.log("organizationCode", organizationCode);

    // Organization tablosundan organizationCode'a göre organizasyonu bul
    const { data: organization, error: orgError } = await supabase
      .from("organization")
      .select("id")
      .eq("code", organizationCode)
      .single();

    if (orgError) {
      console.error("Error fetching organization:", orgError);
      return res.status(500).json({ error: "Failed to fetch organization" });
    }

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const organizationId = organization.id;
    // Kurban tablosundan ilgili organizasyonun kurbanlarını al
    const { data: kurbans, error: kurbanError } = await supabase
      .from("kurban")
      .select(
        `
        id, no, order_number, created_at, updated_at, weight, notes, slaughter_time, butcher_name, package_count, meat_pieces,
        status:kurban_statuses ( id, name, label, color_bg, color_text, color_border, display_order )
      `
      )
      .eq("organization_id", organizationId) // Organizasyon ID'sine göre filtrele
      .order("order_number", { ascending: true }); // Order by kurban order_number

    if (kurbanError) {
      console.error("Error fetching kurbans:", kurbanError);
      return res.status(500).json({ error: "Failed to fetch kurbans" });
    }

    res.json(kurbans);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getByOrganizationAll", auth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { organization_id } = req.user; // Kullanıcının organization_id'sini al

    // Join with kurban_statuses to get status details
    const { data, error } = await supabase
      .from("kurban")
      .select(
        `
        id, no, order_number, created_at, updated_at, weight, notes, slaughter_time, butcher_name, package_count, meat_pieces,
        status:kurban_statuses ( id, name, label, color_bg, color_text, color_border, display_order )
      `
      )
      .eq("organization_id", organization_id) // Kullanıcının organization_id'sine göre filtrele
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


// Search animal by kurban no (public)
router.get("/search/no/:organizationCode/:kurbanNo", async (req, res) => {
  try {
    const { organizationCode, kurbanNo } = req.params;

    // First get the organization ID from the code
    const { data: organization, error: orgError } = await req.app.locals.supabase
      .from("organization")
      .select("id")
      .eq("code", organizationCode)
      .single();

    if (orgError) {
      console.error("Error fetching organization:", orgError);
      return res.status(500).json({ error: "Failed to fetch organization" });
    }

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Then search for the animal within that organization by kurban no
    const { data, error } = await req.app.locals.supabase
      .from("kurban")
      .select(`
        id, no, order_number, created_at, updated_at, weight, notes, slaughter_time, butcher_name, package_count, meat_pieces,
        status:kurban_statuses ( id, name, label, color_bg, color_text, color_border, display_order )
      `)
      .eq("no", kurbanNo)
      .eq("organization_id", organization.id)
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
                        id, order_number, created_at, updated_at, weight, notes, slaughter_time, butcher_name, package_count, meat_pieces, organization_id,
                        status:kurban_statuses ( id, name, label, color_bg, color_text, color_border, display_order )
                    `
              )
              .eq("id", payload.new.id)
              .eq("organization_id", req.user.organization_id) // Ensure the kurban belongs to the user's organization
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
      .from("kurban_with_status")
      .select("*")
      .eq("no", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Animal not found" });

    res.json(data);
  } catch (error) {
    console.error("Error fetching specific kurban:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create new animal entry (Staff/Admin only)
router.post("/", auth, authorize(["staff", "admin"]), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { notes, no, order_number } = req.body;
    const { user } = req;
    console.log("user", user);

    // Log the incoming request data
    console.log("Incoming request data:", { notes, no, order_number });

    // 1. Find the default status ID ('waiting')
    const { data: defaultStatus, error: statusError } = await supabase
      .from("kurban_statuses")
      .select("id")
      .eq("name", "waiting")
      .eq("organization_id", user.organization_id) // Ensure the status belongs to the user's organization
      .single();

    if (statusError) {
      console.error("Error finding default status:", statusError);
      return res.status(500).json({
        error: "Durum bilgisi alınamadı",
        details: statusError.message,
      });
    }

    // 2. Use provided order_number or find the next one
    let nextOrderNumber = order_number;

    if (!nextOrderNumber) {
      // Find the current max order_number only if not provided in the request
      const { data: maxOrderData, error: maxOrderError } = await supabase
        .from("kurban")
        .select("order_number")
        .order("order_number", { ascending: false })
        .limit(1)
        .single();

      if (maxOrderError && maxOrderError.code !== "PGRST116") {
        // PGRST116: No rows found
        console.error("Error fetching max order_number:", maxOrderError);
        return res.status(500).json({
          error: "Kurban numarası alınamadı",
          details: maxOrderError.message,
        });
      }

      nextOrderNumber = maxOrderData?.order_number
        ? maxOrderData.order_number + 1
        : 1;
    }

    // 3. Insert the new kurban entry
    const { data: newKurban, error: insertError } = await supabase
      .from("kurban")
      .insert([
        {
          order_number: nextOrderNumber,
          notes,
          status_id: defaultStatus.id,
          no,
          organization_id: user.organization_id,
        },
      ])
      .single();

    if (insertError) {
      console.error("Error inserting kurban:", insertError);
      return res.status(500).json({
        error: "Yeni kurban eklenemedi",
        details: insertError.message,
      });
    }

    return res.status(201).json(newKurban);
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Bulk upload Kurbans (Admin only)
router.post("/bulk", auth, authorize(["admin"]), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const kurbans = req.body;
    const { user } = req;

    if (!Array.isArray(kurbans) || kurbans.length === 0) {
      return res.status(400).json({ error: "Geçerli kurban verisi bulunamadı" });
    }

    console.log(`Bulk uploading ${kurbans.length} kurbans`);

    // 1. Find the default status ID ('waiting')
    const { data: defaultStatus, error: statusError } = await supabase
      .from("kurban_statuses")
      .select("id")
      .eq("name", "waiting")
      .eq("organization_id", user.organization_id)
      .single();

    if (statusError) {
      console.error("Error finding default status:", statusError);
      return res.status(500).json({
        error: "Durum bilgisi alınamadı",
        details: statusError.message,
      });
    }

    // 2. Check for duplicate kurban no or order_number in the request
    const kurbanNos = kurbans.map(k => k.no);
    const kurbanOrderNumbers = kurbans.map(k => k.order_number);

    const hasDuplicateNos = new Set(kurbanNos).size !== kurbanNos.length;
    const hasDuplicateOrderNumbers = new Set(kurbanOrderNumbers).size !== kurbanOrderNumbers.length;

    if (hasDuplicateNos || hasDuplicateOrderNumbers) {
      return res.status(400).json({
        error: hasDuplicateNos
          ? "Yüklenen dosyada aynı kurban kodu (no) birden fazla kez kullanılmış"
          : "Yüklenen dosyada aynı kurban sırası (order_number) birden fazla kez kullanılmış"
      });
    }

    // 3. Check if any kurban no already exists in the database
    const { data: existingKurbans, error: existingKurbansError } = await supabase
      .from("kurban")
      .select("no")
      .in("no", kurbanNos)
      .eq("organization_id", user.organization_id);

    if (existingKurbansError) {
      console.error("Error checking existing kurbans:", existingKurbansError);
      return res.status(500).json({
        error: "Mevcut kurbanlar kontrol edilirken bir hata oluştu",
        details: existingKurbansError.message,
      });
    }

    if (existingKurbans.length > 0) {
      const duplicates = existingKurbans.map(k => k.no).join(", ");
      return res.status(400).json({
        error: `Aşağıdaki kurban kodları zaten sistemde mevcut: ${duplicates}`
      });
    }

    // 4. Map the data to the correct format for insertion
    const kurbansToInsert = kurbans.map(kurban => ({
      order_number: kurban.order_number,
      notes: kurban.notes || "",
      status_id: defaultStatus.id,
      no: kurban.no,
      organization_id: user.organization_id,
    }));

    // 5. Insert all kurbans
    const { data: newKurbans, error: insertError } = await supabase
      .from("kurban")
      .insert(kurbansToInsert)
      .select();

    if (insertError) {
      console.error("Error inserting kurbans:", insertError);
      return res.status(500).json({
        error: "Kurbanlar eklenirken bir hata oluştu",
        details: insertError.message,
      });
    }

    return res.status(201).json({
      message: `${newKurbans.length} kurban başarıyla eklendi`,
      kurbans: newKurbans
    });
  } catch (err) {
    console.error("Unexpected error during bulk upload:", err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Update animal (staff only)
router.put("/:id", auth, authorize(["staff", "admin"]), async (req, res) => {
  const { id } = req.params;
  try {
    const supabase = req.app.locals.supabase;
    const updateData = req.body;

    // first control if kurban is in you organization, check the kurban organization_id is equal to auth user organization_id
    const { data: kurbanData, error: kurbanError } = await supabase
      .from("kurban")
      .select("organization_id")
      .eq("id", id)
      .single();

    if (kurbanError) {
      console.error("Error fetching kurban organization_id:", kurbanError);
      return res.status(500).json({ error: "Failed to fetch kurban" });
    }
    if (kurbanData.organization_id !== req.user.organization_id) {
      return res.status(403).json({ error: "Forbidden" });
    }

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
      .update({
        status_id: updateData.status_id,
        no: updateData.no,
        notes: updateData.notes,
      })
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

    // first control if kurban is in you organization, check the kurban organization_id is equal to auth user organization_id
    const { data: kurbanData, error: kurbanError } = await supabase
      .from("kurban")
      .select("organization_id")
      .eq("id", kurbanId)
      .single();

    if (kurbanError) {
      console.error("Error fetching kurban organization_id:", kurbanError);
      return res.status(500).json({ error: "Failed to fetch kurban" });
    }
    if (kurbanData.organization_id !== req.user.organization_id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    // Check if kurban exists
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

    const { data: kurbanData, error: kurbanError } = await supabase
      .from("kurban")
      .select("organization_id")
      .eq("id", draggedId)
      .single();

    if (kurbanError) {
      console.error("Error fetching kurban organization_id:", kurbanError);
      return res.status(500).json({ error: "Failed to fetch kurban" });
    }
    if (kurbanData.organization_id !== req.user.organization_id) {
      return res.status(403).json({ error: "Forbidden" });
    }

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

router.post(
  "/reorder-by-target",
  auth,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const supabase = req.app.locals.supabase;
      const { kurban_id, dragged_order, target_order } = req.body;

      const { data: kurbanData, error: kurbanError } = await supabase
        .from("kurban")
        .select("organization_id")
        .eq("id", kurban_id)
        .single();

      if (kurbanError) {
        console.error("Error fetching kurban organization_id:", kurbanError);
        return res.status(500).json({ error: "Failed to fetch kurban" });
      }
      if (kurbanData.organization_id !== req.user.organization_id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      if (!dragged_order || !target_order) {
        return res
          .status(400)
          .json({ error: "Missing required fields: draggedId and targetId" });
      }

      // Call the reorder_kurbans function
      const { error } = await supabase.rpc(
        "reorder_kurban_by_targer_order_number",
        {
          p_kurban_id: kurban_id,
          p_dragged_order: dragged_order,
          p_target_order: target_order,
        }
      );

      if (error) {
        console.error("Error reordering kurbans:", error);
        return res.status(500).json({ error: "Failed to reorder kurbans" });
      }

      res.json({ message: "Kurbans reordered successfully" });
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get organization details by code (public)
router.get("/organization/:code", async (req, res) => {
  try {
    const { data, error } = await req.app.locals.supabase
      .from("organization")
      .select("id, name, code")
      .eq("code", req.params.code)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Organization not found" });

    res.json(data);
  } catch (error) {
    console.error("Error fetching organization:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get status history for a kurban (public)
router.get("/status-history/:organizationCode/:kurbanNo", async (req, res) => {
  try {
    const { organizationCode, kurbanNo } = req.params;

    // First get the organization ID from the code
    const { data: organization, error: orgError } = await req.app.locals.supabase
      .from("organization")
      .select("id")
      .eq("code", organizationCode)
      .single();

    if (orgError) {
      console.error("Error fetching organization:", orgError);
      return res.status(500).json({ error: "Failed to fetch organization" });
    }

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Get all statuses for the organization
    const { data: allStatuses, error: statusError } = await req.app.locals.supabase
      .from("kurban_statuses")
      .select("*")
      .eq("organization_id", organization.id)
      .order("display_order", { ascending: true });

    if (statusError) {
      console.error("Error fetching statuses:", statusError);
      return res.status(500).json({ error: "Failed to fetch statuses" });
    }

    // Get the current kurban status
    const { data: kurbanData, error: kurbanError } = await req.app.locals.supabase
      .from("kurban")
      .select(`
        id, no, order_number, created_at, updated_at, weight, notes, slaughter_time, butcher_name, package_count, meat_pieces,
        status:kurban_statuses ( id, name, label, color_bg, color_text, color_border, display_order )
      `)
      .eq("no", kurbanNo)
      .eq("organization_id", organization.id)
      .single();

    if (kurbanError) {
      if (kurbanError.code === "PGRST116") {
        return res.status(404).json({ error: "Animal not found" });
      }
      throw kurbanError;
    }

    // Get all statuses with display_order less than or equal to current status
    const currentStatusOrder = kurbanData.status.display_order;
    const completedStatuses = allStatuses.filter(
      status => status.display_order <= currentStatusOrder
    );

    // Format the response
    const statusHistory = completedStatuses.map(status => ({
      id: status.id,
      name: status.name,
      label: status.label,
      color_bg: status.color_bg,
      color_text: status.color_text,
      color_border: status.color_border,
      display_order: status.display_order,
      is_current: status.id === kurbanData.status.id
    }));

    // If the first status is cancelled and there are multiple statuses, remove it from the list
    if (statusHistory.length > 1 && statusHistory[0].name === 'cancelled') {
      statusHistory.shift();
    }

    res.json({
      current_status: kurbanData.status,
      history: statusHistory
    });
  } catch (error) {
    console.error("Error fetching status history:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
