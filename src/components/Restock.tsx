import { useState } from 'react';
import { Package, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

interface RestockProps {
  products: Product[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function Restock({ products, onSuccess, onCancel }: RestockProps) {
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [batchesPurchased, setBatchesPurchased] = useState('');
  const [costPerBatch, setCostPerBatch] = useState('');
  const [notes, setNotes] = useState('');

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const totalCost = selectedProductId && batchesPurchased && costPerBatch
    ? parseFloat(batchesPurchased) * parseFloat(costPerBatch)
    : 0;

  const unitsAdded = selectedProduct && batchesPurchased
    ? selectedProduct.units_per_batch * parseInt(batchesPurchased)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('stock_purchases').insert([
        {
          product_id: selectedProductId,
          batches_purchased: parseInt(batchesPurchased),
          cost_per_batch: parseFloat(costPerBatch),
          total_cost: totalCost,
          units_added: unitsAdded,
          notes: notes || null,
        },
      ]);

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error recording restock:', error);
      alert('Failed to record restock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Restock Inventory</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Product
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <select
                required
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  const product = products.find((p) => p.id === e.target.value);
                  if (product) {
                    setCostPerBatch(product.cost_per_batch.toString());
                  }
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Choose a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Current: {product.current_stock} units)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedProduct && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Units per batch:</span>
                <span className="font-medium text-gray-900">
                  {selectedProduct.units_per_batch}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Default cost per batch:</span>
                <span className="font-medium text-gray-900">
                  R{selectedProduct.cost_per_batch.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Batches
            </label>
            <div className="relative">
              <ShoppingBag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                min="1"
                required
                value={batchesPurchased}
                onChange={(e) => setBatchesPurchased(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., 5"
              />
            </div>
            {selectedProduct && batchesPurchased && (
              <p className="mt-1 text-xs text-gray-500">
                = {unitsAdded} individual units
              </p>
            )}
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
                value={costPerBatch}
                onChange={(e) => setCostPerBatch(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          {totalCost > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Cost:</span>
                <span className="text-lg font-bold text-green-600">
                  R{totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Any additional notes..."
              rows={2}
            />
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
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Restock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
