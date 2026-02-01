'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getLocation, createOrder, calculateTotal } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import type { Location, OrderTotals } from '@/types';

const TIP_OPTIONS = [
  { label: 'No Tip', percent: 0 },
  { label: '15%', percent: 15 },
  { label: '18%', percent: 18 },
  { label: '20%', percent: 20 },
  { label: '25%', percent: 25 },
];

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const { items, geoToken, isGeoTokenValid, clearCart, getSubtotalCents } = useCartStore();

  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('card');
  const [selectedTipPercent, setSelectedTipPercent] = useState(18);
  const [customTip, setCustomTip] = useState('');

  const [totals, setTotals] = useState<OrderTotals | null>(null);

  useEffect(() => {
    if (!isGeoTokenValid()) {
      router.replace(`/r/${code}`);
      return;
    }

    if (items.length === 0) {
      router.replace(`/r/${code}`);
      return;
    }

    async function loadLocation() {
      try {
        const locationData = await getLocation(code);
        setLocation(locationData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load location');
      } finally {
        setLoading(false);
      }
    }
    loadLocation();
  }, [code, router, isGeoTokenValid, items.length]);

  useEffect(() => {
    if (!location || items.length === 0) return;

    async function fetchTotals() {
      const subtotal = getSubtotalCents();
      const tipCents = customTip
        ? Math.round(parseFloat(customTip) * 100)
        : Math.round((subtotal * selectedTipPercent) / 100);

      try {
        const result = await calculateTotal(
          code,
          items.map((item) => ({
            menu_item_id: item.menuItem.id,
            quantity: item.quantity,
            modifiers: item.modifiers,
          })),
          tipCents
        );
        setTotals(result);
      } catch (err) {
        console.error('Failed to calculate totals', err);
      }
    }

    fetchTotals();
  }, [code, items, selectedTipPercent, customTip, location, getSubtotalCents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!geoToken) {
      setError('Location verification expired. Please go back and verify again.');
      return;
    }

    if (!tableNumber.trim()) {
      setError('Please enter your table number.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const subtotal = getSubtotalCents();
      const tipCents = customTip
        ? Math.round(parseFloat(customTip) * 100)
        : Math.round((subtotal * selectedTipPercent) / 100);

      const order = await createOrder(code, {
        geo_token: geoToken,
        payment_method: paymentMethod,
        table_number: tableNumber.trim(),
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        special_instructions: specialInstructions.trim() || undefined,
        tip_cents: tipCents,
        items: items.map((item) => ({
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          special_instructions: item.specialInstructions,
          modifiers: item.modifiers,
        })),
      });

      clearCart();
      router.push(`/r/${code}/order/${order.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'Location not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center">
          <Link href={`/r/${code}`} className="mr-4 text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
            <p className="text-sm text-gray-500">{location.restaurant?.display_name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <section className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{item.quantity}x</span> {item.menuItem.name}
                    {item.modifiers.length > 0 && (
                      <div className="text-xs text-gray-500 ml-4">
                        {item.modifiers.map((mod) => mod.value_name).join(', ')}
                      </div>
                    )}
                  </div>
                  <span>
                    {formatCurrency(
                      (item.menuItem.price_cents +
                        item.modifiers.reduce((sum, m) => sum + m.price_delta_cents, 0)) *
                        item.quantity
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Table Number */}
          <section className="bg-white rounded-lg shadow p-4">
            <label htmlFor="tableNumber" className="block font-semibold text-gray-900 mb-2">
              Table Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="tableNumber"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Enter your table number"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </section>

          {/* Customer Info (Optional) */}
          <section className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Your Information (Optional)</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="customerName" className="block text-sm text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="customerPhone" className="block text-sm text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Your phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="specialInstructions" className="block text-sm text-gray-700 mb-1">
                  Special Instructions
                </label>
                <textarea
                  id="specialInstructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special requests for your order"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </section>

          {/* Tip Selection */}
          <section className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Add a Tip</h2>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {TIP_OPTIONS.map((option) => (
                <button
                  key={option.percent}
                  type="button"
                  onClick={() => {
                    setSelectedTipPercent(option.percent);
                    setCustomTip('');
                  }}
                  className={`py-2 px-3 rounded-lg text-sm font-medium ${
                    selectedTipPercent === option.percent && !customTip
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div>
              <label htmlFor="customTip" className="block text-sm text-gray-700 mb-1">
                Or enter custom amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="customTip"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="ml-3">Pay with Card (at table)</span>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="ml-3">Pay with Cash</span>
              </label>
            </div>
          </section>

          {/* Totals */}
          {totals && (
            <section className="bg-white rounded-lg shadow p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(totals.subtotal_cents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>{formatCurrency(totals.tax_cents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tip</span>
                  <span>{formatCurrency(totals.tip_cents)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(totals.total_cents)}</span>
                </div>
              </div>
            </section>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !tableNumber.trim()}
            className="w-full bg-primary-600 text-white py-4 px-4 rounded-lg font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? 'Placing Order...' : `Place Order${totals ? ` - ${formatCurrency(totals.total_cents)}` : ''}`}
          </button>
        </form>
      </main>
    </div>
  );
}
