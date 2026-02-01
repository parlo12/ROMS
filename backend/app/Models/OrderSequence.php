<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class OrderSequence extends Model
{
    use HasFactory;

    protected $fillable = [
        'location_id',
        'sequence_date',
        'last_order_number',
    ];

    protected function casts(): array
    {
        return [
            'sequence_date' => 'date',
        ];
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(RestaurantLocation::class, 'location_id');
    }

    public static function getNextOrderNumber(int $locationId): int
    {
        return DB::transaction(function () use ($locationId) {
            $today = now()->toDateString();

            $sequence = self::lockForUpdate()
                ->where('location_id', $locationId)
                ->where('sequence_date', $today)
                ->first();

            if (!$sequence) {
                $sequence = self::create([
                    'location_id' => $locationId,
                    'sequence_date' => $today,
                    'last_order_number' => 1,
                ]);

                return 1;
            }

            $sequence->increment('last_order_number');

            return $sequence->last_order_number;
        });
    }
}
