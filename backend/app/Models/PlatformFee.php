<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformFee extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'gross_amount_cents',
        'platform_fee_cents',
        'stripe_fee_cents',
        'restaurant_payout_cents',
        'platform_net_cents',
        'stripe_charge_id',
        'stripe_balance_transaction_id',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function getGrossAmountAttribute(): float
    {
        return $this->gross_amount_cents / 100;
    }

    public function getPlatformFeeAttribute(): float
    {
        return $this->platform_fee_cents / 100;
    }

    public function getStripeFeeAttribute(): float
    {
        return $this->stripe_fee_cents / 100;
    }

    public function getRestaurantPayoutAttribute(): float
    {
        return $this->restaurant_payout_cents / 100;
    }

    public function getPlatformNetAttribute(): float
    {
        return $this->platform_net_cents / 100;
    }

    public static function calculateForOrder(Order $order, int $stripeFee = 0): array
    {
        $grossCents = $order->total_cents;
        $platformFeeCents = (int) round($grossCents * (config('roms.platform_fee_percentage', 3) / 100));
        $restaurantPayoutCents = $grossCents - $platformFeeCents;
        $platformNetCents = $platformFeeCents - $stripeFee;

        return [
            'gross_amount_cents' => $grossCents,
            'platform_fee_cents' => $platformFeeCents,
            'stripe_fee_cents' => $stripeFee,
            'restaurant_payout_cents' => $restaurantPayoutCents,
            'platform_net_cents' => $platformNetCents,
        ];
    }
}
