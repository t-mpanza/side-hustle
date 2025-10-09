import { useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SaleItem {
  product_name: string;
  quantity: number;
}

interface EditSaleProps {
  saleId: string;
  saleDate: string;
  totalAmount: number;
  items: SaleItem[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditSale({ saleId, saleDate, totalAmount, items, onSuccess, onCancel }: EditSaleProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      // Get sale items to restore stock
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('product_id, quantity')
        .eq('sale_id', saleId);

      if (saleItems) {
        // Restore stock for each item
        for (const item of saleItems) {
          await supabase.rpc('restore_stock_on_sale_delete', {
            p_product_id: item.product_id,
            p_quantity: item.quantity
          });
        }
      }

      // Delete the sale (cascade will delete sale_items)
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId);

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Failed to delete sale. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit Sale</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Sale Date</div>
            <div className="font-medium text-gray-900">
              {new Date(saleDate).toLocaleDateString('en-ZA', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">Items</div>
            <div className="space-y-1">
              {items.map((item, idx) => (
                <div key={idx} className="text-sm text-gray-900">
                  {item.product_name} x{item.quantity}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Amount</div>
            <div className="text-2xl font-bold text-green-600">
              R{totalAmount.toFixed(2)}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Currently, you can only delete this sale. To modify quantities, delete this sale and record a new one.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting || loading}
            className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete Sale'}
          </button>
          <button
            onClick={onCancel}
            disabled={deleting || loading}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

