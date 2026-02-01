<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuItemOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'name',
        'selection_type',
        'required',
        'min_selections',
        'max_selections',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'required' => 'boolean',
        ];
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'item_id');
    }

    public function values(): HasMany
    {
        return $this->hasMany(MenuItemOptionValue::class, 'option_id')->orderBy('sort_order');
    }

    public function availableValues(): HasMany
    {
        return $this->values()->where('is_available', true);
    }

    public function isSingleSelection(): bool
    {
        return $this->selection_type === 'single';
    }

    public function isMultipleSelection(): bool
    {
        return $this->selection_type === 'multiple';
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }
}
