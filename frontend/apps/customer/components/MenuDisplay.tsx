'use client';

import { useState } from 'react';
import type { Menu, MenuItem } from '@/types';
import MenuItemCard from './MenuItemCard';
import MenuItemModal from './MenuItemModal';

interface MenuDisplayProps {
  menu: Menu;
}

export default function MenuDisplay({ menu }: MenuDisplayProps) {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  return (
    <div className="space-y-8">
      {menu.categories.map((category) => (
        <section key={category.id}>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {category.name}
          </h2>
          {category.description && (
            <p className="text-sm text-gray-500 mb-4">{category.description}</p>
          )}
          <div className="space-y-3">
            {category.items.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        </section>
      ))}

      {selectedItem && (
        <MenuItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
