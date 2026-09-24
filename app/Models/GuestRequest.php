<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GuestRequest extends Model
{
    use HasFactory;

    protected $table = 'guest_requests';

    protected $primaryKey = 'guest_request_id';

    protected $fillable = [

        // Guest Personal Information
        'first_name',
        'middle_name',
        'last_name',
        'birth_date',
        'gender',
        'civil_status',
        'address',
        'contact_number',
        'email',
        'valid_id_type',
        'valid_id_image',

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
        'birth_date' => 'date',
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
