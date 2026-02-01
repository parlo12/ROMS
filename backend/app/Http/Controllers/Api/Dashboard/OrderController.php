<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\RestaurantLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'location_id' => ['required', 'integer', 'exists:restaurant_locations,id'],
            'status' => ['nullable', 'string'],
            'date' => ['nullable', 'date'],
        ]);

        $user = $request->user();
        $locationId = $request->location_id;

        $this->authorizeLocationAccess($user, $locationId);

        $query = Order::with(['items.modifiers'])
            ->where('location_id', $locationId)
            ->orderBy('placed_at', 'desc');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->date) {
            $query->whereDate('placed_at', $request->date);
        } else {
            $query->whereDate('placed_at', today());
        }

        $orders = $query->paginate(50);

        return response()->json([
            'orders' => OrderResource::collection($orders),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function show(Request $request, int $orderId): JsonResponse
    {
        $order = Order::with(['items.modifiers', 'location'])->findOrFail($orderId);

        $this->authorizeLocationAccess($request->user(), $order->location_id);

        return response()->json([
            'order' => new OrderResource($order),
        ]);
    }

    public function updateStatus(Request $request, int $orderId): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:accepted,preparing,ready,completed,cancelled'],
            'cancelled_reason' => ['required_if:status,cancelled', 'nullable', 'string', 'max:255'],
        ]);

        $order = Order::findOrFail($orderId);

        $this->authorizeLocationAccess($request->user(), $order->location_id);

        switch ($request->status) {
            case 'accepted':
                if (!$order->canBeAccepted()) {
                    return response()->json(['error' => 'Order cannot be accepted'], 422);
                }
                $order->accept();
                break;

            case 'preparing':
                $order->markPreparing();
                break;

            case 'ready':
                $order->markReady();
                break;

            case 'completed':
                $order->complete();
                break;

            case 'cancelled':
                if (!$order->canBeCancelled()) {
                    return response()->json(['error' => 'Order cannot be cancelled'], 422);
                }
                $order->cancel($request->cancelled_reason);
                break;
        }

        return response()->json([
            'order' => new OrderResource($order->fresh(['items.modifiers'])),
            'message' => 'Order status updated successfully',
        ]);
    }

    public function markPaid(Request $request, int $orderId): JsonResponse
    {
        $order = Order::findOrFail($orderId);

        $this->authorizeLocationAccess($request->user(), $order->location_id);

        if (!$order->isCash()) {
            return response()->json(['error' => 'Only cash orders can be manually marked as paid'], 422);
        }

        $order->markPaid();

        return response()->json([
            'order' => new OrderResource($order->fresh()),
            'message' => 'Order marked as paid',
        ]);
    }

    public function pending(Request $request): JsonResponse
    {
        $request->validate([
            'location_id' => ['required', 'integer', 'exists:restaurant_locations,id'],
        ]);

        $this->authorizeLocationAccess($request->user(), $request->location_id);

        $orders = Order::with(['items.modifiers'])
            ->where('location_id', $request->location_id)
            ->pending()
            ->orderBy('placed_at', 'asc')
            ->get();

        return response()->json([
            'orders' => OrderResource::collection($orders),
            'count' => $orders->count(),
        ]);
    }

    private function authorizeLocationAccess($user, int $locationId): void
    {
        if ($user->isPlatformAdmin()) {
            return;
        }

        $location = RestaurantLocation::findOrFail($locationId);

        if ($user->isOwnerOf($location->restaurant)) {
            return;
        }

        if (!$user->hasLocationAccess($location)) {
            abort(403, 'You do not have access to this location');
        }
    }
}
