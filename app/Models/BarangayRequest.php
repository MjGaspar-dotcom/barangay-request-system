<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BarangayRequest extends Model
{
    use HasFactory;

    protected $table = 'barangay_requests';

    protected $primaryKey = 'request_id';

    protected $fillable = [

        // Registered User
        'user_id',

        // Guest Information
        'guest_first_name',
        'guest_middle_name',
        'guest_last_name',
        'guest_birth_date',
        'guest_gender',
        'guest_civil_status',
        'guest_address',
        'guest_contact_number',
        'guest_email',
        'guest_valid_id_type',
        'guest_valid_id_image',

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
        'guest_birth_date' => 'date',
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