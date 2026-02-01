<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('location_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained('restaurant_locations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('role', ['owner', 'manager', 'cashier', 'server'])->default('cashier');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['location_id', 'user_id']);
            $table->index(['user_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('location_users');
    }
};
