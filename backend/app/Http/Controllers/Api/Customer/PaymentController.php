<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\RestaurantLocation;
use App\Services\StripeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private StripeService $stripeService
    ) {}

    public function createPaymentIntent(Request $request, string $publicCode, int $orderId): JsonResponse
    {
        $location = RestaurantLocation::with('restaurant.owner')
            ->where('public_location_code', $publicCode)
            ->firstOrFail();

        $order = Order::where('location_id', $location->id)
            ->where('id', $orderId)
            ->firstOrFail();

        if ($order->payment_method !== Order::METHOD_CARD) {
            return response()->json([
                'error' => 'This order is not set for card payment',
            ], 422);
        }

        if ($order->payment_status === Order::PAYMENT_PAID) {
            return response()->json([
                'error' => 'This order has already been paid',
            ], 422);
        }

        $connectedAccountId = $location->restaurant->owner->stripe_connect_id;

        $paymentIntent = $this->stripeService->createPaymentIntent($order, $connectedAccountId);

        $order->update([
            'stripe_payment_intent_id' => $paymentIntent->id,
            'payment_status' => Order::PAYMENT_PENDING,
        ]);

        return response()->json([
            'client_secret' => $paymentIntent->client_secret,
            'payment_intent_id' => $paymentIntent->id,
        ]);
    }
}
