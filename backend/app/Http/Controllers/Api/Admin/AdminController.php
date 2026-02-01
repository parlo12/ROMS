<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\RestaurantResource;
use App\Models\Order;
use App\Models\PlatformFee;
use App\Models\Restaurant;
use App\Models\RestaurantLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (!$request->user()->isPlatformAdmin()) {
                abort(403, 'Access denied. Platform admin only.');
            }
            return $next($request);
        });
    }

    public function dashboard(): JsonResponse
    {
        $today = today();

        $todayOrders = Order::whereDate('placed_at', $today)
            ->where('status', '!=', Order::STATUS_CANCELLED)
            ->count();

        $todayRevenue = Order::whereDate('placed_at', $today)
            ->where('status', '!=', Order::STATUS_CANCELLED)
            ->where('payment_status', Order::PAYMENT_PAID)
            ->sum('total_cents');

        $todayPlatformFees = PlatformFee::whereDate('created_at', $today)
            ->sum('platform_fee_cents');

        $totalRestaurants = Restaurant::count();
        $activeRestaurants = Restaurant::where('is_active', true)->count();
        $totalLocations = RestaurantLocation::count();
        $activeLocations = RestaurantLocation::where('is_active', true)->count();

        return response()->json([
            'today' => [
                'orders' => $todayOrders,
                'revenue_cents' => $todayRevenue,
                'revenue' => $todayRevenue / 100,
                'platform_fees_cents' => $todayPlatformFees,
                'platform_fees' => $todayPlatformFees / 100,
            ],
            'restaurants' => [
                'total' => $totalRestaurants,
                'active' => $activeRestaurants,
            ],
            'locations' => [
                'total' => $totalLocations,
                'active' => $activeLocations,
            ],
        ]);
    }

    public function restaurants(Request $request): JsonResponse
    {
        $query = Restaurant::with(['owner', 'locations'])
            ->withCount('locations');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('legal_name', 'like', "%{$request->search}%")
                    ->orWhere('display_name', 'like', "%{$request->search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $restaurants = $query->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'restaurants' => RestaurantResource::collection($restaurants),
            'meta' => [
                'current_page' => $restaurants->currentPage(),
                'last_page' => $restaurants->lastPage(),
                'per_page' => $restaurants->perPage(),
                'total' => $restaurants->total(),
            ],
        ]);
    }

    public function analytics(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $startDate = $request->start_date
            ? \Carbon\Carbon::parse($request->start_date)->startOfDay()
            : today()->subDays(30)->startOfDay();

        $endDate = $request->end_date
            ? \Carbon\Carbon::parse($request->end_date)->endOfDay()
            : today()->endOfDay();

        $orders = Order::whereBetween('placed_at', [$startDate, $endDate])
            ->where('status', '!=', Order::STATUS_CANCELLED);

        $totalOrders = $orders->count();
        $paidOrders = (clone $orders)->where('payment_status', Order::PAYMENT_PAID)->count();

        $grossRevenue = (clone $orders)
            ->where('payment_status', Order::PAYMENT_PAID)
            ->sum('total_cents');

        $platformFees = PlatformFee::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('
                SUM(platform_fee_cents) as total_platform_fees,
                SUM(stripe_fee_cents) as total_stripe_fees,
                SUM(platform_net_cents) as total_platform_net
            ')
            ->first();

        $topRestaurants = DB::table('orders')
            ->join('restaurant_locations', 'orders.location_id', '=', 'restaurant_locations.id')
            ->join('restaurants', 'restaurant_locations.restaurant_id', '=', 'restaurants.id')
            ->whereBetween('orders.placed_at', [$startDate, $endDate])
            ->where('orders.status', '!=', Order::STATUS_CANCELLED)
            ->where('orders.payment_status', Order::PAYMENT_PAID)
            ->select(
                'restaurants.id',
                'restaurants.display_name',
                DB::raw('COUNT(orders.id) as order_count'),
                DB::raw('SUM(orders.total_cents) as revenue_cents')
            )
            ->groupBy('restaurants.id', 'restaurants.display_name')
            ->orderByDesc('revenue_cents')
            ->limit(10)
            ->get();

        $dailyRevenue = DB::table('orders')
            ->whereBetween('placed_at', [$startDate, $endDate])
            ->where('status', '!=', Order::STATUS_CANCELLED)
            ->where('payment_status', Order::PAYMENT_PAID)
            ->select(
                DB::raw('DATE(placed_at) as date'),
                DB::raw('COUNT(*) as orders'),
                DB::raw('SUM(total_cents) as revenue_cents')
            )
            ->groupBy(DB::raw('DATE(placed_at)'))
            ->orderBy('date')
            ->get();

        return response()->json([
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
            'orders' => [
                'total' => $totalOrders,
                'paid' => $paidOrders,
            ],
            'revenue' => [
                'gross_cents' => $grossRevenue,
                'gross' => $grossRevenue / 100,
            ],
            'platform' => [
                'fees_cents' => $platformFees->total_platform_fees ?? 0,
                'fees' => ($platformFees->total_platform_fees ?? 0) / 100,
                'stripe_fees_cents' => $platformFees->total_stripe_fees ?? 0,
                'stripe_fees' => ($platformFees->total_stripe_fees ?? 0) / 100,
                'net_cents' => $platformFees->total_platform_net ?? 0,
                'net' => ($platformFees->total_platform_net ?? 0) / 100,
            ],
            'top_restaurants' => $topRestaurants,
            'daily_revenue' => $dailyRevenue,
        ]);
    }

    public function revenue(Request $request): JsonResponse
    {
        $request->validate([
            'restaurant_id' => ['nullable', 'integer', 'exists:restaurants,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $startDate = $request->start_date
            ? \Carbon\Carbon::parse($request->start_date)->startOfDay()
            : today()->subDays(30)->startOfDay();

        $endDate = $request->end_date
            ? \Carbon\Carbon::parse($request->end_date)->endOfDay()
            : today()->endOfDay();

        $query = DB::table('platform_fees')
            ->join('orders', 'platform_fees.order_id', '=', 'orders.id')
            ->join('restaurant_locations', 'orders.location_id', '=', 'restaurant_locations.id')
            ->join('restaurants', 'restaurant_locations.restaurant_id', '=', 'restaurants.id')
            ->whereBetween('platform_fees.created_at', [$startDate, $endDate]);

        if ($request->restaurant_id) {
            $query->where('restaurants.id', $request->restaurant_id);
        }

        $breakdown = $query->select(
            'restaurants.id as restaurant_id',
            'restaurants.display_name',
            DB::raw('COUNT(orders.id) as order_count'),
            DB::raw('SUM(platform_fees.gross_amount_cents) as gross_cents'),
            DB::raw('SUM(platform_fees.platform_fee_cents) as platform_fee_cents'),
            DB::raw('SUM(platform_fees.stripe_fee_cents) as stripe_fee_cents'),
            DB::raw('SUM(platform_fees.restaurant_payout_cents) as payout_cents')
        )
            ->groupBy('restaurants.id', 'restaurants.display_name')
            ->orderByDesc('gross_cents')
            ->get();

        return response()->json([
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
            'breakdown' => $breakdown,
        ]);
    }
}
