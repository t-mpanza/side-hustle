import { useState, useEffect } from 'react';
import { TrendingUp, Package, ShoppingCart, Plus, Minus, X } from 'lucide-react';
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

interface TrendsModalProps {
  onClose: () => void;
}

interface TrendData {
  period: string;
  salesCount: number;
  revenue: number;
  profit: number;
  unitsSold: number;
}

function TrendsModal({ onClose }: TrendsModalProps) {
  const [trendsData, setTrendsData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendsData = async () => {
      try {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        const last14Days = new Date();
        last14Days.setDate(last14Days.getDate() - 14);

        const periods = [
          { name: 'Today', start: today, end: today },
          { name: 'Yesterday', start: yesterday, end: yesterday },
          { name: 'Last 7 Days', start: last7Days, end: today },
          { name: 'Last 14 Days', start: last14Days, end: today },
        ];

        const trends = await Promise.all(
          periods.map(async (period) => {
            const { data: salesData } = await supabase
              .from('sales')
              .select('id, total_amount, sale_date')
              .gte('sale_date', period.start.toISOString().split('T')[0])
              .lte('sale_date', period.end.toISOString().split('T')[0]);

            const { data: saleItemsData } = await supabase
              .from('sale_items')
              .select('product_id, quantity, unit_price, subtotal')
              .in('sale_id', salesData?.map(s => s.id) || []);

            const { data: purchasesData } = await supabase
              .from('stock_purchases')
              .select('product_id, total_cost')
              .gte('purchase_date', period.start.toISOString().split('T')[0])
              .lte('purchase_date', period.end.toISOString().split('T')[0]);

            const revenue = salesData?.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0) || 0;
            const cost = purchasesData?.reduce((sum, purchase) => sum + parseFloat(purchase.total_cost), 0) || 0;
            const profit = revenue - cost;
            const unitsSold = saleItemsData?.reduce((sum, item) => sum + item.quantity, 0) || 0;

            return {
              period: period.name,
              salesCount: salesData?.length || 0,
              revenue,
              profit,
              unitsSold,
            };
          })
        );

        setTrendsData(trends);
      } catch (error) {
        console.error('Error fetching trends data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendsData();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Sales Trends</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading trends...</div>
        ) : (
          <div className="space-y-4">
            {trendsData.map((trend) => (
              <div key={trend.period} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">{trend.period}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 mb-1">Sales Count</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {trend.salesCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Units Sold</div>
                    <div className="text-lg font-semibold text-purple-600">
                      {trend.unitsSold}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Revenue</div>
                    <div className="text-lg font-semibold text-green-600">
                      R{trend.revenue.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Profit</div>
                    <div className={`text-lg font-semibold ${trend.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R{trend.profit.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [allMetrics, setAllMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalProfit: 0,
    totalProducts: 0,
  });
  const [filteredMetrics, setFilteredMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalProfit: 0,
    totalProducts: 0,
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [filteredSales, setFilteredSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [showRecordSale, setShowRecordSale] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showProductView, setShowProductView] = useState(false);
  const [showTrendsModal, setShowTrendsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'all'>('all');

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
      setFilteredProducts(productsData || []);
      setRecentSales(salesWithItems);
      setFilteredSales(salesWithItems);
      const allTimeMetrics = {
        totalRevenue,
        totalProfit: totalRevenue - totalCost,
        totalProducts: productsData?.length || 0,
      };
      setAllMetrics(allTimeMetrics);
      setFilteredMetrics(allTimeMetrics);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Date filtering helper functions
  const isToday = (date: string) => {
    const today = new Date();
    const saleDate = new Date(date);
    return saleDate.toDateString() === today.toDateString();
  };

  const isYesterday = (date: string) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const saleDate = new Date(date);
    return saleDate.toDateString() === yesterday.toDateString();
  };

  const filterSalesByDate = (sales: RecentSale[], filter: 'today' | 'yesterday' | 'all') => {
    switch (filter) {
      case 'today':
        return sales.filter(sale => isToday(sale.sale_date));
      case 'yesterday':
        return sales.filter(sale => isYesterday(sale.sale_date));
      case 'all':
      default:
        return sales;
    }
  };

  // Fetch filtered metrics and products based on date filter
  const fetchFilteredData = async (filter: 'today' | 'yesterday' | 'all') => {
    if (filter === 'all') {
      setFilteredMetrics(allMetrics);
      setFilteredProducts(products);
      return;
    }

    try {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let startDate: Date;
      let endDate: Date;

      if (filter === 'today') {
        startDate = today;
        endDate = today;
      } else {
        startDate = yesterday;
        endDate = yesterday;
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch sales data for the filtered period
      const { data: salesData } = await supabase
        .from('sales')
        .select('id, total_amount, sale_date')
        .gte('sale_date', startDateStr)
        .lte('sale_date', endDateStr);

      // Fetch sale items for revenue calculation
      const { data: saleItemsData } = await supabase
        .from('sale_items')
        .select('product_id, quantity, unit_price, subtotal')
        .in('sale_id', salesData?.map(s => s.id) || []);

      // Fetch purchases for cost calculation
      const { data: purchasesData } = await supabase
        .from('stock_purchases')
        .select('product_id, total_cost')
        .gte('purchase_date', startDateStr)
        .lte('purchase_date', endDateStr);

      const filteredRevenue = salesData?.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0) || 0;
      const filteredCost = purchasesData?.reduce((sum, purchase) => sum + parseFloat(purchase.total_cost), 0) || 0;
      const filteredProfit = filteredRevenue - filteredCost;

      setFilteredMetrics({
        totalRevenue: filteredRevenue,
        totalProfit: filteredProfit,
        totalProducts: allMetrics.totalProducts, // Product count doesn't change with date filter
      });

      // Update products with filtered sales data
      const updatedProducts = await Promise.all(
        products.map(async (product) => {
          // Get sales for this product in the filtered period
          const productSales = saleItemsData?.filter(item => item.product_id === product.id) || [];
          const unitsSoldInPeriod = productSales.reduce((sum, sale) => sum + sale.quantity, 0);
          
          // Get purchases for this product in the filtered period
          const productPurchases = purchasesData?.filter(purchase => purchase.product_id === product.id) || [];
          const unitsPurchasedInPeriod = productPurchases.reduce((sum, purchase) => {
            // Calculate units from purchases (we need to get the units_added from stock_purchases)
            return sum; // We'll need to fetch this separately
          }, 0);

          return {
            ...product,
            total_units_sold: unitsSoldInPeriod, // Override with filtered data
          };
        })
      );

      setFilteredProducts(updatedProducts);
    } catch (error) {
      console.error('Error fetching filtered data:', error);
    }
  };

  // Update filtered sales and metrics when date filter changes
  useEffect(() => {
    setFilteredSales(filterSalesByDate(recentSales, dateFilter));
    fetchFilteredData(dateFilter);
  }, [recentSales, dateFilter, allMetrics, products]);

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
              R{filteredMetrics.totalRevenue.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Profit</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              R{filteredMetrics.totalProfit.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Products</span>
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{filteredMetrics.totalProducts}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateFilter === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('yesterday')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateFilter === 'yesterday'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Time
            </button>
          </div>
          <button
            onClick={() => setShowTrendsModal(true)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2 shadow-sm"
          >
            <TrendingUp className="w-5 h-5" />
            Trends
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEditProduct}
              onView={handleViewProduct}
            />
          ))}
        </div>

        {filteredSales.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Sales</h2>
            <div className="space-y-3">
              {filteredSales.map((sale) => (
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

      {/* Sticky Floating Action Buttons */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 flex gap-4">
        <button
          onClick={() => setShowRecordSale(true)}
          className="bg-orange-600 text-white px-6 py-3 rounded-full hover:bg-orange-700 transition-colors font-medium flex items-center gap-2 shadow-lg hover:shadow-xl"
        >
          <ShoppingCart className="w-5 h-5" />
          Record Sale
        </button>
        <button
          onClick={() => setShowRestock(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition-colors font-medium flex items-center gap-2 shadow-lg hover:shadow-xl"
        >
          <Package className="w-5 h-5" />
          Restock
        </button>
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

      {/* Trends Modal */}
      {showTrendsModal && (
        <TrendsModal
          onClose={() => setShowTrendsModal(false)}
        />
      )}
    </div>
  );
}
