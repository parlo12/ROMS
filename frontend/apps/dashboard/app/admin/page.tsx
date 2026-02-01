'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  name: string;
  email: string;
  is_platform_admin: boolean;
}

interface Stats {
  today: {
    orders: number;
    revenue_cents: number;
    platform_fees_cents: number;
  };
  restaurants: {
    total: number;
    active: number;
  };
  locations: {
    total: number;
    active: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
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

    setUser(userData);
    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/admin/dashboard`,
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
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
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
              href="/admin"
              className="border-b-2 border-blue-600 text-blue-600 py-4 px-1 text-sm font-medium"
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
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium"
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

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Restaurants</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {stats?.restaurants.total ?? '-'}
            </div>
            <div className="text-sm text-green-600 mt-1">
              {stats?.restaurants.active ?? 0} active
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Locations</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {stats?.locations.total ?? '-'}
            </div>
            <div className="text-sm text-green-600 mt-1">
              {stats?.locations.active ?? 0} active
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Orders Today</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {stats?.today.orders ?? 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Revenue Today</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              ${stats?.today.revenue_cents ? (stats.today.revenue_cents / 100).toFixed(2) : '0.00'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Platform Fees Today</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">
              ${stats?.today.platform_fees_cents ? (stats.today.platform_fees_cents / 100).toFixed(2) : '0.00'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Fee Rate</div>
            <div className="mt-2 text-3xl font-bold text-orange-600">
              3%
            </div>
            <div className="text-sm text-gray-500 mt-1">platform commission</div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/restaurants"
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="font-medium text-gray-900">View Restaurants</div>
              <div className="text-sm text-gray-500 mt-1">Manage all restaurants</div>
            </Link>
            <Link
              href="/admin/analytics"
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="font-medium text-gray-900">View Analytics</div>
              <div className="text-sm text-gray-500 mt-1">Platform-wide metrics</div>
            </Link>
            <Link
              href="/admin/revenue"
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="font-medium text-gray-900">Revenue Report</div>
              <div className="text-sm text-gray-500 mt-1">Fees and payouts</div>
            </Link>
            <div className="bg-gray-50 rounded-lg shadow p-4 border-2 border-dashed border-gray-300">
              <div className="font-medium text-gray-400">Add Restaurant</div>
              <div className="text-sm text-gray-400 mt-1">Coming soon</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
