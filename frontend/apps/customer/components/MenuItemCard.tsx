'use client';

import type { MenuItem } from '@/types';

interface MenuItemCardProps {
  item: MenuItem;
  onClick: () => void;
}

export default function MenuItemCard({ item, onClick }: MenuItemCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-lg shadow-sm border p-4 text-left hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-4">
          <h3 className="font-medium text-gray-900">{item.name}</h3>
          {item.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
          <p className="text-primary-600 font-semibold mt-2">
            {item.formatted_price}
          </p>
        </div>
        {item.photo_url && (
          <img
            src={item.photo_url}
            alt={item.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
        )}
      </div>
    </button>
  );
}
