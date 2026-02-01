<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Resources\MenuResource;
use App\Http\Resources\MenuCategoryResource;
use App\Http\Resources\MenuItemResource;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\RestaurantLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MenuController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'location_id' => ['required', 'integer', 'exists:restaurant_locations,id'],
        ]);

        $this->authorizeLocationAccess($request->user(), $request->location_id, true);

        $menus = Menu::with(['categories.items'])
            ->where('location_id', $request->location_id)
            ->get();

        return response()->json([
            'menus' => MenuResource::collection($menus),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'location_id' => ['required', 'integer', 'exists:restaurant_locations,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $this->authorizeLocationAccess($request->user(), $request->location_id, true);

        $menu = Menu::create([
            'location_id' => $request->location_id,
            'name' => $request->name,
            'description' => $request->description,
            'is_active' => $request->is_active ?? false,
        ]);

        return response()->json([
            'menu' => new MenuResource($menu),
            'message' => 'Menu created successfully',
        ], 201);
    }

    public function update(Request $request, int $menuId): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $menu = Menu::findOrFail($menuId);

        $this->authorizeLocationAccess($request->user(), $menu->location_id, true);

        $menu->update($request->only(['name', 'description', 'is_active']));

        return response()->json([
            'menu' => new MenuResource($menu->fresh(['categories.items'])),
            'message' => 'Menu updated successfully',
        ]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $request->validate([
            'menu_id' => ['required', 'integer', 'exists:menus,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $menu = Menu::findOrFail($request->menu_id);

        $this->authorizeLocationAccess($request->user(), $menu->location_id, true);

        $category = MenuCategory::create([
            'menu_id' => $request->menu_id,
            'name' => $request->name,
            'description' => $request->description,
            'sort_order' => $request->sort_order ?? 0,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'category' => new MenuCategoryResource($category),
            'message' => 'Category created successfully',
        ], 201);
    }

    public function updateCategory(Request $request, int $categoryId): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $category = MenuCategory::with('menu')->findOrFail($categoryId);

        $this->authorizeLocationAccess($request->user(), $category->menu->location_id, true);

        $category->update($request->only(['name', 'description', 'sort_order', 'is_active']));

        return response()->json([
            'category' => new MenuCategoryResource($category->fresh(['items'])),
            'message' => 'Category updated successfully',
        ]);
    }

    public function storeItem(Request $request): JsonResponse
    {
        $request->validate([
            'category_id' => ['required', 'integer', 'exists:menu_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price_cents' => ['required', 'integer', 'min:0'],
            'photo' => ['nullable', 'image', 'max:5120'],
            'is_available' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'preparation_time_minutes' => ['nullable', 'integer', 'min:0'],
            'allergens' => ['nullable', 'array'],
            'dietary_info' => ['nullable', 'array'],
        ]);

        $category = MenuCategory::with('menu')->findOrFail($request->category_id);

        $this->authorizeLocationAccess($request->user(), $category->menu->location_id, true);

        $photoUrl = null;
        if ($request->hasFile('photo')) {
            $photoUrl = $request->file('photo')->store('menu-items', 'public');
        }

        $item = MenuItem::create([
            'category_id' => $request->category_id,
            'name' => $request->name,
            'description' => $request->description,
            'price_cents' => $request->price_cents,
            'photo_url' => $photoUrl,
            'is_available' => $request->is_available ?? true,
            'sort_order' => $request->sort_order ?? 0,
            'preparation_time_minutes' => $request->preparation_time_minutes,
            'allergens' => $request->allergens,
            'dietary_info' => $request->dietary_info,
        ]);

        return response()->json([
            'item' => new MenuItemResource($item),
            'message' => 'Menu item created successfully',
        ], 201);
    }

    public function updateItem(Request $request, int $itemId): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price_cents' => ['required', 'integer', 'min:0'],
            'photo' => ['nullable', 'image', 'max:5120'],
            'is_available' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'preparation_time_minutes' => ['nullable', 'integer', 'min:0'],
            'allergens' => ['nullable', 'array'],
            'dietary_info' => ['nullable', 'array'],
        ]);

        $item = MenuItem::with('category.menu')->findOrFail($itemId);

        $this->authorizeLocationAccess($request->user(), $item->category->menu->location_id, true);

        if ($request->hasFile('photo')) {
            if ($item->photo_url) {
                Storage::disk('public')->delete($item->photo_url);
            }
            $item->photo_url = $request->file('photo')->store('menu-items', 'public');
        }

        $item->update($request->only([
            'name', 'description', 'price_cents', 'is_available',
            'sort_order', 'preparation_time_minutes', 'allergens', 'dietary_info'
        ]));

        return response()->json([
            'item' => new MenuItemResource($item->fresh(['options.values'])),
            'message' => 'Menu item updated successfully',
        ]);
    }

    public function destroyItem(Request $request, int $itemId): JsonResponse
    {
        $item = MenuItem::with('category.menu')->findOrFail($itemId);

        $this->authorizeLocationAccess($request->user(), $item->category->menu->location_id, true);

        if ($item->photo_url) {
            Storage::disk('public')->delete($item->photo_url);
        }

        $item->delete();

        return response()->json([
            'message' => 'Menu item deleted successfully',
        ]);
    }

    private function authorizeLocationAccess($user, int $locationId, bool $requireManageAccess = false): void
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

        if (!$assignment) {
            abort(403, 'You do not have access to this location');
        }

        if ($requireManageAccess && !$assignment->canManageMenu()) {
            abort(403, 'You do not have permission to manage menus');
        }
    }
}
