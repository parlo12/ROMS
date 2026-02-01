<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuItemOptionValueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'option_id' => $this->option_id,
            'name' => $this->name,
            'price_delta_cents' => $this->price_delta_cents,
            'price_delta' => $this->price_delta,
            'formatted_price_delta' => $this->formatted_price_delta,
            'is_available' => $this->is_available,
            'sort_order' => $this->sort_order,
        ];
    }
}
