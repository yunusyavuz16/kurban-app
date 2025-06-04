const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/auth");

// GET all statuses (public)
router.get("/getByOrganization/:organizationCode", async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { organizationCode } = req.params; // URL'den organizationCode parametresini al
    if (!organizationCode) {
      return res.status(400).json({ error: "Organization code is required" });
    }

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

    const { data, error } = await supabase
      .from("kurban_statuses")
      .select(
        "id, name, label, color_bg, color_text, color_border, display_order"
      )
      .eq("organization_id", organization.id) // Organization ID'sine göre filtrele
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching statuses:", error);
      return res.status(500).json({ error: "Failed to fetch statuses" });
    }
    res.json(data);
  } catch (err) {
    console.error("Server error fetching statuses:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET all statuses (public)
router.get("/getByOrganizationAll", auth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { organization_id } = req.user; // Kullanıcının organization_id'sini al

    const { data, error } = await supabase
      .from("kurban_statuses")
      .select(
        "id, name, label, color_bg, color_text, color_border, display_order"
      )
      .eq("organization_id", organization_id) // Kullanıcının organization_id'sine göre filtrele
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching statuses:", error);
      return res.status(500).json({ error: "Failed to fetch statuses" });
    }
    res.json(data);
  } catch (err) {
    console.error("Server error fetching statuses:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST create new status (admin only)
router.post("/", auth, authorize(["admin"]), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { name, label, color_bg, color_text, color_border, display_order } =
      req.body;

    // Basic validation
    if (
      !name ||
      !label ||
      !color_bg ||
      !color_text ||
      !color_border ||
      display_order === undefined
    ) {
      return res
        .status(400)
        .json({ error: "Missing required fields for status" });
    }

    const { data, error } = await supabase
      .from("kurban_statuses")
      .insert([
        {
          name,
          label,
          color_bg,
          color_text,
          color_border,
          display_order,
          organization_id: req.user.organization_id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating status:", error);
      // Handle potential unique constraint violation (name or display_order)
      if (error.code === "23505") {
        return res
          .status(409)
          .json({ error: "Status name or display order already exists." });
      }
      return res
        .status(500)
        .json({ error: "Failed to create status", details: error.message });
    }
    res.status(201).json(data);
  } catch (err) {
    console.error("Server error creating status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update status (admin only)
router.put("/:id", auth, authorize(["admin"]), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const statusId = req.params.id;
    const { name, label, color_bg, color_text, color_border, display_order } =
      req.body;

    // check if the status exists and the status belongs to the same organization
    const { data: existingStatus, error: fetchError } = await supabase
      .from("kurban_statuses")
      .select("id, organization_id")
      .eq("id", statusId)
      .single();
    if (fetchError) {
      console.error("Error fetching status:", fetchError);
      if (fetchError.code === "PGRST116") {
        // No rows found
        return res.status(404).json({ error: "Status not found" });
      }
      return res
        .status(500)
        .json({ error: "Failed to fetch status", details: fetchError.message });
    }
    if (existingStatus.organization_id !== req.user.organization_id) {
      return res
        .status(403)
        .json({ error: "You do not have permission to update this status" });
    }

    // Basic validation
    if (
      !name ||
      !label ||
      !color_bg ||
      !color_text ||
      !color_border ||
      display_order === undefined
    ) {
      return res
        .status(400)
        .json({ error: "Missing required fields for status update" });
    }

    const { data, error } = await supabase
      .from("kurban_statuses")
      .update({
        name,
        label,
        color_bg,
        color_text,
        color_border,
        display_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", statusId)
      .select()
      .single();

    if (error) {
      console.error("Error updating status:", error);
      if (error.code === "PGRST116") {
        // No rows found
        return res.status(404).json({ error: "Status not found" });
      }
      if (error.code === "23505") {
        return res
          .status(409)
          .json({ error: "Status name or display order already exists." });
      }
      return res
        .status(500)
        .json({ error: "Failed to update status", details: error.message });
    }
    res.json(data);
  } catch (err) {
    console.error("Server error updating status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE status (admin only)
router.delete("/:id", auth, authorize(["admin"]), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const statusId = req.params.id;

    // Check if the status exists and belongs to the same organization
    const { data: existingStatus, error: fetchError } = await supabase
      .from("kurban_statuses")
      .select("id, organization_id")
      .eq("id", statusId)
      .single();
    if (fetchError) {
      console.error("Error fetching status:", fetchError);
      if (fetchError.code === "PGRST116") {
        // No rows found
        return res.status(404).json({ error: "Status not found" });
      }
      return res
        .status(500)
        .json({ error: "Failed to fetch status", details: fetchError.message });
    }
    if (existingStatus.organization_id !== req.user.organization_id) {
      return res
        .status(403)
        .json({ error: "You do not have permission to delete this status" });
    }

    // Important: Check if the status is in use before deleting
    const { count, error: countError } = await supabase
      .from("kurban")
      .select("id", { count: "exact" })
      .eq("status_id", statusId);

    if (countError) {
      console.error("Error checking status usage:", countError);
      return res.status(500).json({ error: "Failed to check status usage" });
    }

    if (count !== null && count > 0) {
      return res.status(400).json({
        error: `Cannot delete status, ${count} kurban(s) are using it.`,
      });
    }

    // Proceed with deletion if not in use
    const { error: deleteError } = await supabase
      .from("kurban_statuses")
      .delete()
      .eq("id", statusId);

    if (deleteError) {
      console.error("Error deleting status:", deleteError);
      if (deleteError.code === "PGRST116") {
        // Should not happen due to check above, but good practice
        res.status(404).json({ error: "Status not found" });
      }
      return res.status(500).json({
        error: "Failed to delete status",
        details: deleteError.message,
      });
    }

    res.status(204).send(); // No content on successful delete
  } catch (err) {
    console.error("Server error deleting status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
