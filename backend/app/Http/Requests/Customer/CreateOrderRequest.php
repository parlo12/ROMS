<?php

namespace App\Http\Requests\Customer;

use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'geo_token' => ['required', 'string'],
            'payment_method' => ['required', 'string', Rule::in([Order::METHOD_CASH, Order::METHOD_CARD])],
            'table_number' => ['nullable', 'string', 'max:20'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:20'],
            'special_instructions' => ['nullable', 'string', 'max:500'],
            'tip_cents' => ['nullable', 'integer', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.menu_item_id' => ['required', 'integer', 'exists:menu_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.special_instructions' => ['nullable', 'string', 'max:255'],
            'items.*.modifiers' => ['nullable', 'array'],
            'items.*.modifiers.*.option_name' => ['required_with:items.*.modifiers', 'string'],
            'items.*.modifiers.*.value_name' => ['required_with:items.*.modifiers', 'string'],
            'items.*.modifiers.*.price_delta_cents' => ['required_with:items.*.modifiers', 'integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'geo_token.required' => 'Location verification is required to place an order.',
            'items.required' => 'Your order must contain at least one item.',
            'items.min' => 'Your order must contain at least one item.',
        ];
    }
}
