<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Platform Fee Percentage
    |--------------------------------------------------------------------------
    |
    | The percentage of each order that the platform takes as a fee.
    | This is charged to restaurants on each transaction.
    |
    */
    'platform_fee_percentage' => env('PLATFORM_FEE_PERCENTAGE', 3),

    /*
    |--------------------------------------------------------------------------
    | Geofencing Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for location verification and geofencing.
    |
    */
    'geofence' => [
        'default_radius_meters' => 100,
        'max_radius_meters' => 500,
        'token_ttl_minutes' => 15,
    ],

    /*
    |--------------------------------------------------------------------------
    | Order Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for order management.
    |
    */
    'orders' => [
        'session_id_length' => 32,
        'order_number_reset_daily' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Stripe Settings
    |--------------------------------------------------------------------------
    |
    | Stripe-related configuration.
    |
    */
    'stripe' => [
        'currency' => 'usd',
        'statement_descriptor' => 'ROMS ORDER',
    ],

    /*
    |--------------------------------------------------------------------------
    | Frontend URLs
    |--------------------------------------------------------------------------
    |
    | URLs for frontend applications.
    |
    */
    'frontend' => [
        'url' => env('FRONTEND_URL', 'http://localhost:3000'),
        'customer_app_path' => '/r',
        'dashboard_path' => '/dashboard',
    ],
];
