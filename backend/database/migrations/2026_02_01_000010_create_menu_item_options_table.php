<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_item_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('menu_items')->cascadeOnDelete();
            $table->string('name');
            $table->enum('selection_type', ['single', 'multiple'])->default('single');
            $table->boolean('required')->default(false);
            $table->integer('min_selections')->default(0);
            $table->integer('max_selections')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['item_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_item_options');
    }
};
