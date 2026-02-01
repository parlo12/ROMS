'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LocationAnalytics {
  id: number;
  location_name: string;
  restaurant_name: string;
  orders_today: number;
  orders_this_week: number;
  orders_this_month: number;
  orders_total: number;
  revenue_today_cents: number;
  revenue_this_week_cents: number;
  revenue_this_month_cents: number;
  revenue_total_cents: number;
  avg_order_value_cents: number;
}

interface RestaurantAnalytics {
  id: number;
  display_name: string;
  locations: LocationAnalytics[];
  totals: {
    orders_today: number;
    orders_this_week: number;
    orders_this_month: number;
    orders_total: number;
    revenue_today_cents: number;
    revenue_this_week_cents: number;
    revenue_this_month_cents: number;
    revenue_total_cents: number;
  };
}

interface AnalyticsData {
  restaurants: RestaurantAnalytics[];
  grand_totals: {
    orders_today: number;
    orders_this_week: number;
    orders_this_month: number;
    orders_total: number;
    revenue_today_cents: number;
    revenue_this_week_cents: number;
    revenue_this_month_cents: number;
    revenue_total_cents: number;
  };
}

export default function OwnerAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | 'all'>('all');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.is_platform_admin) {
      router.replace('/admin');
      return;
    }

    fetchAnalytics();
  }, [router]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/dashboard/owner/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          router.replace('/login');
          return;
        }
        if (response.status === 403) {
          router.replace('/orders');
          return;
        }
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  const getDisplayData = () => {
    if (!data) return null;
    if (selectedRestaurant === 'all') {
      return {
        totals: data.grand_totals,
        locations: data.restaurants.flatMap((r) => r.locations),
      };
    }
    const restaurant = data.restaurants.find((r) => r.id === selectedRestaurant);
    return restaurant
      ? { totals: restaurant.totals, locations: restaurant.locations }
      : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const displayData = getDisplayData();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Owner Dashboard</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <Link
              href="/dashboard"
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium"
            >
              Overview
            </Link>
            <Link
              href="/orders"
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium"
            >
              Orders
            </Link>
            <Link
              href="/dashboard/staff"
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium"
            >
              Staff
            </Link>
            <Link
              href="/menu"
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium"
            >
              Menu
            </Link>
            <Link
              href="/dashboard/analytics"
              className="border-b-2 border-blue-600 text-blue-600 py-4 px-1 text-sm font-medium"
            >
              Analytics
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>

          {/* Restaurant Filter */}
          {data && data.restaurants.length > 1 && (
            <select
              value={selectedRestaurant}
              onChange={(e) =>
                setSelectedRestaurant(
                  e.target.value === 'all' ? 'all' : parseInt(e.target.value)
                )
              }
              className="border rounded-md px-3 py-2"
            >
              <option value="all">All Restaurants</option>
              {data.restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.display_name}
                </option>
              ))}
            </select>
          )}
        </div>

        {displayData && (
          <>
            {/* Summary Stats - Today */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500">Orders Today</div>
                  <div className="mt-2 text-3xl font-bold text-blue-600">
                    {displayData.totals.orders_today}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500">Revenue Today</div>
                  <div className="mt-2 text-3xl font-bold text-green-600">
                    {formatCurrency(displayData.totals.revenue_today_cents)}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Stats - This Week */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500">Orders This Week</div>
                  <div className="mt-2 text-3xl font-bold text-blue-600">
                    {displayData.totals.orders_this_week}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500">Revenue This Week</div>
                  <div className="mt-2 text-3xl font-bold text-green-600">
                    {formatCurrency(displayData.totals.revenue_this_week_cents)}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Stats - This Month */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500">Orders This Month</div>
                  <div className="mt-2 text-3xl font-bold text-blue-600">
                    {displayData.totals.orders_this_month}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500">Revenue This Month</div>
                  <div className="mt-2 text-3xl font-bold text-green-600">
                    {formatCurrency(displayData.totals.revenue_this_month_cents)}
                  </div>
                </div>
              </div>
            </div>

            {/* All Time Stats */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Time</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500">Total Orders</div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">
                    {displayData.totals.orders_total}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500">Total Revenue</div>
                  <div className="mt-2 text-3xl font-bold text-green-600">
                    {formatCurrency(displayData.totals.revenue_total_cents)}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500">Avg Order Value</div>
                  <div className="mt-2 text-3xl font-bold text-blue-600">
                    {displayData.totals.orders_total > 0
                      ? formatCurrency(
                          displayData.totals.revenue_total_cents /
                            displayData.totals.orders_total
                        )
                      : '$0.00'}
                  </div>
                </div>
              </div>
            </div>

            {/* Location Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Performance by Location
              </h3>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Today
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        This Week
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        This Month
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        All Time
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Order
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayData.locations.map((loc) => (
                      <tr key={loc.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {loc.location_name}
                          </div>
                          <div className="text-xs text-gray-500">{loc.restaurant_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">{loc.orders_today} orders</div>
                          <div className="text-sm text-green-600">
                            {formatCurrency(loc.revenue_today_cents)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">
                            {loc.orders_this_week} orders
                          </div>
                          <div className="text-sm text-green-600">
                            {formatCurrency(loc.revenue_this_week_cents)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">
                            {loc.orders_this_month} orders
                          </div>
                          <div className="text-sm text-green-600">
                            {formatCurrency(loc.revenue_this_month_cents)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {loc.orders_total} orders
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(loc.revenue_total_cents)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-blue-600">
                            {formatCurrency(loc.avg_order_value_cents)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
