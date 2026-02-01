<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'menu_item_id' => $this->menu_item_id,
            'name_snapshot' => $this->name_snapshot,
            'unit_price_cents_snapshot' => $this->unit_price_cents_snapshot,
            'unit_price' => $this->unit_price,
            'quantity' => $this->quantity,
            'line_total_cents' => $this->line_total_cents,
            'line_total' => $this->line_total,
            'formatted_line_total' => $this->formatted_line_total,
            'special_instructions' => $this->special_instructions,
            'modifiers' => OrderItemModifierResource::collection($this->whenLoaded('modifiers')),
        ];
    }
}
