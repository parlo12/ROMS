<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'name' => $this->name,
            'description' => $this->description,
            'price_cents' => $this->price_cents,
            'price' => $this->price,
            'formatted_price' => $this->formatted_price,
            'photo_url' => $this->photo_url,
            'is_available' => $this->is_available,
            'sort_order' => $this->sort_order,
            'preparation_time_minutes' => $this->preparation_time_minutes,
            'allergens' => $this->allergens,
            'dietary_info' => $this->dietary_info,
            'options' => MenuItemOptionResource::collection($this->whenLoaded('options')),
        ];
    }
}
