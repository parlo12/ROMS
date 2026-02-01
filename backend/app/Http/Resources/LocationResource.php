<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'restaurant_id' => $this->restaurant_id,
            'location_name' => $this->location_name,
            'address_line1' => $this->address_line1,
            'address_line2' => $this->address_line2,
            'full_address' => $this->full_address,
            'city' => $this->whenLoaded('city', fn() => $this->city?->name),
            'state' => $this->whenLoaded('state', fn() => $this->state?->code),
            'zipcode' => $this->whenLoaded('zipcode', fn() => $this->zipcode?->code),
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
            'geofence_radius_meters' => $this->geofence_radius_meters,
            'public_location_code' => $this->public_location_code,
            'timezone' => $this->timezone,
            'tax_rate' => (float) $this->tax_rate,
            'is_active' => $this->is_active,
            'phone' => $this->phone,
            'operating_hours' => $this->operating_hours,
            'created_at' => $this->created_at,
            'restaurant' => new RestaurantResource($this->whenLoaded('restaurant')),
            'active_menu' => new MenuResource($this->whenLoaded('activeMenu')),
            'pivot' => $this->when($this->pivot, fn() => [
                'role' => $this->pivot->role,
                'is_active' => $this->pivot->is_active,
            ]),
        ];
    }
}
