<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\RestaurantLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OwnerController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            // Must be an owner (have restaurants assigned)
            $user = $request->user();
            if ($user->isPlatformAdmin()) {
                abort(403, 'Platform admins should use the admin dashboard.');
            }

            $hasOwnership = Restaurant::where('owner_user_id', $user->id)->exists();
            if (!$hasOwnership) {
                abort(403, 'Access denied. Owner privileges required.');
            }

            return $next($request);
        });
    }

    public function overview(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = today();
        $startOfWeek = now()->startOfWeek();
        $startOfMonth = now()->startOfMonth();

        // Get all restaurants owned by this user
        $restaurants = Restaurant::with(['locations'])
            ->where('owner_user_id', $user->id)
            ->get();

        $locationIds = $restaurants->pluck('locations')->flatten()->pluck('id')->toArray();

        // Calculate summary stats
        $ordersToday = Order::whereIn('location_id', $locationIds)
            ->whereDate('placed_at', $today)
            ->where('status', '!=', Order::STATUS_CANCELLED)
            ->count();

        $revenueToday = Order::whereIn('location_id', $locationIds)
            ->whereDate('placed_at', $today)
            ->where('status', '!=', Order::STATUS_CANCELLED)
            ->where('payment_status', Order::PAYMENT_PAID)
            ->sum('total_cents');

        $ordersAllTime = Order::whereIn('location_id', $locationIds)
            ->where('status', '!=', Order::STATUS_CANCELLED)
            ->count();

        $revenueAllTime = Order::whereIn('location_id', $locationIds)
            ->where('status', '!=', Order::STATUS_CANCELLED)
            ->where('payment_status', Order::PAYMENT_PAID)
            ->sum('total_cents');

        // Build restaurant data with stats
        $restaurantData = $restaurants->map(function ($restaurant) use ($today) {
            $locationIds = $restaurant->locations->pluck('id')->toArray();

            $totalOrders = Order::whereIn('location_id', $locationIds)
                ->where('status', '!=', Order::STATUS_CANCELLED)
                ->count();

            $totalRevenue = Order::whereIn('location_id', $locationIds)
                ->where('status', '!=', Order::STATUS_CANCELLED)
                ->where('payment_status', Order::PAYMENT_PAID)
                ->sum('total_cents');

            $locationsData = $restaurant->locations->map(function ($location) use ($today) {
                $ordersToday = Order::where('location_id', $location->id)
                    ->whereDate('placed_at', $today)
                    ->where('status', '!=', Order::STATUS_CANCELLED)
                    ->count();

                $revenueToday = Order::where('location_id', $location->id)
                    ->whereDate('placed_at', $today)
                    ->where('status', '!=', Order::STATUS_CANCELLED)
                    ->where('payment_status', Order::PAYMENT_PAID)
                    ->sum('total_cents');

                $ordersTotal = Order::where('location_id', $location->id)
                    ->where('status', '!=', Order::STATUS_CANCELLED)
                    ->count();

                $revenueTotal = Order::where('location_id', $location->id)
                    ->where('status', '!=', Order::STATUS_CANCELLED)
                    ->where('payment_status', Order::PAYMENT_PAID)
                    ->sum('total_cents');

                return [
                    'id' => $location->id,
                    'location_name' => $location->location_name,
                    'public_location_code' => $location->public_location_code,
                    'is_active' => $location->is_active,
                    'orders_today' => $ordersToday,
                    'orders_total' => $ordersTotal,
                    'revenue_today_cents' => $revenueToday,
                    'revenue_total_cents' => $revenueTotal,
                ];
            });

            return [
                'id' => $restaurant->id,
                'display_name' => $restaurant->display_name,
                'legal_name' => $restaurant->legal_name,
                'is_active' => $restaurant->is_active,
                'locations' => $locationsData,
                'total_orders' => $totalOrders,
                'total_revenue_cents' => $totalRevenue,
            ];
        });

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => 'owner',
            ],
            'restaurants' => $restaurantData,
            'summary' => [
                'total_restaurants' => $restaurants->count(),
                'total_locations' => count($locationIds),
                'total_orders_today' => $ordersToday,
                'total_revenue_today_cents' => $revenueToday,
                'total_orders_all_time' => $ordersAllTime,
                'total_revenue_all_time_cents' => $revenueAllTime,
            ],
        ]);
    }

    public function analytics(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = today();
        $startOfWeek = now()->startOfWeek();
        $startOfMonth = now()->startOfMonth();

        $restaurants = Restaurant::with(['locations'])
            ->where('owner_user_id', $user->id)
            ->get();

        $restaurantAnalytics = $restaurants->map(function ($restaurant) use ($today, $startOfWeek, $startOfMonth) {
            $locationsAnalytics = $restaurant->locations->map(function ($location) use ($today, $startOfWeek, $startOfMonth, $restaurant) {
                $baseQuery = fn() => Order::where('location_id', $location->id)
                    ->where('status', '!=', Order::STATUS_CANCELLED);

                $paidQuery = fn() => Order::where('location_id', $location->id)
                    ->where('status', '!=', Order::STATUS_CANCELLED)
                    ->where('payment_status', Order::PAYMENT_PAID);

                $ordersToday = $baseQuery()->whereDate('placed_at', $today)->count();
                $ordersThisWeek = $baseQuery()->where('placed_at', '>=', $startOfWeek)->count();
                $ordersThisMonth = $baseQuery()->where('placed_at', '>=', $startOfMonth)->count();
                $ordersTotal = $baseQuery()->count();

                $revenueToday = $paidQuery()->whereDate('placed_at', $today)->sum('total_cents');
                $revenueThisWeek = $paidQuery()->where('placed_at', '>=', $startOfWeek)->sum('total_cents');
                $revenueThisMonth = $paidQuery()->where('placed_at', '>=', $startOfMonth)->sum('total_cents');
                $revenueTotal = $paidQuery()->sum('total_cents');

                return [
                    'id' => $location->id,
                    'location_name' => $location->location_name,
                    'restaurant_name' => $restaurant->display_name,
                    'orders_today' => $ordersToday,
                    'orders_this_week' => $ordersThisWeek,
                    'orders_this_month' => $ordersThisMonth,
                    'orders_total' => $ordersTotal,
                    'revenue_today_cents' => $revenueToday,
                    'revenue_this_week_cents' => $revenueThisWeek,
                    'revenue_this_month_cents' => $revenueThisMonth,
                    'revenue_total_cents' => $revenueTotal,
                    'avg_order_value_cents' => $ordersTotal > 0 ? round($revenueTotal / $ordersTotal) : 0,
                ];
            });

            $totals = [
                'orders_today' => $locationsAnalytics->sum('orders_today'),
                'orders_this_week' => $locationsAnalytics->sum('orders_this_week'),
                'orders_this_month' => $locationsAnalytics->sum('orders_this_month'),
                'orders_total' => $locationsAnalytics->sum('orders_total'),
                'revenue_today_cents' => $locationsAnalytics->sum('revenue_today_cents'),
                'revenue_this_week_cents' => $locationsAnalytics->sum('revenue_this_week_cents'),
                'revenue_this_month_cents' => $locationsAnalytics->sum('revenue_this_month_cents'),
                'revenue_total_cents' => $locationsAnalytics->sum('revenue_total_cents'),
            ];

            return [
                'id' => $restaurant->id,
                'display_name' => $restaurant->display_name,
                'locations' => $locationsAnalytics,
                'totals' => $totals,
            ];
        });

        // Grand totals across all restaurants
        $grandTotals = [
            'orders_today' => $restaurantAnalytics->sum('totals.orders_today'),
            'orders_this_week' => $restaurantAnalytics->sum('totals.orders_this_week'),
            'orders_this_month' => $restaurantAnalytics->sum('totals.orders_this_month'),
            'orders_total' => $restaurantAnalytics->sum('totals.orders_total'),
            'revenue_today_cents' => $restaurantAnalytics->sum('totals.revenue_today_cents'),
            'revenue_this_week_cents' => $restaurantAnalytics->sum('totals.revenue_this_week_cents'),
            'revenue_this_month_cents' => $restaurantAnalytics->sum('totals.revenue_this_month_cents'),
            'revenue_total_cents' => $restaurantAnalytics->sum('totals.revenue_total_cents'),
        ];

        return response()->json([
            'restaurants' => $restaurantAnalytics,
            'grand_totals' => $grandTotals,
        ]);
    }

    public function locations(Request $request): JsonResponse
    {
        $user = $request->user();

        $restaurants = Restaurant::with(['locations'])
            ->where('owner_user_id', $user->id)
            ->get();

        $locations = $restaurants->flatMap(function ($restaurant) {
            return $restaurant->locations->map(function ($location) use ($restaurant) {
                return [
                    'id' => $location->id,
                    'location_name' => $location->location_name,
                    'restaurant_id' => $restaurant->id,
                    'restaurant_name' => $restaurant->display_name,
                ];
            });
        });

        return response()->json([
            'locations' => $locations,
        ]);
    }
}
