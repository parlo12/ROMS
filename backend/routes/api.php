<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Customer\LocationController;
use App\Http\Controllers\Api\Customer\OrderController;
use App\Http\Controllers\Api\Customer\PaymentController;
use App\Http\Controllers\Api\Dashboard\AnalyticsController;
use App\Http\Controllers\Api\Dashboard\MenuController;
use App\Http\Controllers\Api\Dashboard\OrderController as DashboardOrderController;
use App\Http\Controllers\Api\Dashboard\OwnerController;
use App\Http\Controllers\Api\Dashboard\StaffController;
use App\Http\Controllers\Api\Admin\AdminController;
use App\Http\Controllers\Api\WebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Webhooks (no auth required, signature verification handled in controller)
Route::post('/stripe/webhook', [WebhookController::class, 'handleStripe'])
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);

// Public customer endpoints
Route::prefix('locations/{publicCode}')->group(function () {
    Route::get('/', [LocationController::class, 'show']);
    Route::get('/menu', [LocationController::class, 'menu']);
    Route::post('/verify', [LocationController::class, 'verify']);

    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{orderId}', [OrderController::class, 'show']);
    Route::get('/orders/{orderId}/status', [OrderController::class, 'status']);
    Route::post('/orders/{orderId}/payment-intent', [PaymentController::class, 'createPaymentIntent']);
    Route::post('/calculate-total', [OrderController::class, 'calculateTotal']);
});

// Authentication endpoints
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });
});

// Dashboard endpoints (authenticated)
Route::middleware('auth:sanctum')->prefix('dashboard')->group(function () {
    // Orders
    Route::get('/orders', [DashboardOrderController::class, 'index']);
    Route::get('/orders/pending', [DashboardOrderController::class, 'pending']);
    Route::get('/orders/{orderId}', [DashboardOrderController::class, 'show']);
    Route::patch('/orders/{orderId}/status', [DashboardOrderController::class, 'updateStatus']);
    Route::patch('/orders/{orderId}/mark-paid', [DashboardOrderController::class, 'markPaid']);

    // Menu management
    Route::get('/menus', [MenuController::class, 'index']);
    Route::post('/menus', [MenuController::class, 'store']);
    Route::patch('/menus/{menuId}', [MenuController::class, 'update']);

    Route::post('/categories', [MenuController::class, 'storeCategory']);
    Route::patch('/categories/{categoryId}', [MenuController::class, 'updateCategory']);

    Route::post('/items', [MenuController::class, 'storeItem']);
    Route::patch('/items/{itemId}', [MenuController::class, 'updateItem']);
    Route::delete('/items/{itemId}', [MenuController::class, 'destroyItem']);

    // Analytics
    Route::get('/analytics', [AnalyticsController::class, 'index']);
    Route::get('/analytics/summary', [AnalyticsController::class, 'summary']);

    // Owner dashboard
    Route::get('/owner/overview', [OwnerController::class, 'overview']);
    Route::get('/owner/analytics', [OwnerController::class, 'analytics']);
    Route::get('/owner/locations', [OwnerController::class, 'locations']);

    // Staff management
    Route::get('/staff', [StaffController::class, 'index']);
    Route::post('/staff', [StaffController::class, 'store']);
    Route::patch('/staff/{assignmentId}', [StaffController::class, 'update']);
    Route::delete('/staff/{assignmentId}', [StaffController::class, 'destroy']);
});

// Admin endpoints (authenticated + platform admin)
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/restaurants', [AdminController::class, 'restaurants']);
    Route::get('/analytics', [AdminController::class, 'analytics']);
    Route::get('/revenue', [AdminController::class, 'revenue']);
});
