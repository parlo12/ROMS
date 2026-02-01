<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class RestaurantLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'location_name',
        'address_line1',
        'address_line2',
        'city_id',
        'state_id',
        'zipcode_id',
        'latitude',
        'longitude',
        'geofence_radius_meters',
        'public_location_code',
        'timezone',
        'tax_rate',
        'is_active',
        'phone',
        'operating_hours',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'tax_rate' => 'decimal:4',
            'is_active' => 'boolean',
            'operating_hours' => 'array',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($location) {
            if (empty($location->public_location_code)) {
                $location->public_location_code = self::generateUniqueCode();
            }
        });
    }

    public static function generateUniqueCode(int $length = 12): string
    {
        do {
            $code = Str::random($length);
        } while (self::where('public_location_code', $code)->exists());

        return $code;
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function state(): BelongsTo
    {
        return $this->belongsTo(State::class);
    }

    public function zipcode(): BelongsTo
    {
        return $this->belongsTo(Zipcode::class);
    }

    public function menus(): HasMany
    {
        return $this->hasMany(Menu::class, 'location_id');
    }

    public function activeMenu(): HasOne
    {
        return $this->hasOne(Menu::class, 'location_id')->where('is_active', true);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'location_id');
    }

    public function staff(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'location_users', 'location_id', 'user_id')
            ->withPivot(['role', 'is_active'])
            ->withTimestamps();
    }

    public function staffAssignments(): HasMany
    {
        return $this->hasMany(LocationUser::class, 'location_id');
    }

    public function geoTokens(): HasMany
    {
        return $this->hasMany(GeoToken::class, 'location_id');
    }

    public function orderSequences(): HasMany
    {
        return $this->hasMany(OrderSequence::class, 'location_id');
    }

    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address_line1,
            $this->address_line2,
            $this->city?->name,
            $this->state?->code,
            $this->zipcode?->code,
        ]);

        return implode(', ', $parts);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByPublicCode($query, string $code)
    {
        return $query->where('public_location_code', $code);
    }
}
