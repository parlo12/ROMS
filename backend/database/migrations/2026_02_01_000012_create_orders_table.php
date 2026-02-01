<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained('restaurant_locations')->cascadeOnDelete();
            $table->integer('order_number');
            $table->enum('status', [
                'placed',
                'accepted',
                'preparing',
                'ready',
                'completed',
                'cancelled'
            ])->default('placed');
            $table->enum('payment_status', [
                'unpaid',
                'pending',
                'paid',
                'failed',
                'refunded'
            ])->default('unpaid');
            $table->enum('payment_method', ['cash', 'card'])->default('cash');
            $table->integer('subtotal_cents');
            $table->integer('tax_cents')->default(0);
            $table->integer('tip_cents')->default(0);
            $table->integer('total_cents');
            $table->string('table_number')->nullable();
            $table->string('customer_session_id');
            $table->string('customer_name')->nullable();
            $table->string('customer_phone')->nullable();
            $table->string('stripe_payment_intent_id')->nullable();
            $table->text('special_instructions')->nullable();
            $table->timestamp('placed_at')->useCurrent();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancelled_reason')->nullable();
            $table->timestamps();

            $table->index(['location_id', 'placed_at']);
            $table->index(['location_id', 'status']);
            $table->index(['location_id', 'payment_status']);
            $table->index('customer_session_id');
            $table->index('stripe_payment_intent_id');
            $table->unique(['location_id', 'order_number', 'placed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
