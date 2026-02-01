<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\LocationUser;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\MenuItemOption;
use App\Models\MenuItemOptionValue;
use App\Models\Restaurant;
use App\Models\RestaurantLocation;
use App\Models\State;
use App\Models\User;
use App\Models\Zipcode;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // Create platform admin
        $admin = User::create([
            'name' => 'Platform Admin',
            'email' => 'admin@roms.local',
            'password' => Hash::make('password'),
            'is_platform_admin' => true,
        ]);

        // Create geography
        $florida = State::create(['name' => 'Florida', 'code' => 'FL']);
        $miami = City::create(['state_id' => $florida->id, 'name' => 'Miami']);
        $zip33101 = Zipcode::create(['code' => '33101', 'city_id' => $miami->id, 'state_id' => $florida->id]);

        // Create restaurant owner
        $owner = User::create([
            'name' => 'John Restaurant Owner',
            'email' => 'owner@demo.local',
            'phone' => '305-555-0100',
            'password' => Hash::make('password'),
        ]);

        // Create restaurant
        $restaurant = Restaurant::create([
            'legal_name' => 'Taco House LLC',
            'display_name' => 'Taco House',
            'owner_user_id' => $owner->id,
            'brand_slug' => 'taco-house',
            'phone' => '305-555-0101',
            'email' => 'info@tacohouse.local',
            'description' => 'Authentic Mexican cuisine in the heart of Miami',
        ]);

        // Create location
        $location = RestaurantLocation::create([
            'restaurant_id' => $restaurant->id,
            'location_name' => 'Downtown Miami',
            'address_line1' => '123 Main Street',
            'city_id' => $miami->id,
            'state_id' => $florida->id,
            'zipcode_id' => $zip33101->id,
            'latitude' => 25.7617,
            'longitude' => -80.1918,
            'geofence_radius_meters' => 100,
            'timezone' => 'America/New_York',
            'tax_rate' => 0.07,
            'phone' => '305-555-0102',
            'operating_hours' => [
                'monday' => ['11:00', '22:00'],
                'tuesday' => ['11:00', '22:00'],
                'wednesday' => ['11:00', '22:00'],
                'thursday' => ['11:00', '22:00'],
                'friday' => ['11:00', '23:00'],
                'saturday' => ['11:00', '23:00'],
                'sunday' => ['12:00', '21:00'],
            ],
        ]);

        // Assign owner to location
        LocationUser::create([
            'location_id' => $location->id,
            'user_id' => $owner->id,
            'role' => 'owner',
        ]);

        // Create cashier
        $cashier = User::create([
            'name' => 'Maria Cashier',
            'email' => 'cashier@demo.local',
            'password' => Hash::make('password'),
        ]);

        LocationUser::create([
            'location_id' => $location->id,
            'user_id' => $cashier->id,
            'role' => 'cashier',
        ]);

        // Create menu
        $menu = Menu::create([
            'location_id' => $location->id,
            'name' => 'Main Menu',
            'description' => 'Our full menu',
            'is_active' => true,
        ]);

        // Create categories and items
        $appetizers = MenuCategory::create([
            'menu_id' => $menu->id,
            'name' => 'Appetizers',
            'description' => 'Start your meal right',
            'sort_order' => 1,
        ]);

        MenuItem::create([
            'category_id' => $appetizers->id,
            'name' => 'Chips & Guacamole',
            'description' => 'Fresh tortilla chips with house-made guacamole',
            'price_cents' => 899,
            'sort_order' => 1,
        ]);

        MenuItem::create([
            'category_id' => $appetizers->id,
            'name' => 'Queso Fundido',
            'description' => 'Melted cheese with chorizo and peppers',
            'price_cents' => 1199,
            'sort_order' => 2,
        ]);

        $tacos = MenuCategory::create([
            'menu_id' => $menu->id,
            'name' => 'Tacos',
            'description' => 'Served with rice and beans',
            'sort_order' => 2,
        ]);

        $carnitasTaco = MenuItem::create([
            'category_id' => $tacos->id,
            'name' => 'Carnitas Tacos',
            'description' => 'Slow-roasted pork with cilantro and onion',
            'price_cents' => 1499,
            'sort_order' => 1,
            'preparation_time_minutes' => 10,
        ]);

        // Add options to carnitas tacos
        $sizeOption = MenuItemOption::create([
            'item_id' => $carnitasTaco->id,
            'name' => 'Size',
            'selection_type' => 'single',
            'required' => true,
            'sort_order' => 1,
        ]);

        MenuItemOptionValue::create([
            'option_id' => $sizeOption->id,
            'name' => '2 Tacos',
            'price_delta_cents' => 0,
            'sort_order' => 1,
        ]);

        MenuItemOptionValue::create([
            'option_id' => $sizeOption->id,
            'name' => '3 Tacos',
            'price_delta_cents' => 450,
            'sort_order' => 2,
        ]);

        $extrasOption = MenuItemOption::create([
            'item_id' => $carnitasTaco->id,
            'name' => 'Extras',
            'selection_type' => 'multiple',
            'required' => false,
            'sort_order' => 2,
        ]);

        MenuItemOptionValue::create([
            'option_id' => $extrasOption->id,
            'name' => 'Extra Guacamole',
            'price_delta_cents' => 200,
            'sort_order' => 1,
        ]);

        MenuItemOptionValue::create([
            'option_id' => $extrasOption->id,
            'name' => 'Sour Cream',
            'price_delta_cents' => 100,
            'sort_order' => 2,
        ]);

        MenuItem::create([
            'category_id' => $tacos->id,
            'name' => 'Carne Asada Tacos',
            'description' => 'Grilled steak with fresh salsa',
            'price_cents' => 1699,
            'sort_order' => 2,
            'preparation_time_minutes' => 12,
        ]);

        MenuItem::create([
            'category_id' => $tacos->id,
            'name' => 'Fish Tacos',
            'description' => 'Battered fish with cabbage slaw',
            'price_cents' => 1599,
            'sort_order' => 3,
            'preparation_time_minutes' => 15,
        ]);

        $burritos = MenuCategory::create([
            'menu_id' => $menu->id,
            'name' => 'Burritos',
            'description' => 'Big and filling',
            'sort_order' => 3,
        ]);

        MenuItem::create([
            'category_id' => $burritos->id,
            'name' => 'California Burrito',
            'description' => 'Carne asada, fries, cheese, guacamole, sour cream',
            'price_cents' => 1499,
            'sort_order' => 1,
        ]);

        MenuItem::create([
            'category_id' => $burritos->id,
            'name' => 'Veggie Burrito',
            'description' => 'Black beans, rice, peppers, cheese, salsa',
            'price_cents' => 1299,
            'sort_order' => 2,
            'dietary_info' => ['vegetarian'],
        ]);

        $drinks = MenuCategory::create([
            'menu_id' => $menu->id,
            'name' => 'Drinks',
            'sort_order' => 4,
        ]);

        MenuItem::create([
            'category_id' => $drinks->id,
            'name' => 'Horchata',
            'description' => 'Traditional rice drink with cinnamon',
            'price_cents' => 399,
            'sort_order' => 1,
        ]);

        MenuItem::create([
            'category_id' => $drinks->id,
            'name' => 'Jamaica',
            'description' => 'Hibiscus flower tea',
            'price_cents' => 399,
            'sort_order' => 2,
        ]);

        MenuItem::create([
            'category_id' => $drinks->id,
            'name' => 'Mexican Coke',
            'description' => 'Made with real cane sugar',
            'price_cents' => 350,
            'sort_order' => 3,
        ]);

        $this->command->info('Demo data seeded successfully!');
        $this->command->info('');
        $this->command->info('Test accounts:');
        $this->command->info('  Platform Admin: admin@roms.local / password');
        $this->command->info('  Restaurant Owner: owner@demo.local / password');
        $this->command->info('  Cashier: cashier@demo.local / password');
        $this->command->info('');
        $this->command->info('Location public code: ' . $location->public_location_code);
    }
}
