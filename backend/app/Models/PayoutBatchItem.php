<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayoutBatchItem extends Model
{
    use HasFactory;

    const STATUS_PENDING = 'pending';
    const STATUS_TRANSFERRED = 'transferred';
    const STATUS_FAILED = 'failed';

    protected $fillable = [
        'payout_batch_id',
        'location_id',
        'restaurant_id',
        'gross_cents',
        'platform_fee_cents',
        'stripe_fee_cents',
        'net_payout_cents',
        'order_count',
        'stripe_transfer_id',
        'status',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(PayoutBatch::class, 'payout_batch_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(RestaurantLocation::class, 'location_id');
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function getGrossAttribute(): float
    {
        return $this->gross_cents / 100;
    }

    public function getPlatformFeeAttribute(): float
    {
        return $this->platform_fee_cents / 100;
    }

    public function getStripeFeeAttribute(): float
    {
        return $this->stripe_fee_cents / 100;
    }

    public function getNetPayoutAttribute(): float
    {
        return $this->net_payout_cents / 100;
    }

    public function markTransferred(string $transferId): void
    {
        $this->update([
            'status' => self::STATUS_TRANSFERRED,
            'stripe_transfer_id' => $transferId,
        ]);
    }

    public function markFailed(): void
    {
        $this->update(['status' => self::STATUS_FAILED]);
    }
}
