<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\LocationUser;
use App\Models\Restaurant;
use App\Models\RestaurantLocation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            $user = $request->user();
            if ($user->isPlatformAdmin()) {
                abort(403, 'Platform admins should use the admin dashboard.');
            }

            // Must be an owner
            $hasOwnership = Restaurant::where('owner_user_id', $user->id)->exists();
            if (!$hasOwnership) {
                abort(403, 'Access denied. Owner privileges required.');
            }

            return $next($request);
        });
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get all location IDs owned by this user
        $ownedLocationIds = RestaurantLocation::whereIn(
            'restaurant_id',
            Restaurant::where('owner_user_id', $user->id)->pluck('id')
        )->pluck('id');

        // Get all staff assignments for these locations
        $staffAssignments = LocationUser::with(['user', 'location.restaurant'])
            ->whereIn('location_id', $ownedLocationIds)
            ->orderBy('created_at', 'desc')
            ->get();

        $staff = $staffAssignments->map(function ($assignment) {
            return [
                'id' => $assignment->id,
                'user_id' => $assignment->user_id,
                'name' => $assignment->user->name,
                'email' => $assignment->user->email,
                'role' => $assignment->role,
                'location_id' => $assignment->location_id,
                'location_name' => $assignment->location->location_name,
                'restaurant_name' => $assignment->location->restaurant->display_name,
                'is_active' => $assignment->is_active,
                'created_at' => $assignment->created_at->toISOString(),
            ];
        });

        return response()->json([
            'staff' => $staff,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['manager', 'cashier', 'server'])],
            'location_id' => ['required', 'integer', 'exists:restaurant_locations,id'],
        ]);

        // Verify the location belongs to a restaurant owned by this user
        $location = RestaurantLocation::with('restaurant')
            ->where('id', $validated['location_id'])
            ->first();

        if (!$location || $location->restaurant->owner_user_id !== $user->id) {
            abort(403, 'You do not own this location.');
        }

        // Check if user already exists
        $staffUser = User::where('email', $validated['email'])->first();

        if (!$staffUser) {
            // Create new user
            $staffUser = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);
        }

        // Check if already assigned to this location
        $existingAssignment = LocationUser::where('user_id', $staffUser->id)
            ->where('location_id', $validated['location_id'])
            ->first();

        if ($existingAssignment) {
            return response()->json([
                'message' => 'This user is already assigned to this location.',
            ], 422);
        }

        // Create the staff assignment
        $assignment = LocationUser::create([
            'user_id' => $staffUser->id,
            'location_id' => $validated['location_id'],
            'role' => $validated['role'],
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Staff member added successfully.',
            'staff' => [
                'id' => $assignment->id,
                'user_id' => $staffUser->id,
                'name' => $staffUser->name,
                'email' => $staffUser->email,
                'role' => $assignment->role,
                'location_id' => $assignment->location_id,
                'location_name' => $location->location_name,
                'restaurant_name' => $location->restaurant->display_name,
            ],
        ], 201);
    }

    public function update(Request $request, int $assignmentId): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'role' => ['sometimes', Rule::in(['manager', 'cashier', 'server'])],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $assignment = LocationUser::with('location.restaurant')
            ->where('id', $assignmentId)
            ->first();

        if (!$assignment) {
            abort(404, 'Staff assignment not found.');
        }

        // Verify ownership
        if ($assignment->location->restaurant->owner_user_id !== $user->id) {
            abort(403, 'You do not own this location.');
        }

        // Cannot update owner role
        if ($assignment->role === 'owner') {
            abort(403, 'Cannot modify owner assignments.');
        }

        $assignment->update($validated);

        return response()->json([
            'message' => 'Staff member updated successfully.',
            'staff' => [
                'id' => $assignment->id,
                'role' => $assignment->role,
                'is_active' => $assignment->is_active,
            ],
        ]);
    }

    public function destroy(Request $request, int $assignmentId): JsonResponse
    {
        $user = $request->user();

        $assignment = LocationUser::with('location.restaurant')
            ->where('id', $assignmentId)
            ->first();

        if (!$assignment) {
            abort(404, 'Staff assignment not found.');
        }

        // Verify ownership
        if ($assignment->location->restaurant->owner_user_id !== $user->id) {
            abort(403, 'You do not own this location.');
        }

        // Cannot delete owner role
        if ($assignment->role === 'owner') {
            abort(403, 'Cannot remove owner assignments.');
        }

        $assignment->delete();

        return response()->json([
            'message' => 'Staff member removed successfully.',
        ]);
    }
}
