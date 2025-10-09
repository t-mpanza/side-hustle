-- Create function to restore stock when a sale is deleted
CREATE OR REPLACE FUNCTION restore_stock_on_sale_delete(
  p_product_id uuid,
  p_quantity integer
)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET 
    current_stock = current_stock + p_quantity,
    total_units_sold = total_units_sold - p_quantity
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon users
GRANT EXECUTE ON FUNCTION restore_stock_on_sale_delete(uuid, integer) TO anon;

