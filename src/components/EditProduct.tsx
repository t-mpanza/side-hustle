import { useState } from 'react';
import { Package, Box } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

interface EditProductProps {
  product: Product;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditProduct({ product, onSuccess, onCancel }: EditProductProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    unit_selling_price: product.unit_selling_price.toString(),
    cost_per_batch: product.cost_per_batch.toString(),
    units_per_batch: product.units_per_batch.toString(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          description: formData.description || null,
          unit_selling_price: parseFloat(formData.unit_selling_price),
          cost_per_batch: parseFloat(formData.cost_per_batch),
          units_per_batch: parseInt(formData.units_per_batch),
        })
        .eq('id', product.id);

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const oldCostPerUnit = product.cost_per_batch / product.units_per_batch;
  const newCostPerUnit = parseFloat(formData.cost_per_batch) / parseInt(formData.units_per_batch || '1');
  const oldProfitPerUnit = product.unit_selling_price - oldCostPerUnit;
  const newProfitPerUnit = parseFloat(formData.unit_selling_price || '0') - newCostPerUnit;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Cookies"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional details..."
              rows={2}
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price (per unit)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-semibold">R</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.unit_selling_price}
                    onChange={(e) => setFormData({ ...formData, unit_selling_price: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Previous: R{product.unit_selling_price.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost per Batch
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-semibold">R</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.cost_per_batch}
                    onChange={(e) => setFormData({ ...formData, cost_per_batch: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Previous: R{product.cost_per_batch.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Units per Batch
              </label>
              <div className="relative">
                <Box className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.units_per_batch}
                  onChange={(e) => setFormData({ ...formData, units_per_batch: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 12"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Previous: {product.units_per_batch} units
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-gray-900 text-sm">Cost Analysis</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 mb-1">Current Cost per Unit:</div>
                <div className="font-semibold text-gray-900">R{oldCostPerUnit.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">New Cost per Unit:</div>
                <div className="font-semibold text-blue-600">R{newCostPerUnit.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Current Profit per Unit:</div>
                <div className={`font-semibold ${oldProfitPerUnit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R{oldProfitPerUnit.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">New Profit per Unit:</div>
                <div className={`font-semibold ${newProfitPerUnit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R{newProfitPerUnit.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Changing prices will only affect future calculations. Past sales and purchases remain unchanged.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
