'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getOrder, getOrderStatus } from '@/lib/api';
import type { Order } from '@/types';

const STATUS_STEPS = [
  { key: 'placed', label: 'Order Placed', description: 'Your order has been received' },
  { key: 'accepted', label: 'Confirmed', description: 'Restaurant confirmed your order' },
  { key: 'preparing', label: 'Preparing', description: 'Your food is being prepared' },
  { key: 'ready', label: 'Ready', description: 'Your order is ready for pickup' },
  { key: 'completed', label: 'Completed', description: 'Order completed' },
];

const STATUS_INDEX: Record<string, number> = {
  placed: 0,
  accepted: 1,
  preparing: 2,
  ready: 3,
  completed: 4,
  cancelled: -1,
};

export default function OrderStatusPage() {
  const params = useParams();
  const code = params.code as string;
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        const orderData = await getOrder(code, parseInt(orderId));
        setOrder(orderData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [code, orderId]);

  // Poll for status updates
  useEffect(() => {
    if (!order || order.status === 'completed' || order.status === 'cancelled') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const status = await getOrderStatus(code, parseInt(orderId));
        if (status.status !== order.status) {
          const orderData = await getOrder(code, parseInt(orderId));
          setOrder(orderData);
        }
      } catch (err) {
        console.error('Failed to fetch status', err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [code, orderId, order?.status]);

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const currentStatusIndex = order ? STATUS_INDEX[order.status] : -1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'Order not found'}</p>
          <Link
            href={`/r/${code}`}
            className="mt-4 inline-block text-primary-600 hover:underline"
          >
            Return to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 text-center">
          <div className="text-4xl mb-2">
            {order.status === 'cancelled' ? '❌' : order.status === 'completed' ? '✅' : '🍽️'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.order_number}
          </h1>
          {order.table_number && (
            <p className="text-gray-500">Table {order.table_number}</p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Status */}
        {order.status === 'cancelled' ? (
          <section className="bg-red-50 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Order Cancelled</h2>
            {order.cancelled_reason && (
              <p className="text-red-600">{order.cancelled_reason}</p>
            )}
          </section>
        ) : (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold text-gray-900 mb-6">Order Status</h2>
            <div className="space-y-4">
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = currentStatusIndex > index;
                const isCurrent = currentStatusIndex === index;

                return (
                  <div key={step.key} className="flex items-start">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isCurrent
                            ? 'bg-primary-600 text-white animate-pulse'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p
                        className={`font-medium ${
                          isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-sm text-gray-500">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Order Details */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Order Details</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <span className="font-medium">{item.quantity}x</span> {item.name_snapshot}
                  {item.modifiers.length > 0 && (
                    <div className="text-xs text-gray-500 ml-4">
                      {item.modifiers.map((mod) => mod.value_name).join(', ')}
                    </div>
                  )}
                </div>
                <span>{item.formatted_line_total}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatCurrency(order.subtotal_cents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span>{formatCurrency(order.tax_cents)}</span>
            </div>
            {order.tip_cents > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tip</span>
                <span>{formatCurrency(order.tip_cents)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{order.formatted_total}</span>
            </div>
          </div>
        </section>

        {/* Payment Info */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Payment</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">
                {order.payment_method === 'cash' ? 'Pay with Cash' : 'Pay with Card'}
              </p>
              <p className="text-sm text-gray-500">
                Status:{' '}
                <span
                  className={
                    order.payment_status === 'paid'
                      ? 'text-green-600'
                      : order.payment_status === 'failed'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }
                >
                  {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </span>
              </p>
            </div>
            <div className="text-2xl">
              {order.payment_method === 'cash' ? '💵' : '💳'}
            </div>
          </div>
        </section>

        {/* Order Time */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Order Timeline</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Placed at</span>
              <span>{new Date(order.placed_at).toLocaleString()}</span>
            </div>
            {order.accepted_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Accepted at</span>
                <span>{new Date(order.accepted_at).toLocaleString()}</span>
              </div>
            )}
            {order.completed_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Completed at</span>
                <span>{new Date(order.completed_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        </section>

        {/* Order Again */}
        <Link
          href={`/r/${code}`}
          className="block w-full bg-primary-600 text-white text-center py-4 px-4 rounded-lg font-semibold"
        >
          Order Again
        </Link>
      </main>
    </div>
  );
}
