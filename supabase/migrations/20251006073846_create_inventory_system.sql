/*
  # Inventory and Sales Tracking System

  ## Overview
  This migration creates a complete inventory management system for a small home-based business.
  It tracks products, stock purchases, sales transactions, and automatically calculates profits.

  ## New Tables

  ### 1. `products`
  Core product information table
  - `id` (uuid, primary key) - Unique identifier for each product
  - `name` (text) - Product name
  - `description` (text, optional) - Product description
  - `unit_selling_price` (decimal) - Price per single unit when sold
  - `cost_per_batch` (decimal) - Cost to purchase one batch/carton
  - `units_per_batch` (integer) - Number of individual units in one batch/carton
  - `current_stock` (integer) - Current number of units available
  - `total_units_sold` (integer) - Lifetime total units sold
  - `created_at` (timestamptz) - When product was added
  - `updated_at` (timestamptz) - Last modification timestamp

  ### 2. `stock_purchases`
  Records each time stock is purchased/restocked
  - `id` (uuid, primary key) - Unique identifier for purchase
  - `product_id` (uuid, foreign key) - Links to products table
  - `batches_purchased` (integer) - Number of batches/cartons bought
  - `cost_per_batch` (decimal) - Cost per batch at time of purchase
  - `total_cost` (decimal) - Total cost of this purchase
  - `units_added` (integer) - Total units added to inventory
  - `purchase_date` (timestamptz) - When the stock was purchased
  - `notes` (text, optional) - Optional notes about the purchase

  ### 3. `sales`
  Records individual sales transactions
  - `id` (uuid, primary key) - Unique identifier for sale
  - `sale_date` (timestamptz) - When the sale occurred
  - `total_amount` (decimal) - Total revenue from this sale
  - `notes` (text, optional) - Optional notes about the sale

  ### 4. `sale_items`
  Line items for each sale (supports multi-product sales)
  - `id` (uuid, primary key) - Unique identifier
  - `sale_id` (uuid, foreign key) - Links to sales table
  - `product_id` (uuid, foreign key) - Links to products table
  - `quantity` (integer) - Number of units sold
  - `unit_price` (decimal) - Price per unit at time of sale
  - `subtotal` (decimal) - Total for this line item

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Public access policies for reading and writing (suitable for personal use)
  - In production, these should be restricted to authenticated users

  ## Important Notes
  - All monetary values use DECIMAL(10,2) for precision
  - Stock purchases track historical cost per batch for accurate profit calculation
  - Sales support multiple products in a single transaction
  - Triggers automatically update product stock levels and totals
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  unit_selling_price decimal(10,2) NOT NULL CHECK (unit_selling_price >= 0),
  cost_per_batch decimal(10,2) NOT NULL CHECK (cost_per_batch >= 0),
  units_per_batch integer NOT NULL CHECK (units_per_batch > 0),
  current_stock integer NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  total_units_sold integer NOT NULL DEFAULT 0 CHECK (total_units_sold >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stock_purchases table
CREATE TABLE IF NOT EXISTS stock_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batches_purchased integer NOT NULL CHECK (batches_purchased > 0),
  cost_per_batch decimal(10,2) NOT NULL CHECK (cost_per_batch >= 0),
  total_cost decimal(10,2) NOT NULL CHECK (total_cost >= 0),
  units_added integer NOT NULL CHECK (units_added > 0),
  purchase_date timestamptz DEFAULT now(),
  notes text
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date timestamptz DEFAULT now(),
  total_amount decimal(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  notes text
);

-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal decimal(10,2) NOT NULL CHECK (subtotal >= 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stock_purchases_product_id ON stock_purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_purchases_purchase_date ON stock_purchases(purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date DESC);

-- Function to update product updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_product_updated_at ON products;
CREATE TRIGGER trigger_update_product_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_updated_at();

-- Function to update product stock when stock is purchased
CREATE OR REPLACE FUNCTION update_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET current_stock = current_stock + NEW.units_added
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update stock on purchase
DROP TRIGGER IF EXISTS trigger_update_stock_on_purchase ON stock_purchases;
CREATE TRIGGER trigger_update_stock_on_purchase
  AFTER INSERT ON stock_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_purchase();

-- Function to update product stock and sales when sale item is created
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET 
    current_stock = current_stock - NEW.quantity,
    total_units_sold = total_units_sold + NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update stock on sale
DROP TRIGGER IF EXISTS trigger_update_stock_on_sale ON sale_items;
CREATE TRIGGER trigger_update_stock_on_sale
  AFTER INSERT ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_sale();

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products table
CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to products"
  ON products FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to products"
  ON products FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to products"
  ON products FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for stock_purchases table
CREATE POLICY "Allow public read access to stock_purchases"
  ON stock_purchases FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to stock_purchases"
  ON stock_purchases FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to stock_purchases"
  ON stock_purchases FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to stock_purchases"
  ON stock_purchases FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for sales table
CREATE POLICY "Allow public read access to sales"
  ON sales FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to sales"
  ON sales FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to sales"
  ON sales FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to sales"
  ON sales FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for sale_items table
CREATE POLICY "Allow public read access to sale_items"
  ON sale_items FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to sale_items"
  ON sale_items FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to sale_items"
  ON sale_items FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to sale_items"
  ON sale_items FOR DELETE
  TO anon
  USING (true);