<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'is_platform_admin',
        'stripe_connect_id',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_platform_admin' => 'boolean',
        ];
    }

    public function ownedRestaurants(): HasMany
    {
        return $this->hasMany(Restaurant::class, 'owner_user_id');
    }

    public function locations(): BelongsToMany
    {
        return $this->belongsToMany(RestaurantLocation::class, 'location_users', 'user_id', 'location_id')
            ->withPivot(['role', 'is_active'])
            ->withTimestamps();
    }

    public function locationAssignments(): HasMany
    {
        return $this->hasMany(LocationUser::class);
    }

    public function isPlatformAdmin(): bool
    {
        return $this->is_platform_admin;
    }

    public function isOwnerOf(Restaurant $restaurant): bool
    {
        return $this->id === $restaurant->owner_user_id;
    }

    public function hasLocationAccess(RestaurantLocation $location, ?string $role = null): bool
    {
        $query = $this->locations()->where('restaurant_locations.id', $location->id);

        if ($role) {
            $query->wherePivot('role', $role);
        }

        return $query->exists();
    }
}
