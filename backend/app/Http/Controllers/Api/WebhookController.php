<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use App\Services\StripeService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function __construct(
        private StripeService $stripeService,
        private OrderService $orderService
    ) {}

    public function handleStripe(Request $request): Response
    {
        $payload = $request->getContent();
        $signature = $request->header('Stripe-Signature');

        try {
            $event = $this->stripeService->constructWebhookEvent($payload, $signature);
        } catch (\Exception $e) {
            Log::error('Stripe webhook signature verification failed', [
                'error' => $e->getMessage(),
            ]);
            return response('Webhook signature verification failed', 400);
        }

        Log::info('Stripe webhook received', ['type' => $event->type]);

        switch ($event->type) {
            case 'payment_intent.succeeded':
                $this->handlePaymentIntentSucceeded($event->data->object);
                break;

            case 'payment_intent.payment_failed':
                $this->handlePaymentIntentFailed($event->data->object);
                break;

            case 'charge.refunded':
                $this->handleChargeRefunded($event->data->object);
                break;

            default:
                Log::info('Unhandled Stripe event type', ['type' => $event->type]);
        }

        return response('Webhook handled', 200);
    }

    private function handlePaymentIntentSucceeded($paymentIntent): void
    {
        $orderId = $paymentIntent->metadata->order_id ?? null;

        if (!$orderId) {
            Log::warning('Payment intent succeeded but no order_id in metadata', [
                'payment_intent_id' => $paymentIntent->id,
            ]);
            return;
        }

        $order = Order::find($orderId);

        if (!$order) {
            Log::warning('Order not found for payment intent', [
                'order_id' => $orderId,
                'payment_intent_id' => $paymentIntent->id,
            ]);
            return;
        }

        if ($order->payment_status === Order::PAYMENT_PAID) {
            Log::info('Order already marked as paid', ['order_id' => $orderId]);
            return;
        }

        $order->markPaid();

        $chargeId = $paymentIntent->latest_charge;
        $balanceTransaction = $this->stripeService->getBalanceTransaction($chargeId);

        $this->orderService->createPlatformFee(
            $order,
            $balanceTransaction['fee'],
            $chargeId,
            $balanceTransaction['id']
        );

        Log::info('Order marked as paid', [
            'order_id' => $orderId,
            'payment_intent_id' => $paymentIntent->id,
        ]);
    }

    private function handlePaymentIntentFailed($paymentIntent): void
    {
        $orderId = $paymentIntent->metadata->order_id ?? null;

        if (!$orderId) {
            return;
        }

        $order = Order::find($orderId);

        if ($order) {
            $order->update(['payment_status' => Order::PAYMENT_FAILED]);

            Log::info('Order payment failed', [
                'order_id' => $orderId,
                'payment_intent_id' => $paymentIntent->id,
            ]);
        }
    }

    private function handleChargeRefunded($charge): void
    {
        $paymentIntentId = $charge->payment_intent;

        $order = Order::where('stripe_payment_intent_id', $paymentIntentId)->first();

        if ($order) {
            $order->update(['payment_status' => Order::PAYMENT_REFUNDED]);

            Log::info('Order refunded', [
                'order_id' => $order->id,
                'charge_id' => $charge->id,
            ]);
        }
    }
}
