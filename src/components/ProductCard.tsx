import { useState, useEffect } from 'react';
import { Package, TrendingUp, CreditCard as Edit, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onView?: (product: Product) => void;
}

export function ProductCard({ product, onEdit, onView }: ProductCardProps) {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalCost: 0,
    profit: 0,
    profitMargin: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      const { data: salesData } = await supabase
        .from('sale_items')
        .select('subtotal')
        .eq('product_id', product.id);

      const { data: purchasesData } = await supabase
        .from('stock_purchases')
        .select('total_cost')
        .eq('product_id', product.id);

      const totalRevenue = salesData?.reduce((sum, item) => sum + parseFloat(item.subtotal), 0) || 0;
      const totalCost = purchasesData?.reduce((sum, purchase) => sum + parseFloat(purchase.total_cost), 0) || 0;
      const profit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

      setMetrics({ totalRevenue, totalCost, profit, profitMargin });
    };

    fetchMetrics();
  }, [product.id]);

  const costPerUnit = product.cost_per_batch / product.units_per_batch;
  const profitPerUnit = product.unit_selling_price - costPerUnit;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-gray-600">{product.description}</p>
          )}
        </div>
        <div className="flex gap-1">
          {onView && (
            <button
              onClick={() => onView(product)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(product)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Product"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-600">
            <Package className="w-4 h-4" />
            <span className="text-sm">Stock</span>
          </div>
          <span className={`font-semibold ${product.current_stock < 10 ? 'text-red-600' : 'text-gray-900'}`}>
            {product.current_stock} units
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Selling Price</span>
          <span className="font-semibold text-gray-900">
            R{product.unit_selling_price.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Profit/Unit</span>
          </div>
          <span className={`font-semibold ${profitPerUnit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            R{profitPerUnit.toFixed(2)}
          </span>
        </div>

        <div className="pt-3 mt-3 border-t-2 border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Total Revenue</span>
            <span className="font-semibold text-green-600">
              R{metrics.totalRevenue.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Total Cost</span>
            <span className="font-semibold text-gray-700">
              R{metrics.totalCost.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900">Total Profit</span>
            <span className={`font-bold text-lg ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R{metrics.profit.toFixed(2)}
            </span>
          </div>
          {metrics.profitMargin > 0 && (
            <div className="mt-1 text-right">
              <span className="text-xs text-gray-500">
                {metrics.profitMargin.toFixed(1)}% margin
              </span>
            </div>
          )}
        </div>

        <div className="pt-2 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Units sold</span>
            <span className="font-medium">{product.total_units_sold}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
