<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemModifierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_item_id' => $this->order_item_id,
            'option_name' => $this->option_name,
            'value_name' => $this->value_name,
            'price_delta_cents' => $this->price_delta_cents,
            'price_delta' => $this->price_delta,
        ];
    }
}
