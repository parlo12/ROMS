'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Location {
  id: number;
  location_name: string;
  full_address: string;
  is_active: boolean;
  public_location_code: string;
}

interface Restaurant {
  id: number;
  legal_name: string;
  display_name: string;
  brand_slug: string;
  is_active: boolean;
  created_at: string;
  locations: Location[];
  owner: {
    id: number;
    name: string;
    email: string;
  };
}

export default function AdminRestaurantsPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
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

    fetchRestaurants();
  }, [router]);

  const fetchRestaurants = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/admin/restaurants`,
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
        throw new Error('Failed to fetch restaurants');
      }

      const data = await response.json();
      setRestaurants(data.restaurants);
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
              className="border-b-2 border-blue-600 text-blue-600 py-4 px-1 text-sm font-medium"
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

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Restaurants</h2>
          <button
            type="button"
            disabled
            className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
          >
            Add Restaurant (Coming Soon)
          </button>
        </div>

        {restaurants.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No restaurants registered yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {restaurant.display_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Legal: {restaurant.legal_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Slug: {restaurant.brand_slug}
                      </p>
                    </div>
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

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium mr-2">Owner:</span>
                      {restaurant.owner.name} ({restaurant.owner.email})
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <span className="font-medium mr-2">Created:</span>
                      {new Date(restaurant.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Locations ({restaurant.locations.length})
                    </h4>
                    {restaurant.locations.length === 0 ? (
                      <p className="text-sm text-gray-400">No locations</p>
                    ) : (
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
                              <div className="text-xs text-gray-500">
                                {location.full_address}
                              </div>
                              <div className="text-xs text-blue-500 font-mono mt-1">
                                Code: {location.public_location_code}
                              </div>
                            </div>
                            <div className="flex items-center">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  location.is_active
                                    ? 'bg-green-500'
                                    : 'bg-red-500'
                                }`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
