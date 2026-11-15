<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BarangaySettings extends Model
{
    protected $table = 'barangay_settings';

    protected $fillable = [
        'barangay_name',
        'municipality',
        'province',
        'punong_barangay_name',
        'seal_path',
        'office_address',
        'contact_information',
        'council_roster',
    ];

    protected $casts = [
        'council_roster' => 'array',
    ];
}
