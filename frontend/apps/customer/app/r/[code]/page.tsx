'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getLocation, getMenu, verifyLocation } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import type { Location, Menu } from '@/types';
import MenuDisplay from '@/components/MenuDisplay';
import Cart from '@/components/Cart';
import LocationVerification from '@/components/LocationVerification';

export default function LocationPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [location, setLocation] = useState<Location | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [taxRate, setTaxRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const { isGeoTokenValid, setGeoToken, getItemCount } = useCartStore();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [locationData, menuData] = await Promise.all([
          getLocation(code),
          getMenu(code),
        ]);
        setLocation(locationData);
        setMenu(menuData.menu);
        setTaxRate(menuData.tax_rate);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load restaurant');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [code]);

  const handleVerifyLocation = async (latitude: number, longitude: number) => {
    try {
      const result = await verifyLocation(code, latitude, longitude);
      setGeoToken(result.geo_token, result.expires_at);
      setNeedsVerification(false);
      return true;
    } catch (err: any) {
      throw new Error(err.response?.data?.errors?.location?.[0] || 'Location verification failed');
    }
  };

  const handleCheckout = () => {
    if (!isGeoTokenValid()) {
      setNeedsVerification(true);
      return;
    }
    router.push(`/r/${code}/checkout`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!location || !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Menu Not Available</h1>
          <p className="text-gray-600">This restaurant doesn&apos;t have an active menu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">
            {location.restaurant?.display_name}
          </h1>
          <p className="text-sm text-gray-500">{location.location_name}</p>
        </div>
      </header>

      {/* Menu */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
        <MenuDisplay menu={menu} />
      </main>

      {/* Cart Button */}
      {getItemCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setShowCart(true)}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-between"
            >
              <span>View Cart ({getItemCount()} items)</span>
              <span>${(useCartStore.getState().getSubtotalCents() / 100).toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <Cart
          taxRate={taxRate}
          onClose={() => setShowCart(false)}
          onCheckout={handleCheckout}
        />
      )}

      {/* Location Verification Modal */}
      {needsVerification && (
        <LocationVerification
          onVerify={handleVerifyLocation}
          onClose={() => setNeedsVerification(false)}
        />
      )}
    </div>
  );
}
