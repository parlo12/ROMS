'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price_cents: number;
  photo_url: string | null;
  is_available: boolean;
  sort_order: number;
}

interface Category {
  id: number;
  name: string;
  sort_order: number;
  items: MenuItem[];
}

interface Menu {
  id: number;
  name: string;
  is_active: boolean;
  categories: Category[];
}

interface Location {
  id: number;
  location_name: string;
  restaurant_name: string;
  menu: Menu | null;
}

export default function MenuManagementPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    is_available: true,
  });
  const [saving, setSaving] = useState(false);

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

    fetchLocations();
  }, [router]);

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/dashboard/menus`,
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
        throw new Error('Failed to fetch menus');
      }

      const data = await response.json();
      setLocations(data.locations);
      if (data.locations.length > 0 && !selectedLocationId) {
        setSelectedLocationId(data.locations[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedLocation = locations.find((l) => l.id === selectedLocationId);
  const menu = selectedLocation?.menu;

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  // Category functions
  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '' });
    setShowCategoryModal(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const url = editingCategory
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/dashboard/categories/${editingCategory.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/dashboard/categories`;

      const response = await fetch(url, {
        method: editingCategory ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: categoryForm.name,
          menu_id: menu?.id,
          location_id: selectedLocationId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save category');
      }

      setShowCategoryModal(false);
      fetchLocations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category and all its items?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/dashboard/categories/${categoryId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete category');
      }

      fetchLocations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Item functions
  const openAddItem = (categoryId: number) => {
    setEditingItem(null);
    setSelectedCategoryId(categoryId);
    setItemForm({ name: '', description: '', price: '', is_available: true });
    setShowItemModal(true);
  };

  const openEditItem = (item: MenuItem, categoryId: number) => {
    setEditingItem(item);
    setSelectedCategoryId(categoryId);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: (item.price_cents / 100).toFixed(2),
      is_available: item.is_available,
    });
    setShowItemModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const url = editingItem
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/dashboard/items/${editingItem.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/dashboard/items`;

      const response = await fetch(url, {
        method: editingItem ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: itemForm.name,
          description: itemForm.description,
          price_cents: Math.round(parseFloat(itemForm.price) * 100),
          is_available: itemForm.is_available,
          category_id: selectedCategoryId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save item');
      }

      setShowItemModal(false);
      fetchLocations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/dashboard/items/${itemId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete item');
      }

      fetchLocations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/dashboard/items/${item.id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ is_available: !item.is_available }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update availability');
      }

      fetchLocations();
    } catch (err: any) {
      alert(err.message);
    }
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
              className="border-b-2 border-blue-600 text-blue-600 py-4 px-1 text-sm font-medium"
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

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>

          <div className="flex items-center space-x-4">
            {locations.length > 1 && (
              <select
                value={selectedLocationId || ''}
                onChange={(e) => setSelectedLocationId(parseInt(e.target.value))}
                className="border rounded-md px-3 py-2"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.restaurant_name} - {loc.location_name}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={openAddCategory}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Add Category
            </button>
          </div>
        </div>

        {/* Menu Display */}
        {menu && menu.categories.length > 0 ? (
          <div className="space-y-6">
            {menu.categories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => openAddItem(category.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add Item
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditCategory(category)}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {category.items.length > 0 ? (
                  <div className="divide-y">
                    {category.items.map((item) => (
                      <div
                        key={item.id}
                        className={`px-6 py-4 flex justify-between items-center ${
                          !item.is_available ? 'bg-gray-100 opacity-60' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{item.name}</span>
                            {!item.is_available && (
                              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                                Unavailable
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(item.price_cents)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(item)}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              item.is_available
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {item.is_available ? 'Available' : 'Mark Available'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditItem(item, category.id)}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No items in this category.{' '}
                    <button
                      type="button"
                      onClick={() => openAddItem(category.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Add the first item
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No menu categories yet.</p>
            <button
              type="button"
              onClick={openAddCategory}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Create your first category
            </button>
          </div>
        )}
      </main>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>

              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    required
                    placeholder="e.g., Appetizers, Main Course, Drinks"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingItem ? 'Edit Item' : 'Add Item'}
              </h3>

              <form onSubmit={handleSaveItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_available"
                    checked={itemForm.is_available}
                    onChange={(e) => setItemForm({ ...itemForm, is_available: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_available" className="ml-2 text-sm text-gray-700">
                    Available for ordering
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowItemModal(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
