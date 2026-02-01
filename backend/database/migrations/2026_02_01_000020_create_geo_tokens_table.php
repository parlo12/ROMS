<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('geo_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained('restaurant_locations')->cascadeOnDelete();
            $table->string('token', 64)->unique();
            $table->string('device_fingerprint')->nullable();
            $table->string('ip_address')->nullable();
            $table->decimal('verified_latitude', 10, 8);
            $table->decimal('verified_longitude', 11, 8);
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();

            $table->index(['token', 'expires_at']);
            $table->index('location_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('geo_tokens');
    }
};
