<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Restaurant extends Model
{
    use HasFactory;

    protected $fillable = [
        'legal_name',
        'display_name',
        'owner_user_id',
        'brand_slug',
        'logo_url',
        'phone',
        'email',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function locations(): HasMany
    {
        return $this->hasMany(RestaurantLocation::class);
    }

    public function activeLocations(): HasMany
    {
        return $this->locations()->where('is_active', true);
    }

    public function orders(): HasManyThrough
    {
        return $this->hasManyThrough(Order::class, RestaurantLocation::class, 'restaurant_id', 'location_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
