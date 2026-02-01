<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_sequences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained('restaurant_locations')->cascadeOnDelete();
            $table->date('sequence_date');
            $table->integer('last_order_number')->default(0);
            $table->timestamps();

            $table->unique(['location_id', 'sequence_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_sequences');
    }
};
