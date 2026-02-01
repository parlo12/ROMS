<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'menu_item_id',
        'name_snapshot',
        'unit_price_cents_snapshot',
        'quantity',
        'line_total_cents',
        'special_instructions',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'menu_item_id');
    }

    public function modifiers(): HasMany
    {
        return $this->hasMany(OrderItemModifier::class);
    }

    public function getUnitPriceAttribute(): float
    {
        return $this->unit_price_cents_snapshot / 100;
    }

    public function getLineTotalAttribute(): float
    {
        return $this->line_total_cents / 100;
    }

    public function getFormattedLineTotalAttribute(): string
    {
        return '$' . number_format($this->line_total, 2);
    }

    public function calculateLineTotal(): int
    {
        $baseTotal = $this->unit_price_cents_snapshot * $this->quantity;
        $modifiersTotal = $this->modifiers->sum('price_delta_cents') * $this->quantity;

        return $baseTotal + $modifiersTotal;
    }
}
