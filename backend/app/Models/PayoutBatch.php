<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayoutBatch extends Model
{
    use HasFactory;

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    protected $fillable = [
        'period_start',
        'period_end',
        'status',
        'total_gross_cents',
        'total_platform_fee_cents',
        'total_stripe_fee_cents',
        'total_payout_cents',
        'notes',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'datetime',
            'period_end' => 'datetime',
            'processed_at' => 'datetime',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(PayoutBatchItem::class);
    }

    public function getTotalGrossAttribute(): float
    {
        return $this->total_gross_cents / 100;
    }

    public function getTotalPlatformFeeAttribute(): float
    {
        return $this->total_platform_fee_cents / 100;
    }

    public function getTotalStripeFeeAttribute(): float
    {
        return $this->total_stripe_fee_cents / 100;
    }

    public function getTotalPayoutAttribute(): float
    {
        return $this->total_payout_cents / 100;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isProcessing(): bool
    {
        return $this->status === self::STATUS_PROCESSING;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function markProcessing(): void
    {
        $this->update(['status' => self::STATUS_PROCESSING]);
    }

    public function markCompleted(): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'processed_at' => now(),
        ]);
    }

    public function markFailed(): void
    {
        $this->update(['status' => self::STATUS_FAILED]);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}
