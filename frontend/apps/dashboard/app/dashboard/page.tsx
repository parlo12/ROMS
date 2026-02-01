'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LocationStats {
  id: number;
  location_name: string;
  public_location_code: string;
  is_active: boolean;
  orders_today: number;
  orders_total: number;
  revenue_today_cents: number;
  revenue_total_cents: number;
}

interface RestaurantStats {
  id: number;
  display_name: string;
  legal_name: string;
  is_active: boolean;
  locations: LocationStats[];
  total_orders: number;
  total_revenue_cents: number;
}

interface DashboardData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  restaurants: RestaurantStats[];
  summary: {
    total_restaurants: number;
    total_locations: number;
    total_orders_today: number;
    total_revenue_today_cents: number;
    total_orders_all_time: number;
    total_revenue_all_time_cents: number;
  };
}

export default function OwnerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    // Platform admin should go to admin dashboard
    if (userData.is_platform_admin) {
      router.replace('/admin');
      return;
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/dashboard/owner/overview`,
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
          // Not an owner, redirect to orders
          router.replace('/orders');
          return;
        }
        throw new Error('Failed to fetch dashboard data');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Owner Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{data?.user?.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <Link
              href="/dashboard"
              className="border-b-2 border-blue-600 text-blue-600 py-4 px-1 text-sm font-medium"
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
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium"
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

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Welcome back, {data?.user?.name}
        </h2>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Restaurants</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {data?.summary.total_restaurants ?? 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Locations</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {data?.summary.total_locations ?? 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Orders Today</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">
              {data?.summary.total_orders_today ?? 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Revenue Today</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {formatCurrency(data?.summary.total_revenue_today_cents ?? 0)}
            </div>
          </div>
        </div>

        {/* All Time Stats */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Orders (All Time)</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {data?.summary.total_orders_all_time ?? 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Revenue (All Time)</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {formatCurrency(data?.summary.total_revenue_all_time_cents ?? 0)}
            </div>
          </div>
        </div>

        {/* Restaurants List */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Restaurants</h3>

          {data?.restaurants && data.restaurants.length > 0 ? (
            <div className="space-y-4">
              {data.restaurants.map((restaurant) => (
                <div key={restaurant.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {restaurant.display_name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {restaurant.legal_name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            restaurant.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {restaurant.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Restaurant Stats */}
                    <div className="grid gap-4 md:grid-cols-4 mb-4">
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-xs text-gray-500">Locations</div>
                        <div className="text-lg font-bold text-gray-900">
                          {restaurant.locations.length}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-xs text-gray-500">Total Orders</div>
                        <div className="text-lg font-bold text-gray-900">
                          {restaurant.total_orders}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-xs text-gray-500">Total Revenue</div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(restaurant.total_revenue_cents)}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-xs text-gray-500">Avg per Order</div>
                        <div className="text-lg font-bold text-blue-600">
                          {restaurant.total_orders > 0
                            ? formatCurrency(restaurant.total_revenue_cents / restaurant.total_orders)
                            : '$0.00'}
                        </div>
                      </div>
                    </div>

                    {/* Locations */}
                    <div className="border-t pt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Locations ({restaurant.locations.length})
                      </h5>
                      <div className="space-y-2">
                        {restaurant.locations.map((location) => (
                          <div
                            key={location.id}
                            className="flex justify-between items-center bg-gray-50 p-3 rounded"
                          >
                            <div>
                              <div className="font-medium text-sm">
                                {location.location_name}
                              </div>
                              <div className="text-xs text-blue-500 font-mono">
                                Code: {location.public_location_code}
                              </div>
                            </div>
                            <div className="flex items-center space-x-6 text-sm">
                              <div className="text-right">
                                <div className="text-gray-500">Today</div>
                                <div className="font-medium">
                                  {location.orders_today} orders
                                </div>
                                <div className="text-green-600 font-medium">
                                  {formatCurrency(location.revenue_today_cents)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-gray-500">All Time</div>
                                <div className="font-medium">
                                  {location.orders_total} orders
                                </div>
                                <div className="text-green-600 font-medium">
                                  {formatCurrency(location.revenue_total_cents)}
                                </div>
                              </div>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  location.is_active ? 'bg-green-500' : 'bg-red-500'
                                }`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No restaurants found.</p>
              <p className="text-sm text-gray-400 mt-2">
                Contact the platform administrator to set up your restaurant.
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/orders"
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="font-medium text-gray-900">View Orders</div>
              <div className="text-sm text-gray-500 mt-1">Manage incoming orders</div>
            </Link>
            <Link
              href="/dashboard/staff"
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="font-medium text-gray-900">Manage Staff</div>
              <div className="text-sm text-gray-500 mt-1">Add or remove employees</div>
            </Link>
            <Link
              href="/menu"
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="font-medium text-gray-900">Edit Menu</div>
              <div className="text-sm text-gray-500 mt-1">Update menu items and prices</div>
            </Link>
            <Link
              href="/dashboard/analytics"
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="font-medium text-gray-900">View Analytics</div>
              <div className="text-sm text-gray-500 mt-1">Revenue and order reports</div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
