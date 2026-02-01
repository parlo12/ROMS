<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('location_name');
            $table->string('address_line1');
            $table->string('address_line2')->nullable();
            $table->foreignId('city_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('state_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('zipcode_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->integer('geofence_radius_meters')->default(100);
            $table->string('public_location_code', 20)->unique();
            $table->string('timezone')->default('America/New_York');
            $table->decimal('tax_rate', 5, 4)->default(0.0000);
            $table->boolean('is_active')->default(true);
            $table->string('phone')->nullable();
            $table->json('operating_hours')->nullable();
            $table->timestamps();

            $table->index('restaurant_id');
            $table->index('public_location_code');
            $table->index('is_active');
            $table->index(['latitude', 'longitude']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_locations');
    }
};
