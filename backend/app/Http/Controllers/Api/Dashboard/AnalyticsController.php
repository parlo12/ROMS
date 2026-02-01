<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\RestaurantLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'location_id' => ['required', 'integer', 'exists:restaurant_locations,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $this->authorizeAnalyticsAccess($request->user(), $request->location_id);

        $startDate = $request->start_date ? \Carbon\Carbon::parse($request->start_date) : today()->startOfDay();
        $endDate = $request->end_date ? \Carbon\Carbon::parse($request->end_date)->endOfDay() : today()->endOfDay();

        $orders = Order::where('location_id', $request->location_id)
            ->whereBetween('placed_at', [$startDate, $endDate])
            ->where('status', '!=', Order::STATUS_CANCELLED);

        $totalOrders = $orders->count();
        $paidOrders = (clone $orders)->where('payment_status', Order::PAYMENT_PAID)->count();
        $unpaidOrders = (clone $orders)->where('payment_status', Order::PAYMENT_UNPAID)->count();

        $grossRevenue = (clone $orders)->where('payment_status', Order::PAYMENT_PAID)->sum('total_cents');
        $cashRevenue = (clone $orders)
            ->where('payment_status', Order::PAYMENT_PAID)
            ->where('payment_method', Order::METHOD_CASH)
            ->sum('total_cents');
        $cardRevenue = (clone $orders)
            ->where('payment_status', Order::PAYMENT_PAID)
            ->where('payment_method', Order::METHOD_CARD)
            ->sum('total_cents');

        $averageOrderValue = $totalOrders > 0 ? $grossRevenue / $paidOrders : 0;

        $topItems = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.location_id', $request->location_id)
            ->whereBetween('orders.placed_at', [$startDate, $endDate])
            ->where('orders.status', '!=', Order::STATUS_CANCELLED)
            ->select('order_items.name_snapshot', DB::raw('SUM(order_items.quantity) as total_quantity'))
            ->groupBy('order_items.name_snapshot')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->get();

        $hourlyDistribution = DB::table('orders')
            ->where('location_id', $request->location_id)
            ->whereBetween('placed_at', [$startDate, $endDate])
            ->where('status', '!=', Order::STATUS_CANCELLED)
            ->select(DB::raw('EXTRACT(HOUR FROM placed_at) as hour'), DB::raw('COUNT(*) as count'))
            ->groupBy(DB::raw('EXTRACT(HOUR FROM placed_at)'))
            ->orderBy('hour')
            ->get();

        return response()->json([
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
            'orders' => [
                'total' => $totalOrders,
                'paid' => $paidOrders,
                'unpaid' => $unpaidOrders,
            ],
            'revenue' => [
                'gross_cents' => $grossRevenue,
                'gross' => $grossRevenue / 100,
                'cash_cents' => $cashRevenue,
                'cash' => $cashRevenue / 100,
                'card_cents' => $cardRevenue,
                'card' => $cardRevenue / 100,
                'average_order_cents' => (int) $averageOrderValue,
                'average_order' => $averageOrderValue / 100,
            ],
            'top_items' => $topItems,
            'hourly_distribution' => $hourlyDistribution,
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isPlatformAdmin()) {
            return $this->platformSummary();
        }

        $locationIds = $user->locations()->pluck('restaurant_locations.id');

        if ($locationIds->isEmpty()) {
            return response()->json([
                'today' => ['orders' => 0, 'revenue_cents' => 0],
                'week' => ['orders' => 0, 'revenue_cents' => 0],
                'month' => ['orders' => 0, 'revenue_cents' => 0],
            ]);
        }

        $todayStats = $this->getStats($locationIds, today(), today());
        $weekStats = $this->getStats($locationIds, today()->subDays(7), today());
        $monthStats = $this->getStats($locationIds, today()->subDays(30), today());

        return response()->json([
            'today' => $todayStats,
            'week' => $weekStats,
            'month' => $monthStats,
        ]);
    }

    private function getStats($locationIds, $startDate, $endDate): array
    {
        $orders = Order::whereIn('location_id', $locationIds)
            ->whereBetween('placed_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->where('status', '!=', Order::STATUS_CANCELLED)
            ->where('payment_status', Order::PAYMENT_PAID);

        return [
            'orders' => $orders->count(),
            'revenue_cents' => $orders->sum('total_cents'),
            'revenue' => $orders->sum('total_cents') / 100,
        ];
    }

    private function platformSummary(): JsonResponse
    {
        $todayStats = Order::whereDate('placed_at', today())
            ->where('status', '!=', Order::STATUS_CANCELLED)
            ->selectRaw('COUNT(*) as orders, COALESCE(SUM(total_cents), 0) as revenue')
            ->first();

        return response()->json([
            'today' => [
                'orders' => $todayStats->orders,
                'revenue_cents' => $todayStats->revenue,
                'revenue' => $todayStats->revenue / 100,
            ],
        ]);
    }

    private function authorizeAnalyticsAccess($user, int $locationId): void
    {
        if ($user->isPlatformAdmin()) {
            return;
        }

        $location = RestaurantLocation::findOrFail($locationId);

        if ($user->isOwnerOf($location->restaurant)) {
            return;
        }

        $assignment = $user->locationAssignments()
            ->where('location_id', $locationId)
            ->first();

        if (!$assignment || !$assignment->canViewAnalytics()) {
            abort(403, 'You do not have permission to view analytics');
        }
    }
}
