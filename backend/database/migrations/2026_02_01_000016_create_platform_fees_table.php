<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_fees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->integer('gross_amount_cents');
            $table->integer('platform_fee_cents');
            $table->integer('stripe_fee_cents')->default(0);
            $table->integer('restaurant_payout_cents');
            $table->integer('platform_net_cents');
            $table->string('stripe_charge_id')->nullable();
            $table->string('stripe_balance_transaction_id')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('stripe_charge_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_fees');
    }
};
