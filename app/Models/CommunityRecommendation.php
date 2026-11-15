<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CommunityRecommendation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'category',
        'eligibility',
        'min_age',
        'max_age',
        'eligible_genders',
        'eligible_civil_statuses',
        'requires_verified',
        'priority',
        'starts_at',
        'ends_at',
        'is_active',
    ];

    protected $casts = [
        'min_age' => 'integer',
        'max_age' => 'integer',
        'eligible_genders' => 'array',
        'eligible_civil_statuses' => 'array',
        'requires_verified' => 'boolean',
        'priority' => 'integer',
        'starts_at' => 'date:Y-m-d',
        'ends_at' => 'date:Y-m-d',
        'is_active' => 'boolean',
    ];
}
