<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\LocationResource;
use App\Http\Resources\MenuResource;
use App\Models\RestaurantLocation;
use App\Services\GeofenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LocationController extends Controller
{
    public function __construct(
        private GeofenceService $geofenceService
    ) {}

    public function show(string $publicCode): JsonResponse
    {
        $location = RestaurantLocation::with(['restaurant', 'city', 'state', 'zipcode'])
            ->where('public_location_code', $publicCode)
            ->where('is_active', true)
            ->firstOrFail();

        if (!$location->restaurant->is_active) {
            abort(404, 'Restaurant is not active');
        }

        return response()->json([
            'location' => new LocationResource($location),
        ]);
    }

    public function menu(string $publicCode): JsonResponse
    {
        $location = RestaurantLocation::with([
            'activeMenu.categories' => function ($query) {
                $query->where('is_active', true)->orderBy('sort_order');
            },
            'activeMenu.categories.items' => function ($query) {
                $query->where('is_available', true)->orderBy('sort_order');
            },
            'activeMenu.categories.items.options.values' => function ($query) {
                $query->where('is_available', true)->orderBy('sort_order');
            },
        ])
            ->where('public_location_code', $publicCode)
            ->where('is_active', true)
            ->firstOrFail();

        if (!$location->activeMenu) {
            return response()->json([
                'menu' => null,
                'message' => 'No active menu available',
            ]);
        }

        return response()->json([
            'menu' => new MenuResource($location->activeMenu),
            'tax_rate' => (float) $location->tax_rate,
        ]);
    }

    public function verify(Request $request, string $publicCode): JsonResponse
    {
        $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'device_fingerprint' => ['nullable', 'string', 'max:255'],
        ]);

        $location = RestaurantLocation::where('public_location_code', $publicCode)
            ->where('is_active', true)
            ->firstOrFail();

        $verification = $this->geofenceService->verifyLocation(
            $location,
            $request->latitude,
            $request->longitude
        );

        if (!$verification['is_valid']) {
            throw ValidationException::withMessages([
                'location' => [
                    'You must be at the restaurant to place an order. ' .
                    'Distance: ' . round($verification['distance_meters']) . 'm, ' .
                    'Allowed: ' . $verification['allowed_radius_meters'] . 'm'
                ],
            ]);
        }

        $geoToken = $this->geofenceService->createGeoToken(
            $location,
            $request->latitude,
            $request->longitude,
            $request->device_fingerprint,
            $request->ip()
        );

        return response()->json([
            'verified' => true,
            'geo_token' => $geoToken->token,
            'expires_at' => $geoToken->expires_at,
            'distance_meters' => $verification['distance_meters'],
        ]);
    }
}
