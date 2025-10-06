export interface Product {
  id: string;
  name: string;
  description: string | null;
  unit_selling_price: number;
  cost_per_batch: number;
  units_per_batch: number;
  current_stock: number;
  total_units_sold: number;
  created_at: string;
  updated_at: string;
}

export interface StockPurchase {
  id: string;
  product_id: string;
  batches_purchased: number;
  cost_per_batch: number;
  total_cost: number;
  units_added: number;
  purchase_date: string;
  notes: string | null;
}

export interface Sale {
  id: string;
  sale_date: string;
  total_amount: number;
  notes: string | null;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface ProductWithMetrics extends Product {
  total_revenue: number;
  total_cost: number;
  profit: number;
  profit_margin: number;
}
