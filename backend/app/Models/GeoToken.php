<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class GeoToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'location_id',
        'token',
        'device_fingerprint',
        'ip_address',
        'verified_latitude',
        'verified_longitude',
        'expires_at',
        'used_at',
    ];

    protected function casts(): array
    {
        return [
            'verified_latitude' => 'decimal:8',
            'verified_longitude' => 'decimal:8',
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(RestaurantLocation::class, 'location_id');
    }

    public static function generate(
        int $locationId,
        float $latitude,
        float $longitude,
        ?string $deviceFingerprint = null,
        ?string $ipAddress = null,
        int $ttlMinutes = 15
    ): self {
        return self::create([
            'location_id' => $locationId,
            'token' => Str::random(64),
            'device_fingerprint' => $deviceFingerprint,
            'ip_address' => $ipAddress,
            'verified_latitude' => $latitude,
            'verified_longitude' => $longitude,
            'expires_at' => now()->addMinutes($ttlMinutes),
        ]);
    }

    public function isValid(): bool
    {
        return $this->expires_at->isFuture();
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function markUsed(): void
    {
        $this->update(['used_at' => now()]);
    }

    public static function findValid(string $token): ?self
    {
        return self::where('token', $token)
            ->where('expires_at', '>', now())
            ->first();
    }

    public function scopeValid($query)
    {
        return $query->where('expires_at', '>', now());
    }

    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }
}
