<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use Stripe\StripeClient;
use Stripe\PaymentIntent;
use Stripe\Exception\ApiErrorException;

class StripeService
{
    private StripeClient $stripe;

    public function __construct()
    {
        $this->stripe = new StripeClient(config('services.stripe.secret'));
    }

    public function createPaymentIntent(Order $order, ?string $connectedAccountId = null): PaymentIntent
    {
        $platformFeeAmount = (int) round($order->total_cents * (config('roms.platform_fee_percentage', 3) / 100));

        $params = [
            'amount' => $order->total_cents,
            'currency' => config('roms.stripe.currency', 'usd'),
            'metadata' => [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'location_id' => $order->location_id,
            ],
            'statement_descriptor' => config('roms.stripe.statement_descriptor', 'ROMS ORDER'),
            'automatic_payment_methods' => [
                'enabled' => true,
            ],
        ];

        if ($connectedAccountId) {
            $params['application_fee_amount'] = $platformFeeAmount;
            $params['transfer_data'] = [
                'destination' => $connectedAccountId,
            ];
        }

        return $this->stripe->paymentIntents->create($params);
    }

    public function retrievePaymentIntent(string $paymentIntentId): PaymentIntent
    {
        return $this->stripe->paymentIntents->retrieve($paymentIntentId);
    }

    public function getBalanceTransaction(string $chargeId): array
    {
        try {
            $charge = $this->stripe->charges->retrieve($chargeId, [
                'expand' => ['balance_transaction'],
            ]);

            if ($charge->balance_transaction) {
                return [
                    'id' => $charge->balance_transaction->id,
                    'fee' => $charge->balance_transaction->fee,
                    'net' => $charge->balance_transaction->net,
                ];
            }
        } catch (ApiErrorException $e) {
            report($e);
        }

        return [
            'id' => null,
            'fee' => 0,
            'net' => 0,
        ];
    }

    public function createConnectAccount(User $user, Restaurant $restaurant): string
    {
        $account = $this->stripe->accounts->create([
            'type' => 'express',
            'country' => 'US',
            'email' => $user->email,
            'capabilities' => [
                'card_payments' => ['requested' => true],
                'transfers' => ['requested' => true],
            ],
            'business_type' => 'company',
            'company' => [
                'name' => $restaurant->legal_name,
            ],
            'metadata' => [
                'user_id' => $user->id,
                'restaurant_id' => $restaurant->id,
            ],
        ]);

        return $account->id;
    }

    public function createAccountLink(string $accountId, string $refreshUrl, string $returnUrl): string
    {
        $link = $this->stripe->accountLinks->create([
            'account' => $accountId,
            'refresh_url' => $refreshUrl,
            'return_url' => $returnUrl,
            'type' => 'account_onboarding',
        ]);

        return $link->url;
    }

    public function getAccountStatus(string $accountId): array
    {
        $account = $this->stripe->accounts->retrieve($accountId);

        return [
            'charges_enabled' => $account->charges_enabled,
            'payouts_enabled' => $account->payouts_enabled,
            'details_submitted' => $account->details_submitted,
            'requirements' => $account->requirements,
        ];
    }

    public function createTransfer(int $amount, string $destinationAccountId, string $description = ''): string
    {
        $transfer = $this->stripe->transfers->create([
            'amount' => $amount,
            'currency' => config('roms.stripe.currency', 'usd'),
            'destination' => $destinationAccountId,
            'description' => $description,
        ]);

        return $transfer->id;
    }

    public function constructWebhookEvent(string $payload, string $signature): \Stripe\Event
    {
        return \Stripe\Webhook::constructEvent(
            $payload,
            $signature,
            config('services.stripe.webhook_secret')
        );
    }
}
