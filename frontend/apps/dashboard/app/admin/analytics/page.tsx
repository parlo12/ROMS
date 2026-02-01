'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Analytics {
  period: {
    start: string;
    end: string;
  };
  orders: {
    total: number;
    paid: number;
  };
  revenue: {
    gross_cents: number;
    gross: number;
  };
  platform: {
    fees_cents: number;
    fees: number;
    stripe_fees_cents: number;
    stripe_fees: number;
    net_cents: number;
    net: number;
  };
  top_restaurants: Array<{
    id: number;
    display_name: string;
    order_count: number;
    revenue_cents: number;
  }>;
  daily_revenue: Array<{
    date: string;
    orders: number;
    revenue_cents: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData.is_platform_admin) {
      router.replace('/orders');
      return;
    }

    fetchAnalytics();
  }, [router]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/admin/analytics`,
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
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
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
          <h1 className="text-xl font-bold text-gray-900">Platform Admin</h1>
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
              href="/admin"
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium"
            >
              Overview
            </Link>
            <Link
              href="/admin/restaurants"
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium"
            >
              Restaurants
            </Link>
            <Link
              href="/admin/analytics"
              className="border-b-2 border-blue-600 text-blue-600 py-4 px-1 text-sm font-medium"
            >
              Analytics
            </Link>
            <Link
              href="/admin/revenue"
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium"
            >
              Revenue
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

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Analytics</h2>

        {/* Period Info */}
        {analytics?.period && (
          <div className="mb-6 text-sm text-gray-500">
            Showing data from {analytics.period.start} to {analytics.period.end}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary (Last 30 Days)</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Total Orders</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {analytics?.orders.total ?? 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Paid Orders</div>
              <div className="mt-2 text-3xl font-bold text-green-600">
                {analytics?.orders.paid ?? 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Gross Revenue</div>
              <div className="mt-2 text-3xl font-bold text-green-600">
                {formatCurrency(analytics?.revenue.gross_cents ?? 0)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Platform Net</div>
              <div className="mt-2 text-3xl font-bold text-blue-600">
                {formatCurrency(analytics?.platform.net_cents ?? 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Platform Fees Breakdown */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Fees Breakdown</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Platform Fees (3%)</div>
              <div className="mt-2 text-3xl font-bold text-blue-600">
                {formatCurrency(analytics?.platform.fees_cents ?? 0)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Stripe Fees</div>
              <div className="mt-2 text-3xl font-bold text-orange-600">
                {formatCurrency(analytics?.platform.stripe_fees_cents ?? 0)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Net Platform Revenue</div>
              <div className="mt-2 text-3xl font-bold text-green-600">
                {formatCurrency(analytics?.platform.net_cents ?? 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Top Restaurants */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Restaurants</h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {analytics?.top_restaurants && analytics.top_restaurants.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Restaurant
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.top_restaurants.map((restaurant) => (
                    <tr key={restaurant.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {restaurant.display_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {restaurant.order_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-medium">
                        {formatCurrency(restaurant.revenue_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-gray-500">No data available</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
