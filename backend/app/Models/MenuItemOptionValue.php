<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuItemOptionValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'option_id',
        'name',
        'price_delta_cents',
        'is_available',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_available' => 'boolean',
        ];
    }

    public function option(): BelongsTo
    {
        return $this->belongsTo(MenuItemOption::class, 'option_id');
    }

    public function getPriceDeltaAttribute(): float
    {
        return $this->price_delta_cents / 100;
    }

    public function getFormattedPriceDeltaAttribute(): string
    {
        if ($this->price_delta_cents === 0) {
            return '';
        }

        $sign = $this->price_delta_cents > 0 ? '+' : '';
        return $sign . '$' . number_format($this->price_delta, 2);
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }
}
