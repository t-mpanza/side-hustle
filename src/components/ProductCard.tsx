import { TrendingUp, CreditCard as Edit, Eye } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onView?: (product: Product) => void;
}

export function ProductCard({ product, onEdit, onView }: ProductCardProps) {

  const costPerUnit = product.cost_per_batch / product.units_per_batch;
  const profitPerUnit = product.unit_selling_price - costPerUnit;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">{product.name}</h3>
          {product.description && (
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{product.description}</p>
          )}
        </div>
        <div className="flex gap-1 ml-2">
          {onView && (
            <button
              onClick={() => onView(product)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="View Details"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(product)}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Product"
          >
            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between py-1.5 sm:py-2 border-b border-gray-100">
          <span className="text-xs sm:text-sm text-gray-600">Selling Price</span>
          <span className="font-semibold text-gray-900 text-sm sm:text-base">
            R{product.unit_selling_price.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5 sm:py-2 border-b border-gray-100">
          <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Profit/Unit</span>
          </div>
          <span className={`font-semibold text-sm sm:text-base ${profitPerUnit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            R{profitPerUnit.toFixed(2)}
          </span>
        </div>

        <div className="pt-1 sm:pt-2 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Units sold</span>
            <span className="font-medium">{product.total_units_sold}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
