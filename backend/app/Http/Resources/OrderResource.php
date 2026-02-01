<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'location_id' => $this->location_id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'payment_method' => $this->payment_method,
            'subtotal_cents' => $this->subtotal_cents,
            'subtotal' => $this->subtotal,
            'tax_cents' => $this->tax_cents,
            'tax' => $this->tax,
            'tip_cents' => $this->tip_cents,
            'tip' => $this->tip,
            'total_cents' => $this->total_cents,
            'total' => $this->total,
            'formatted_total' => $this->formatted_total,
            'table_number' => $this->table_number,
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'special_instructions' => $this->special_instructions,
            'placed_at' => $this->placed_at,
            'accepted_at' => $this->accepted_at,
            'completed_at' => $this->completed_at,
            'cancelled_at' => $this->cancelled_at,
            'cancelled_reason' => $this->cancelled_reason,
            'created_at' => $this->created_at,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'location' => new LocationResource($this->whenLoaded('location')),
        ];
    }
}
