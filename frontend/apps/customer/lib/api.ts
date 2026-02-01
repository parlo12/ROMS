import axios from 'axios';
import type {
  Location,
  Menu,
  GeoVerification,
  Order,
  OrderTotals,
  CartItem,
} from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export async function getLocation(publicCode: string): Promise<Location> {
  const response = await api.get(`/locations/${publicCode}`);
  return response.data.location;
}

export async function getMenu(publicCode: string): Promise<{ menu: Menu | null; tax_rate: number }> {
  const response = await api.get(`/locations/${publicCode}/menu`);
  return response.data;
}

export async function verifyLocation(
  publicCode: string,
  latitude: number,
  longitude: number,
  deviceFingerprint?: string
): Promise<GeoVerification> {
  const response = await api.post(`/locations/${publicCode}/verify`, {
    latitude,
    longitude,
    device_fingerprint: deviceFingerprint,
  });
  return response.data;
}

export async function calculateTotal(
  publicCode: string,
  items: Array<{
    menu_item_id: number;
    quantity: number;
    modifiers: Array<{ price_delta_cents: number }>;
  }>,
  tipCents: number = 0
): Promise<OrderTotals> {
  const response = await api.post(`/locations/${publicCode}/calculate-total`, {
    items,
    tip_cents: tipCents,
  });
  return response.data;
}

export async function createOrder(
  publicCode: string,
  data: {
    geo_token: string;
    payment_method: 'cash' | 'card';
    table_number?: string;
    customer_name?: string;
    customer_phone?: string;
    special_instructions?: string;
    tip_cents?: number;
    items: Array<{
      menu_item_id: number;
      quantity: number;
      special_instructions?: string;
      modifiers?: Array<{
        option_name: string;
        value_name: string;
        price_delta_cents: number;
      }>;
    }>;
  }
): Promise<Order> {
  const response = await api.post(`/locations/${publicCode}/orders`, data);
  return response.data.order;
}

export async function getOrder(publicCode: string, orderId: number): Promise<Order> {
  const response = await api.get(`/locations/${publicCode}/orders/${orderId}`);
  return response.data.order;
}

export async function getOrderStatus(
  publicCode: string,
  orderId: number
): Promise<{
  order_id: number;
  order_number: number;
  status: string;
  payment_status: string;
  placed_at: string;
  accepted_at?: string;
  completed_at?: string;
}> {
  const response = await api.get(`/locations/${publicCode}/orders/${orderId}/status`);
  return response.data;
}

export async function createPaymentIntent(
  publicCode: string,
  orderId: number
): Promise<{ client_secret: string; payment_intent_id: string }> {
  const response = await api.post(`/locations/${publicCode}/orders/${orderId}/payment-intent`);
  return response.data;
}

export default api;
