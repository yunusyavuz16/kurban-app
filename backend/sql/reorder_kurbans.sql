-- Function to reorder kurbans
CREATE OR REPLACE FUNCTION reorder_kurbans(dragged_id UUID, target_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  dragged_order INT;
  target_order INT;
BEGIN
  -- Get the current order numbers of the dragged and target items
  SELECT order_number INTO dragged_order FROM kurban WHERE id = dragged_id;
  SELECT order_number INTO target_order FROM kurban WHERE id = target_id;

  -- Exit if IDs are the same or not found
  IF dragged_id = target_id OR dragged_order IS NULL OR target_order IS NULL THEN
    RAISE NOTICE 'Dragged or target ID not found or they are the same. dragged_id: %, target_id: %, dragged_order: %, target_order: %', dragged_id, target_id, dragged_order, target_order;
    RETURN;
  END IF;

  -- Determine the shift direction and update accordingly
  IF dragged_order < target_order THEN
    -- Moving item DOWN: Shift items between dragged and target UP by 1
    UPDATE kurban
    SET order_number = order_number - 1
    WHERE
      order_number > dragged_order
      AND order_number <= target_order;

    -- Place the dragged item at the target position
    UPDATE kurban
    SET order_number = target_order
    WHERE id = dragged_id;

  ELSE -- dragged_order > target_order
    -- Moving item UP: Shift items between target and dragged DOWN by 1
    UPDATE kurban
    SET order_number = order_number + 1
    WHERE
      order_number >= target_order
      AND order_number < dragged_order;

    -- Place the dragged item at the target position
    UPDATE kurban
    SET order_number = target_order
    WHERE id = dragged_id;
  END IF;

  -- Optional: Recalculate all waiting order numbers sequentially
  -- This ensures absolute contiguity if gaps somehow appeared, but might be less performant
  /*
  WITH ranked_waiting AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY order_number ASC) as new_order
    FROM kurban
    WHERE status_id = (SELECT id FROM kurban_statuses WHERE name = 'waiting')
  )
  UPDATE kurban k
  SET order_number = rw.new_order
  FROM ranked_waiting rw
  WHERE k.id = rw.id;
  */

END;
$$;