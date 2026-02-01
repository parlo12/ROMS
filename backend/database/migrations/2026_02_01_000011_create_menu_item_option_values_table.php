<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_item_option_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('option_id')->constrained('menu_item_options')->cascadeOnDelete();
            $table->string('name');
            $table->integer('price_delta_cents')->default(0);
            $table->boolean('is_available')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['option_id', 'is_available', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_item_option_values');
    }
};
