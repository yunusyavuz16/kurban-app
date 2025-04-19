-- Add unique constraint to order_number
ALTER TABLE kurban ADD CONSTRAINT unique_order_number UNIQUE (order_number);