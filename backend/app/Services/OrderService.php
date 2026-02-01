<?php

namespace App\Services;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemModifier;
use App\Models\OrderSequence;
use App\Models\PlatformFee;
use App\Models\RestaurantLocation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService
{
    public function createOrder(
        RestaurantLocation $location,
        array $items,
        string $paymentMethod,
        ?string $tableNumber = null,
        ?string $customerName = null,
        ?string $customerPhone = null,
        ?string $specialInstructions = null,
        int $tipCents = 0
    ): Order {
        return DB::transaction(function () use (
            $location,
            $items,
            $paymentMethod,
            $tableNumber,
            $customerName,
            $customerPhone,
            $specialInstructions,
            $tipCents
        ) {
            $orderNumber = OrderSequence::getNextOrderNumber($location->id);
            $sessionId = Str::random(config('roms.orders.session_id_length', 32));

            $subtotalCents = 0;
            $processedItems = [];

            foreach ($items as $itemData) {
                $menuItem = MenuItem::findOrFail($itemData['menu_item_id']);

                $itemPrice = $menuItem->price_cents;
                $modifiersTotalCents = 0;
                $modifiers = [];

                if (!empty($itemData['modifiers'])) {
                    foreach ($itemData['modifiers'] as $modifier) {
                        $modifiersTotalCents += $modifier['price_delta_cents'] ?? 0;
                        $modifiers[] = $modifier;
                    }
                }

                $quantity = $itemData['quantity'] ?? 1;
                $lineTotalCents = ($itemPrice + $modifiersTotalCents) * $quantity;
                $subtotalCents += $lineTotalCents;

                $processedItems[] = [
                    'menu_item' => $menuItem,
                    'quantity' => $quantity,
                    'unit_price_cents' => $itemPrice,
                    'line_total_cents' => $lineTotalCents,
                    'modifiers' => $modifiers,
                    'special_instructions' => $itemData['special_instructions'] ?? null,
                ];
            }

            $taxCents = (int) round($subtotalCents * $location->tax_rate);
            $totalCents = $subtotalCents + $taxCents + $tipCents;

            $order = Order::create([
                'location_id' => $location->id,
                'order_number' => $orderNumber,
                'status' => Order::STATUS_PLACED,
                'payment_status' => $paymentMethod === Order::METHOD_CASH
                    ? Order::PAYMENT_UNPAID
                    : Order::PAYMENT_PENDING,
                'payment_method' => $paymentMethod,
                'subtotal_cents' => $subtotalCents,
                'tax_cents' => $taxCents,
                'tip_cents' => $tipCents,
                'total_cents' => $totalCents,
                'table_number' => $tableNumber,
                'customer_session_id' => $sessionId,
                'customer_name' => $customerName,
                'customer_phone' => $customerPhone,
                'special_instructions' => $specialInstructions,
                'placed_at' => now(),
            ]);

            foreach ($processedItems as $processedItem) {
                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $processedItem['menu_item']->id,
                    'name_snapshot' => $processedItem['menu_item']->name,
                    'unit_price_cents_snapshot' => $processedItem['unit_price_cents'],
                    'quantity' => $processedItem['quantity'],
                    'line_total_cents' => $processedItem['line_total_cents'],
                    'special_instructions' => $processedItem['special_instructions'],
                ]);

                foreach ($processedItem['modifiers'] as $modifier) {
                    OrderItemModifier::create([
                        'order_item_id' => $orderItem->id,
                        'option_name' => $modifier['option_name'],
                        'value_name' => $modifier['value_name'],
                        'price_delta_cents' => $modifier['price_delta_cents'] ?? 0,
                    ]);
                }
            }

            return $order->load('items.modifiers');
        });
    }

    public function createPlatformFee(Order $order, int $stripeFee = 0, ?string $chargeId = null, ?string $balanceTransactionId = null): PlatformFee
    {
        $feeData = PlatformFee::calculateForOrder($order, $stripeFee);

        return PlatformFee::create([
            'order_id' => $order->id,
            'gross_amount_cents' => $feeData['gross_amount_cents'],
            'platform_fee_cents' => $feeData['platform_fee_cents'],
            'stripe_fee_cents' => $feeData['stripe_fee_cents'],
            'restaurant_payout_cents' => $feeData['restaurant_payout_cents'],
            'platform_net_cents' => $feeData['platform_net_cents'],
            'stripe_charge_id' => $chargeId,
            'stripe_balance_transaction_id' => $balanceTransactionId,
        ]);
    }

    public function calculateOrderTotal(array $items, float $taxRate, int $tipCents = 0): array
    {
        $subtotalCents = 0;

        foreach ($items as $itemData) {
            $menuItem = MenuItem::find($itemData['menu_item_id']);
            if (!$menuItem) {
                continue;
            }

            $itemPrice = $menuItem->price_cents;
            $modifiersTotalCents = 0;

            if (!empty($itemData['modifiers'])) {
                foreach ($itemData['modifiers'] as $modifier) {
                    $modifiersTotalCents += $modifier['price_delta_cents'] ?? 0;
                }
            }

            $quantity = $itemData['quantity'] ?? 1;
            $subtotalCents += ($itemPrice + $modifiersTotalCents) * $quantity;
        }

        $taxCents = (int) round($subtotalCents * $taxRate);
        $totalCents = $subtotalCents + $taxCents + $tipCents;

        return [
            'subtotal_cents' => $subtotalCents,
            'tax_cents' => $taxCents,
            'tip_cents' => $tipCents,
            'total_cents' => $totalCents,
        ];
    }
}
