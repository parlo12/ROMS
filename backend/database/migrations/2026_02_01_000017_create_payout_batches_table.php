<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payout_batches', function (Blueprint $table) {
            $table->id();
            $table->timestamp('period_start');
            $table->timestamp('period_end');
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->integer('total_gross_cents')->default(0);
            $table->integer('total_platform_fee_cents')->default(0);
            $table->integer('total_stripe_fee_cents')->default(0);
            $table->integer('total_payout_cents')->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'period_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payout_batches');
    }
};
