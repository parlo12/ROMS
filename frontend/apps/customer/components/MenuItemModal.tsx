'use client';

import { useState } from 'react';
import type { MenuItem, SelectedModifier } from '@/types';
import { useCartStore } from '@/lib/store';

interface MenuItemModalProps {
  item: MenuItem;
  onClose: () => void;
}

export default function MenuItemModal({ item, onClose }: MenuItemModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<number, number[]>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const { addItem } = useCartStore();

  const handleOptionSelect = (optionId: number, valueId: number, isSingle: boolean) => {
    setSelectedModifiers((prev) => {
      if (isSingle) {
        return { ...prev, [optionId]: [valueId] };
      }
      const current = prev[optionId] || [];
      if (current.includes(valueId)) {
        return { ...prev, [optionId]: current.filter((id) => id !== valueId) };
      }
      return { ...prev, [optionId]: [...current, valueId] };
    });
  };

  const isValueSelected = (optionId: number, valueId: number) => {
    return selectedModifiers[optionId]?.includes(valueId) || false;
  };

  const calculateTotal = () => {
    let total = item.price_cents * quantity;
    Object.entries(selectedModifiers).forEach(([optionId, valueIds]) => {
      const option = item.options?.find((o) => o.id === parseInt(optionId));
      if (option) {
        valueIds.forEach((valueId) => {
          const value = option.values.find((v) => v.id === valueId);
          if (value) {
            total += value.price_delta_cents * quantity;
          }
        });
      }
    });
    return total;
  };

  const handleAddToCart = () => {
    const modifiers: SelectedModifier[] = [];
    Object.entries(selectedModifiers).forEach(([optionId, valueIds]) => {
      const option = item.options?.find((o) => o.id === parseInt(optionId));
      if (option) {
        valueIds.forEach((valueId) => {
          const value = option.values.find((v) => v.id === valueId);
          if (value) {
            modifiers.push({
              option_name: option.name,
              value_name: value.name,
              price_delta_cents: value.price_delta_cents,
            });
          }
        });
      }
    });

    addItem(item, quantity, modifiers, specialInstructions || undefined);
    onClose();
  };

  const isValid = () => {
    if (!item.options) return true;
    return item.options.every((option) => {
      if (!option.required) return true;
      const selected = selectedModifiers[option.id] || [];
      return selected.length >= (option.min_selections || 1);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{item.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Description */}
          {item.description && (
            <p className="text-gray-600">{item.description}</p>
          )}

          {/* Options */}
          {item.options?.map((option) => (
            <div key={option.id}>
              <h3 className="font-medium text-gray-900 mb-2">
                {option.name}
                {option.required && <span className="text-red-500 ml-1">*</span>}
              </h3>
              <div className="space-y-2">
                {option.values.map((value) => (
                  <label
                    key={value.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                      isValueSelected(option.id, value.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type={option.selection_type === 'single' ? 'radio' : 'checkbox'}
                        name={`option-${option.id}`}
                        checked={isValueSelected(option.id, value.id)}
                        onChange={() =>
                          handleOptionSelect(option.id, value.id, option.selection_type === 'single')
                        }
                        className="mr-3"
                      />
                      <span>{value.name}</span>
                    </div>
                    {value.price_delta_cents !== 0 && (
                      <span className="text-gray-500">
                        {value.formatted_price_delta}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* Special Instructions */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Special Instructions</h3>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests?"
              className="w-full border rounded-lg p-3 text-sm"
              rows={2}
            />
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Quantity</span>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full border flex items-center justify-center"
              >
                -
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full border flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <button
            onClick={handleAddToCart}
            disabled={!isValid()}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add to Cart - ${(calculateTotal() / 100).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
