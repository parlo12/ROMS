<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RestaurantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'legal_name' => $this->legal_name,
            'display_name' => $this->display_name,
            'brand_slug' => $this->brand_slug,
            'logo_url' => $this->logo_url,
            'phone' => $this->phone,
            'email' => $this->email,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'owner' => new UserResource($this->whenLoaded('owner')),
            'locations' => LocationResource::collection($this->whenLoaded('locations')),
            'locations_count' => $this->when($this->locations_count !== null, $this->locations_count),
        ];
    }
}
