<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class BarangayRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'barangay_requests';

    protected $primaryKey = 'request_id';

    protected $fillable = [

        // Registered User
        'user_id',

        // Request
        'document_type_id',
        'purpose',
        'tracking_number',

        // Processing
        'status',
        'remarks',
        'verified_by',
        'verified_at',
        'approved_at',
        'ready_for_pickup_at',
        'claimed_at',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
        'approved_at' => 'datetime',
        'ready_for_pickup_at' => 'datetime',
        'claimed_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function documentType()
    {
        return $this->belongsTo(
            DocumentType::class,
            'document_type_id',
            'document_type_id'
        );
    }

    public function verifier()
    {
        return $this->belongsTo(
            Staff::class,
            'verified_by',
            'staff_id'
        );
    }
}