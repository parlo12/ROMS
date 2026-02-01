<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LocationUser extends Model
{
    use HasFactory;

    const ROLE_OWNER = 'owner';
    const ROLE_MANAGER = 'manager';
    const ROLE_CASHIER = 'cashier';
    const ROLE_SERVER = 'server';

    protected $fillable = [
        'location_id',
        'user_id',
        'role',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(RestaurantLocation::class, 'location_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isOwner(): bool
    {
        return $this->role === self::ROLE_OWNER;
    }

    public function isManager(): bool
    {
        return $this->role === self::ROLE_MANAGER;
    }

    public function isCashier(): bool
    {
        return $this->role === self::ROLE_CASHIER;
    }

    public function isServer(): bool
    {
        return $this->role === self::ROLE_SERVER;
    }

    public function canViewAnalytics(): bool
    {
        return in_array($this->role, [self::ROLE_OWNER, self::ROLE_MANAGER]);
    }

    public function canManageMenu(): bool
    {
        return in_array($this->role, [self::ROLE_OWNER, self::ROLE_MANAGER]);
    }

    public function canManageOrders(): bool
    {
        return in_array($this->role, [
            self::ROLE_OWNER,
            self::ROLE_MANAGER,
            self::ROLE_CASHIER,
            self::ROLE_SERVER,
        ]);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }
}
