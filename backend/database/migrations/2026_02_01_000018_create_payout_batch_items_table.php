<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payout_batch_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payout_batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('location_id')->constrained('restaurant_locations')->cascadeOnDelete();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->integer('gross_cents');
            $table->integer('platform_fee_cents');
            $table->integer('stripe_fee_cents');
            $table->integer('net_payout_cents');
            $table->integer('order_count')->default(0);
            $table->string('stripe_transfer_id')->nullable();
            $table->enum('status', ['pending', 'transferred', 'failed'])->default('pending');
            $table->timestamps();

            $table->index(['payout_batch_id', 'location_id']);
            $table->index('stripe_transfer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payout_batch_items');
    }
};
