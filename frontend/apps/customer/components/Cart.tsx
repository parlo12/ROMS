'use client';

import { useCartStore } from '@/lib/store';

interface CartProps {
  taxRate: number;
  onClose: () => void;
  onCheckout: () => void;
}

export default function Cart({ taxRate, onClose, onCheckout }: CartProps) {
  const { items, updateItemQuantity, removeItem, getSubtotalCents } = useCartStore();

  const subtotalCents = getSubtotalCents();
  const taxCents = Math.round(subtotalCents * taxRate);
  const totalCents = subtotalCents + taxCents;

  if (items.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
        <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Your cart is empty</p>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Cart</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="p-4 space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex items-start justify-between border-b pb-4">
              <div className="flex-1">
                <h3 className="font-medium">{item.menuItem.name}</h3>
                {item.modifiers.length > 0 && (
                  <p className="text-sm text-gray-500">
                    {item.modifiers.map((m) => m.value_name).join(', ')}
                  </p>
                )}
                {item.specialInstructions && (
                  <p className="text-sm text-gray-400 italic">
                    {item.specialInstructions}
                  </p>
                )}
                <div className="flex items-center mt-2">
                  <button
                    onClick={() => updateItemQuantity(index, item.quantity - 1)}
                    className="w-8 h-8 rounded-full border flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="mx-3 font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateItemQuantity(index, item.quantity + 1)}
                    className="w-8 h-8 rounded-full border flex items-center justify-center"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(index)}
                    className="ml-4 text-red-500 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="text-right">
                <span className="font-medium">
                  ${(
                    ((item.menuItem.price_cents +
                      item.modifiers.reduce((sum, m) => sum + m.price_delta_cents, 0)) *
                      item.quantity) /
                    100
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="border-t p-4 space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>${(subtotalCents / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
            <span>${(taxCents / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
            <span>Total</span>
            <span>${(totalCents / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <button
            onClick={onCheckout}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
