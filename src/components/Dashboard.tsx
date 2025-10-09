import { useState, useEffect } from 'react';
import { TrendingUp, Package, ShoppingCart, Plus, Minus, X, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { AddProduct } from './AddProduct';
import { Restock } from './Restock';
import { RecordSale } from './RecordSale';
import { EditProduct } from './EditProduct';
import { ProductView } from './ProductView';
import { EditSale } from './EditSale';

interface DashboardMetrics {
  revenue: number;
  unitsSold: number;
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
          { 
            name: 'Today', 
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
          },
          { 
            name: 'Yesterday', 
            start: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
            end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
          },
          { 
            name: 'Last 7 Days', 
            start: new Date(last7Days.getFullYear(), last7Days.getMonth(), last7Days.getDate()),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
          },
          { 
            name: 'Last 14 Days', 
            start: new Date(last14Days.getFullYear(), last14Days.getMonth(), last14Days.getDate()),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
          },
        ];

        const trends = await Promise.all(
          periods.map(async (period) => {
            const { data: salesData } = await supabase
              .from('sales')
              .select('id, total_amount, sale_date')
              .gte('sale_date', period.start.toISOString())
              .lte('sale_date', period.end.toISOString());

            const { data: saleItemsData } = await supabase
              .from('sale_items')
              .select('product_id, quantity, unit_price, subtotal')
              .in('sale_id', salesData?.map(s => s.id) || []);

            const { data: purchasesData } = await supabase
              .from('stock_purchases')
              .select('product_id, total_cost')
              .gte('purchase_date', period.start.toISOString())
              .lte('purchase_date', period.end.toISOString());

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Sales Trends</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading trends...</div>
        ) : (
          <div className="space-y-4">
            {trendsData.map((trend) => (
              <div key={trend.period} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">{trend.period}</h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <div className="text-gray-600 mb-1">Sales Count</div>
                    <div className="text-base sm:text-lg font-semibold text-blue-600">
                      {trend.salesCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Units Sold</div>
                    <div className="text-base sm:text-lg font-semibold text-purple-600">
                      {trend.unitsSold}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Revenue</div>
                    <div className="text-base sm:text-lg font-semibold text-green-600">
                      R{trend.revenue.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Profit</div>
                    <div className={`text-base sm:text-lg font-semibold ${trend.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
    revenue: 0,
    unitsSold: 0,
  });
  const [filteredMetrics, setFilteredMetrics] = useState<DashboardMetrics>({
    revenue: 0,
    unitsSold: 0,
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
  const [showEditSale, setShowEditSale] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSale, setSelectedSale] = useState<RecentSale | null>(null);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'all'>('today');
  const [currentPage, setCurrentPage] = useState(1);
  const salesPerPage = 5;

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
      const totalUnitsSold = Object.values(salesByProduct).reduce(
        (sum, item) => sum + item.quantity,
        0
      );

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
        revenue: totalRevenue,
        unitsSold: totalUnitsSold,
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
    
    // Normalize both dates to start of day for comparison
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const saleDateStart = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());
    
    return saleDateStart.getTime() === todayStart.getTime();
  };

  const isYesterday = (date: string) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const saleDate = new Date(date);
    
    // Normalize both dates to start of day for comparison
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const saleDateStart = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());
    
    const isMatch = saleDateStart.getTime() === yesterdayStart.getTime();
    
    if (isMatch) {
      console.log('Yesterday match found:', {
        saleDate: date,
        saleDateStart: saleDateStart.toISOString(),
        yesterdayStart: yesterdayStart.toISOString()
      });
    }
    
    return isMatch;
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
      // Calculate revenue for all products
      const productsWithRevenue = products.map((product) => {
        const productSales = product.total_units_sold || 0;
        const revenue = productSales * product.unit_selling_price;
        return {
          ...product,
          revenue: revenue,
        };
      });
      
      setFilteredMetrics(allMetrics);
      setFilteredProducts(productsWithRevenue as any);
      return;
    }

    try {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let startDate: Date;
      let endDate: Date;

      if (filter === 'today') {
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      } else {
        startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
      }

      // Fetch sales data for the filtered period using full ISO timestamps
      console.log(`Fetching sales for ${filter} period:`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      const { data: salesData } = await supabase
        .from('sales')
        .select('id, total_amount, sale_date')
        .gte('sale_date', startDate.toISOString())
        .lte('sale_date', endDate.toISOString());

      // Fetch sale items for revenue calculation
      const { data: saleItemsData } = await supabase
        .from('sale_items')
        .select('product_id, quantity, unit_price, subtotal')
        .in('sale_id', salesData?.map(s => s.id) || []);
        
      console.log(`Found ${salesData?.length || 0} sales and ${saleItemsData?.length || 0} sale items for ${filter} period`);

      // Fetch purchases for cost calculation using full ISO timestamps
      const { data: purchasesData } = await supabase
        .from('stock_purchases')
        .select('product_id, total_cost')
        .gte('purchase_date', startDate.toISOString())
        .lte('purchase_date', endDate.toISOString());

      const filteredRevenue = salesData?.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0) || 0;
      const filteredUnitsSold = saleItemsData?.reduce((sum, item) => sum + item.quantity, 0) || 0;

      setFilteredMetrics({
        revenue: filteredRevenue,
        unitsSold: filteredUnitsSold,
      });

      // Update products with filtered sales data
      const updatedProducts = await Promise.all(
        products.map(async (product) => {
          // Get sales for this product in the filtered period
          const productSales = saleItemsData?.filter(item => item.product_id === product.id) || [];
          const unitsSoldInPeriod = productSales.reduce((sum, sale) => sum + sale.quantity, 0);
          const revenueInPeriod = productSales.reduce((sum, sale) => sum + parseFloat(sale.subtotal), 0);

          console.log(`Product ${product.name}:`, {
            originalUnitsSold: product.total_units_sold,
            periodUnitsSold: unitsSoldInPeriod,
            revenueInPeriod: revenueInPeriod,
            salesInPeriod: productSales.length,
            filter: filter
          });

          return {
            ...product,
            total_units_sold: unitsSoldInPeriod, // Override with filtered data for this period
            revenue: revenueInPeriod, // Add revenue for this period
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
    console.log('Date filter changed to:', dateFilter);
    console.log('Recent sales count:', recentSales.length);
    
    const filtered = filterSalesByDate(recentSales, dateFilter);
    console.log('Filtered sales count:', filtered.length);
    
    setFilteredSales(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-20 sm:pb-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Inventory Tracker</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your products, stock, and sales</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600">
                {dateFilter === 'today' ? 'Revenue Today' : 
                 dateFilter === 'yesterday' ? 'Revenue Yesterday' : 'Total Revenue'}
              </span>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-gray-900">
              R{filteredMetrics.revenue.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600">
                {dateFilter === 'today' ? 'Units Sold Today' : 
                 dateFilter === 'yesterday' ? 'Units Sold Yesterday' : 'Total Units Sold'}
              </span>
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-gray-900">{filteredMetrics.unitsSold}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${
                dateFilter === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('yesterday')}
              className={`px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${
                dateFilter === 'yesterday'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${
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
            className="bg-purple-600 text-white px-4 py-2 sm:px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-sm text-sm sm:text-base w-full sm:w-auto"
          >
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            Trends
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEditProduct}
              onView={handleViewProduct}
              showPeriodData={dateFilter !== 'all'}
              revenue={(product as any).revenue || 0}
            />
          ))}
        </div>

        {filteredSales.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Sales</h2>
            
            {/* Paginated Sales */}
            <div className="space-y-3">
              {filteredSales
                .slice((currentPage - 1) * salesPerPage, currentPage * salesPerPage)
                .map((sale) => (
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
                    <div className="ml-4 flex items-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedSale(sale);
                          setShowEditSale(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Sale"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          R{sale.total_amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {filteredSales.length > salesPerPage && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * salesPerPage) + 1} to {Math.min(currentPage * salesPerPage, filteredSales.length)} of {filteredSales.length} sales
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-600">
                    Page {currentPage} of {Math.ceil(filteredSales.length / salesPerPage)}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredSales.length / salesPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(filteredSales.length / salesPerPage)}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Floating Action Buttons - Mobile First */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 flex gap-2 sm:gap-4 px-4 w-full max-w-sm sm:max-w-none sm:w-auto">
        <button
          onClick={() => setShowRecordSale(true)}
          className="flex-1 sm:flex-none bg-orange-600 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-full hover:bg-orange-700 transition-colors font-medium flex items-center justify-center gap-1 sm:gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
        >
          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden xs:inline">Record Sale</span>
          <span className="xs:hidden">Sale</span>
        </button>
        <button
          onClick={() => setShowRestock(true)}
          className="flex-1 sm:flex-none bg-green-600 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-full hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-1 sm:gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
        >
          <Package className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden xs:inline">Restock</span>
          <span className="xs:hidden">Stock</span>
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

      {/* Edit Sale Modal */}
      {showEditSale && selectedSale && (
        <EditSale
          saleId={selectedSale.id}
          saleDate={selectedSale.sale_date}
          totalAmount={selectedSale.total_amount}
          items={selectedSale.items}
          onSuccess={() => {
            setShowEditSale(false);
            setSelectedSale(null);
            fetchData();
          }}
          onCancel={() => {
            setShowEditSale(false);
            setSelectedSale(null);
          }}
        />
      )}
    </div>
  );
}
