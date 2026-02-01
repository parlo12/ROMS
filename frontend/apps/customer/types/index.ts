export interface Location {
  id: number;
  restaurant_id: number;
  location_name: string;
  address_line1: string;
  address_line2?: string;
  full_address: string;
  city?: string;
  state?: string;
  zipcode?: string;
  latitude: number;
  longitude: number;
  geofence_radius_meters: number;
  public_location_code: string;
  timezone: string;
  tax_rate: number;
  is_active: boolean;
  phone?: string;
  operating_hours?: Record<string, string[]>;
  restaurant?: Restaurant;
  active_menu?: Menu;
}

export interface Restaurant {
  id: number;
  legal_name: string;
  display_name: string;
  brand_slug?: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  description?: string;
  is_active: boolean;
}

export interface Menu {
  id: number;
  location_id: number;
  name: string;
  description?: string;
  is_active: boolean;
  categories: MenuCategory[];
}

export interface MenuCategory {
  id: number;
  menu_id: number;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  items: MenuItem[];
}

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  price_cents: number;
  price: number;
  formatted_price: string;
  photo_url?: string;
  is_available: boolean;
  sort_order: number;
  preparation_time_minutes?: number;
  allergens?: string[];
  dietary_info?: string[];
  options?: MenuItemOption[];
}

export interface MenuItemOption {
  id: number;
  item_id: number;
  name: string;
  selection_type: 'single' | 'multiple';
  required: boolean;
  min_selections: number;
  max_selections?: number;
  sort_order: number;
  values: MenuItemOptionValue[];
}

export interface MenuItemOptionValue {
  id: number;
  option_id: number;
  name: string;
  price_delta_cents: number;
  price_delta: number;
  formatted_price_delta: string;
  is_available: boolean;
  sort_order: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  modifiers: SelectedModifier[];
  specialInstructions?: string;
}

export interface SelectedModifier {
  option_name: string;
  value_name: string;
  price_delta_cents: number;
}

export interface Order {
  id: number;
  location_id: number;
  order_number: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: 'cash' | 'card';
  subtotal_cents: number;
  subtotal: number;
  tax_cents: number;
  tax: number;
  tip_cents: number;
  tip: number;
  total_cents: number;
  total: number;
  formatted_total: string;
  table_number?: string;
  customer_name?: string;
  customer_phone?: string;
  special_instructions?: string;
  placed_at: string;
  accepted_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancelled_reason?: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  name_snapshot: string;
  unit_price_cents_snapshot: number;
  unit_price: number;
  quantity: number;
  line_total_cents: number;
  line_total: number;
  formatted_line_total: string;
  special_instructions?: string;
  modifiers: OrderItemModifier[];
}

export interface OrderItemModifier {
  id: number;
  order_item_id: number;
  option_name: string;
  value_name: string;
  price_delta_cents: number;
  price_delta: number;
}

export type OrderStatus = 'placed' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';

export interface GeoVerification {
  verified: boolean;
  geo_token: string;
  expires_at: string;
  distance_meters: number;
}

export interface OrderTotals {
  subtotal_cents: number;
  tax_cents: number;
  tip_cents: number;
  total_cents: number;
}
