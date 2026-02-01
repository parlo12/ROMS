<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuItemOptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'item_id' => $this->item_id,
            'name' => $this->name,
            'selection_type' => $this->selection_type,
            'required' => $this->required,
            'min_selections' => $this->min_selections,
            'max_selections' => $this->max_selections,
            'sort_order' => $this->sort_order,
            'values' => MenuItemOptionValueResource::collection($this->whenLoaded('values')),
        ];
    }
}
