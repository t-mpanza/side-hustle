import { useState } from 'react';
import { ShoppingCart, Plus, Trash2, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

interface SaleLineItem {
  id: string;
  product_id: string;
  quantity: number;
}

interface RecordSaleProps {
  products: Product[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function RecordSale({ products, onSuccess, onCancel }: RecordSaleProps) {
  const [loading, setLoading] = useState(false);
  const [lineItems, setLineItems] = useState<SaleLineItem[]>([
    { id: crypto.randomUUID(), product_id: '', quantity: 1 },
  ]);
  const [notes, setNotes] = useState('');

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), product_id: '', quantity: 1 },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof SaleLineItem, value: string | number) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const incrementQuantity = (id: string) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const product = products.find((p) => p.id === item.product_id);
          const maxQuantity = product ? product.current_stock : 999;
          return { ...item, quantity: Math.min(item.quantity + 1, maxQuantity) };
        }
        return item;
      })
    );
  };

  const decrementQuantity = (id: string) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          return { ...item, quantity: Math.max(item.quantity - 1, 1) };
        }
        return item;
      })
    );
  };

  const calculateTotal = () => {
    return lineItems.reduce((total, item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (product && item.quantity > 0) {
        return total + product.unit_selling_price * item.quantity;
      }
      return total;
    }, 0);
  };

  const validateStock = () => {
    for (const item of lineItems) {
      const product = products.find((p) => p.id === item.product_id);
      if (product && item.quantity > product.current_stock) {
        return {
          valid: false,
          message: `Not enough stock for ${product.name}. Available: ${product.current_stock}, Requested: ${item.quantity}`,
        };
      }
    }
    return { valid: true, message: '' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateStock();
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    if (lineItems.some((item) => !item.product_id)) {
      alert('Please select a product for all line items');
      return;
    }

    setLoading(true);

    try {
      const totalAmount = calculateTotal();

      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            total_amount: totalAmount,
            notes: notes || null,
          },
        ])
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItems = lineItems.map((item) => {
        const product = products.find((p) => p.id === item.product_id)!;
        return {
          sale_id: saleData.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: product.unit_selling_price,
          subtotal: product.unit_selling_price * item.quantity,
        };
      });

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      onSuccess();
    } catch (error) {
      console.error('Error recording sale:', error);
      alert('Failed to record sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Record Sale</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Items</label>
              <button
                type="button"
                onClick={addLineItem}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {lineItems.map((item, index) => {
              const selectedProduct = products.find((p) => p.id === item.product_id);
              const subtotal = selectedProduct
                ? selectedProduct.unit_selling_price * item.quantity
                : 0;

              return (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Item {index + 1}
                    </span>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Product
                      </label>
                      <select
                        required
                        value={item.product_id}
                        onChange={(e) =>
                          updateLineItem(item.id, 'product_id', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      >
                        <option value="">Select...</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} (R{product.unit_selling_price.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Quantity
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => decrementQuantity(item.id)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                          title="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-center font-medium">
                          {item.quantity}
                        </div>
                        <button
                          type="button"
                          onClick={() => incrementQuantity(item.id)}
                          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                          title="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedProduct && (
                    <div className="bg-gray-50 rounded p-2 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Available stock:</span>
                        <span
                          className={`font-medium ${
                            item.quantity > selectedProduct.current_stock
                              ? 'text-red-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {selectedProduct.current_stock} units
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium text-gray-900">
                          R{subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Amount:</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-orange-600">
                  R{calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Recording...'
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Record Sale
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
