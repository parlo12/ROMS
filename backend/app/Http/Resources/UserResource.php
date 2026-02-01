<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'is_platform_admin' => $this->is_platform_admin,
            'status' => $this->status,
            'email_verified_at' => $this->email_verified_at,
            'created_at' => $this->created_at,
            'locations' => LocationResource::collection($this->whenLoaded('locations')),
            'owned_restaurants' => RestaurantResource::collection($this->whenLoaded('ownedRestaurants')),
        ];
    }
}
