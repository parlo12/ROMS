<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\CreateOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\RestaurantLocation;
use App\Services\GeofenceService;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function __construct(
        private OrderService $orderService,
        private GeofenceService $geofenceService
    ) {}

    public function store(CreateOrderRequest $request, string $publicCode): JsonResponse
    {
        $location = RestaurantLocation::where('public_location_code', $publicCode)
            ->where('is_active', true)
            ->firstOrFail();

        $geoToken = $this->geofenceService->validateGeoToken(
            $request->geo_token,
            $location->id
        );

        if (!$geoToken) {
            throw ValidationException::withMessages([
                'geo_token' => ['Invalid or expired location verification. Please verify your location again.'],
            ]);
        }

        $order = $this->orderService->createOrder(
            $location,
            $request->items,
            $request->payment_method,
            $request->table_number,
            $request->customer_name,
            $request->customer_phone,
            $request->special_instructions,
            $request->tip_cents ?? 0
        );

        $geoToken->markUsed();

        if ($order->payment_method === Order::METHOD_CASH) {
            $this->orderService->createPlatformFee($order);
        }

        return response()->json([
            'order' => new OrderResource($order->load('items.modifiers')),
            'message' => 'Order placed successfully',
        ], 201);
    }

    public function show(string $publicCode, int $orderId): JsonResponse
    {
        $location = RestaurantLocation::where('public_location_code', $publicCode)
            ->where('is_active', true)
            ->firstOrFail();

        $order = Order::with(['items.modifiers'])
            ->where('location_id', $location->id)
            ->findOrFail($orderId);

        return response()->json([
            'order' => new OrderResource($order),
        ]);
    }

    public function status(string $publicCode, int $orderId): JsonResponse
    {
        $location = RestaurantLocation::where('public_location_code', $publicCode)
            ->firstOrFail();

        $order = Order::where('location_id', $location->id)
            ->findOrFail($orderId);

        return response()->json([
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'placed_at' => $order->placed_at,
            'accepted_at' => $order->accepted_at,
            'completed_at' => $order->completed_at,
        ]);
    }

    public function calculateTotal(Request $request, string $publicCode): JsonResponse
    {
        $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.menu_item_id' => ['required', 'integer', 'exists:menu_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.modifiers' => ['nullable', 'array'],
            'items.*.modifiers.*.price_delta_cents' => ['required_with:items.*.modifiers', 'integer'],
            'tip_cents' => ['nullable', 'integer', 'min:0'],
        ]);

        $location = RestaurantLocation::where('public_location_code', $publicCode)
            ->where('is_active', true)
            ->firstOrFail();

        $totals = $this->orderService->calculateOrderTotal(
            $request->items,
            (float) $location->tax_rate,
            $request->tip_cents ?? 0
        );

        return response()->json($totals);
    }
}
