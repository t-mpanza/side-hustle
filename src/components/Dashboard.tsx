import { useState, useEffect } from 'react';
import { TrendingUp, Package, ShoppingCart, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { AddProduct } from './AddProduct';
import { Restock } from './Restock';
import { RecordSale } from './RecordSale';
import { EditProduct } from './EditProduct';
import { ProductView } from './ProductView';

interface DashboardMetrics {
  totalRevenue: number;
  totalProfit: number;
  totalProducts: number;
}

interface RecentSale {
  id: string;
  sale_date: string;
  total_amount: number;
  items: {
    product_name: string;
    quantity: number;
  }[];
}

export function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalProfit: 0,
    totalProducts: 0,
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [showRecordSale, setShowRecordSale] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showProductView, setShowProductView] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchData = async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (productsError) throw productsError;

      const { data: salesData, error: salesError } = await supabase
        .from('sale_items')
        .select('product_id, quantity, unit_price, subtotal');

      if (salesError) throw salesError;

      const { data: purchasesData, error: purchasesError } = await supabase
        .from('stock_purchases')
        .select('product_id, total_cost');

      if (purchasesError) throw purchasesError;

      const salesByProduct = salesData.reduce((acc, item) => {
        if (!acc[item.product_id]) {
          acc[item.product_id] = { revenue: 0, quantity: 0 };
        }
        acc[item.product_id].revenue += parseFloat(item.subtotal);
        acc[item.product_id].quantity += item.quantity;
        return acc;
      }, {} as Record<string, { revenue: number; quantity: number }>);

      const costByProduct = purchasesData.reduce((acc, purchase) => {
        if (!acc[purchase.product_id]) {
          acc[purchase.product_id] = 0;
        }
        acc[purchase.product_id] += parseFloat(purchase.total_cost);
        return acc;
      }, {} as Record<string, number>);

      const totalRevenue = Object.values(salesByProduct).reduce(
        (sum, item) => sum + item.revenue,
        0
      );
      const totalCost = Object.values(costByProduct).reduce((sum, cost) => sum + cost, 0);

      const { data: recentSalesData } = await supabase
        .from('sales')
        .select('id, sale_date, total_amount')
        .order('sale_date', { ascending: false })
        .limit(5);

      const salesWithItems = await Promise.all(
        (recentSalesData || []).map(async (sale) => {
          const { data: items } = await supabase
            .from('sale_items')
            .select('quantity, product_id')
            .eq('sale_id', sale.id);

          const itemsWithNames = await Promise.all(
            (items || []).map(async (item) => {
              const { data: product } = await supabase
                .from('products')
                .select('name')
                .eq('id', item.product_id)
                .single();
              return {
                product_name: product?.name || 'Unknown',
                quantity: item.quantity,
              };
            })
          );

          return {
            id: sale.id,
            sale_date: sale.sale_date,
            total_amount: parseFloat(sale.total_amount),
            items: itemsWithNames,
          };
        })
      );

      setProducts(productsData || []);
      setRecentSales(salesWithItems);
      setMetrics({
        totalRevenue,
        totalProfit: totalRevenue - totalCost,
        totalProducts: productsData?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditProduct(true);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductView(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (products.length === 0 && !showAddProduct) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
          <p className="text-gray-600 mb-6">
            Let's get started by adding your first product to track.
          </p>
          <button
            onClick={() => setShowAddProduct(true)}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Add Your First Product
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Tracker</h1>
          <p className="text-gray-600">Manage your products, stock, and sales</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Revenue</span>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              R{metrics.totalRevenue.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Profit</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              R{metrics.totalProfit.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Products</span>
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.totalProducts}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setShowAddProduct(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
          <button
            onClick={() => setShowRestock(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 shadow-sm"
          >
            <Package className="w-5 h-5" />
            Restock
          </button>
          <button
            onClick={() => setShowRecordSale(true)}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center gap-2 shadow-sm"
          >
            <ShoppingCart className="w-5 h-5" />
            Record Sale
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEditProduct}
              onView={handleViewProduct}
            />
          ))}
        </div>

        {recentSales.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Sales</h2>
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingCart className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        {new Date(sale.sale_date).toLocaleDateString('en-ZA', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      {sale.items.map((item, idx) => (
                        <span key={idx}>
                          {item.product_name} x{item.quantity}
                          {idx < sale.items.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-lg font-bold text-green-600">
                      R{sale.total_amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddProduct && (
        <AddProduct
          onSuccess={() => {
            setShowAddProduct(false);
            fetchData();
          }}
          onCancel={() => setShowAddProduct(false)}
        />
      )}

      {showRestock && (
        <Restock
          products={products}
          onSuccess={() => {
            setShowRestock(false);
            fetchData();
          }}
          onCancel={() => setShowRestock(false)}
        />
      )}

      {showRecordSale && (
        <RecordSale
          products={products}
          onSuccess={() => {
            setShowRecordSale(false);
            fetchData();
          }}
          onCancel={() => setShowRecordSale(false)}
        />
      )}

      {showEditProduct && selectedProduct && (
        <EditProduct
          product={selectedProduct}
          onSuccess={() => {
            setShowEditProduct(false);
            setSelectedProduct(null);
            fetchData();
          }}
          onCancel={() => {
            setShowEditProduct(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {showProductView && selectedProduct && (
        <ProductView
          product={selectedProduct}
          onClose={() => {
            setShowProductView(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}
