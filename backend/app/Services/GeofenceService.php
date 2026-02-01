<?php

namespace App\Services;

use App\Models\GeoToken;
use App\Models\RestaurantLocation;

class GeofenceService
{
    private const EARTH_RADIUS_METERS = 6371000;

    public function isWithinRadius(
        float $userLat,
        float $userLng,
        float $locationLat,
        float $locationLng,
        int $radiusMeters
    ): bool {
        $distance = $this->calculateDistance($userLat, $userLng, $locationLat, $locationLng);
        return $distance <= $radiusMeters;
    }

    public function calculateDistance(
        float $lat1,
        float $lng1,
        float $lat2,
        float $lng2
    ): float {
        $lat1Rad = deg2rad($lat1);
        $lat2Rad = deg2rad($lat2);
        $deltaLat = deg2rad($lat2 - $lat1);
        $deltaLng = deg2rad($lng2 - $lng1);

        $a = sin($deltaLat / 2) * sin($deltaLat / 2) +
            cos($lat1Rad) * cos($lat2Rad) *
            sin($deltaLng / 2) * sin($deltaLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return self::EARTH_RADIUS_METERS * $c;
    }

    public function verifyLocation(
        RestaurantLocation $location,
        float $userLat,
        float $userLng
    ): array {
        $distance = $this->calculateDistance(
            $userLat,
            $userLng,
            (float) $location->latitude,
            (float) $location->longitude
        );

        $isWithinRadius = $distance <= $location->geofence_radius_meters;

        return [
            'is_valid' => $isWithinRadius,
            'distance_meters' => round($distance, 2),
            'allowed_radius_meters' => $location->geofence_radius_meters,
        ];
    }

    public function createGeoToken(
        RestaurantLocation $location,
        float $userLat,
        float $userLng,
        ?string $deviceFingerprint = null,
        ?string $ipAddress = null
    ): GeoToken {
        $ttlMinutes = config('roms.geofence.token_ttl_minutes', 15);

        return GeoToken::generate(
            $location->id,
            $userLat,
            $userLng,
            $deviceFingerprint,
            $ipAddress,
            $ttlMinutes
        );
    }

    public function validateGeoToken(string $token, int $locationId): ?GeoToken
    {
        $geoToken = GeoToken::findValid($token);

        if (!$geoToken) {
            return null;
        }

        if ($geoToken->location_id !== $locationId) {
            return null;
        }

        return $geoToken;
    }
}
