'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
  id: number;
  order_number: number;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number;
  formatted_total: string;
  table_number?: string;
  customer_name?: string;
  placed_at: string;
  items: Array<{
    id: number;
    name_snapshot: string;
    quantity: number;
    formatted_line_total: string;
  }>;
}

interface User {
  id: number;
  name: string;
  email: string;
  is_platform_admin: boolean;
  is_owner?: boolean;
  locations?: Array<{ id: number; location_name: string }>;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [locations, setLocations] = useState<Array<{ id: number; location_name: string }>>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);

    // Platform admin should go to admin dashboard
    if (userData.is_platform_admin) {
      router.replace('/admin');
      return;
    }

    if (userData.locations && userData.locations.length > 0) {
      setLocations(userData.locations);
      setSelectedLocationId(userData.locations[0].id);
    } else {
      // No locations assigned - stop loading and show message
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!selectedLocationId) return;

    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/dashboard/orders?location_id=${selectedLocationId}`,
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
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        setOrders(data.orders);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [selectedLocationId, router]);

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/dashboard/orders/${orderId}/status`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const data = await response.json();
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? data.order : order))
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-purple-100 text-purple-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  // No locations assigned
  if (locations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">
              {user?.is_owner ? 'Owner Dashboard' : 'Orders'}
            </h1>
            <button
              type="button"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </header>
        {/* Navigation for Owners */}
        {user?.is_owner && (
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
                  className="border-b-2 border-blue-600 text-blue-600 py-4 px-1 text-sm font-medium"
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
        )}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-2">No locations assigned to your account.</p>
            <p className="text-sm text-gray-400">
              {user?.is_owner
                ? 'Go to the Overview page to see your restaurants and add staff.'
                : 'Please contact your administrator to get access to a restaurant location.'}
            </p>
            {user?.is_owner && (
              <Link
                href="/dashboard"
                className="mt-4 inline-block bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Go to Overview
              </Link>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            {user?.is_owner ? 'Owner Dashboard' : 'Orders'}
          </h1>
          <div className="flex items-center space-x-4">
            {locations.length > 1 && (
              <select
                value={selectedLocationId || ''}
                onChange={(e) => setSelectedLocationId(Number(e.target.value))}
                className="border rounded-md px-3 py-2"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.location_name}
                  </option>
                ))}
              </select>
            )}
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

      {/* Navigation for Owners */}
      {user?.is_owner && (
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
                className="border-b-2 border-blue-600 text-blue-600 py-4 px-1 text-sm font-medium"
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
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No orders for today</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-2xl font-bold">#{order.order_number}</span>
                    {order.table_number && (
                      <span className="ml-2 text-gray-500">
                        Table {order.table_number}
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status.toUpperCase()}
                  </span>
                </div>

                {order.customer_name && (
                  <p className="text-sm text-gray-600 mb-2">
                    {order.customer_name}
                  </p>
                )}

                <div className="border-t border-b py-2 my-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span>
                        {item.quantity}x {item.name_snapshot}
                      </span>
                      <span className="text-gray-500">
                        {item.formatted_line_total}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">{order.formatted_total}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                  <span>
                    {order.payment_method.toUpperCase()} -{' '}
                    {order.payment_status.toUpperCase()}
                  </span>
                  <span>{new Date(order.placed_at).toLocaleTimeString()}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {order.status === 'placed' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'accepted')}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium"
                    >
                      Accept
                    </button>
                  )}
                  {order.status === 'accepted' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium"
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium"
                    >
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="flex-1 bg-gray-600 text-white py-2 rounded-lg text-sm font-medium"
                    >
                      Complete
                    </button>
                  )}
                  {['placed', 'accepted'].includes(order.status) && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="bg-red-100 text-red-600 py-2 px-4 rounded-lg text-sm font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
