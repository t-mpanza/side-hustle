import { useState, useEffect } from 'react';
import { X, Package, TrendingUp, Calendar, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

interface StockPurchase {
  id: string;
  batches_purchased: number;
  cost_per_batch: number;
  total_cost: number;
  units_added: number;
  purchase_date: string;
  notes: string | null;
}

interface SaleWithDetails {
  id: string;
  sale_date: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface ProductViewProps {
  product: Product;
  onClose: () => void;
}

export function ProductView({ product, onClose }: ProductViewProps) {
  const [stockPurchases, setStockPurchases] = useState<StockPurchase[]>([]);
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalCost: 0,
    profit: 0,
    profitMargin: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: purchasesData } = await supabase
          .from('stock_purchases')
          .select('*')
          .eq('product_id', product.id)
          .order('purchase_date', { ascending: false });

        const { data: salesData } = await supabase
          .from('sale_items')
          .select('id, sale_id, quantity, unit_price, subtotal')
          .eq('product_id', product.id);

        const salesWithDates = await Promise.all(
          (salesData || []).map(async (sale) => {
            const { data: saleInfo } = await supabase
              .from('sales')
              .select('sale_date')
              .eq('id', sale.sale_id)
              .single();

            return {
              id: sale.id,
              sale_date: saleInfo?.sale_date || '',
              quantity: sale.quantity,
              unit_price: parseFloat(sale.unit_price),
              subtotal: parseFloat(sale.subtotal),
            };
          })
        );

        salesWithDates.sort((a, b) =>
          new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
        );

        const totalRevenue = salesWithDates.reduce((sum, sale) => sum + sale.subtotal, 0);
        const totalCost = (purchasesData || []).reduce((sum, purchase) => sum + parseFloat(purchase.total_cost), 0);
        const profit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

        setStockPurchases(purchasesData || []);
        setSales(salesWithDates);
        setMetrics({ totalRevenue, totalCost, profit, profitMargin });
      } catch (error) {
        console.error('Error fetching product details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [product.id]);

  const costPerUnit = product.cost_per_batch / product.units_per_batch;
  const profitPerUnit = product.unit_selling_price - costPerUnit;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
            {product.description && (
              <p className="text-gray-600 mt-1">{product.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading...</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Current Stock</span>
                </div>
                <div className={`text-2xl font-bold ${product.current_stock < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                  {product.current_stock}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {product.total_units_sold} sold total
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Selling Price</div>
                <div className="text-2xl font-bold text-gray-900">
                  R{product.unit_selling_price.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">per unit</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Profit per Unit</span>
                </div>
                <div className={`text-2xl font-bold ${profitPerUnit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R{profitPerUnit.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Cost: R{costPerUnit.toFixed(2)}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Total Profit</div>
                <div className={`text-2xl font-bold ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R{metrics.profit.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.profitMargin > 0 ? `${metrics.profitMargin.toFixed(1)}% margin` : 'No sales yet'}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Batch Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Units per batch:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {product.units_per_batch}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Cost per batch:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    R{product.cost_per_batch.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Stock Purchases</h3>
                </div>
                {stockPurchases.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500 text-sm">No stock purchases yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {stockPurchases.map((purchase) => (
                      <div
                        key={purchase.id}
                        className="bg-white border border-gray-200 rounded-lg p-3 hover:border-green-300 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium text-gray-900">
                              {purchase.batches_purchased} batch{purchase.batches_purchased > 1 ? 'es' : ''}
                            </div>
                            <div className="text-xs text-gray-500">
                              +{purchase.units_added} units
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              R{parseFloat(purchase.total_cost).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              R{parseFloat(purchase.cost_per_batch).toFixed(2)}/batch
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(purchase.purchase_date).toLocaleDateString('en-ZA', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        {purchase.notes && (
                          <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            {purchase.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Sales History</h3>
                </div>
                {sales.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500 text-sm">No sales yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {sales.map((sale) => (
                      <div
                        key={sale.id}
                        className="bg-white border border-gray-200 rounded-lg p-3 hover:border-orange-300 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium text-gray-900">
                              {sale.quantity} unit{sale.quantity > 1 ? 's' : ''}
                            </div>
                            <div className="text-xs text-gray-500">
                              R{sale.unit_price.toFixed(2)}/unit
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-orange-600">
                              R{sale.subtotal.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(sale.sale_date).toLocaleDateString('en-ZA', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Financial Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 mb-1">Total Revenue</div>
                  <div className="text-lg font-semibold text-green-600">
                    R{metrics.totalRevenue.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Total Cost</div>
                  <div className="text-lg font-semibold text-gray-700">
                    R{metrics.totalCost.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Net Profit</div>
                  <div className={`text-lg font-semibold ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R{metrics.profit.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
