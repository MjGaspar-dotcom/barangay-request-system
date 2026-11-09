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
        'processing_started_at',
        'processing_by',
        'document_prepared_at',
        'document_prepared_by',
        'document_signed_at',
        'document_signed_by',
        'release_recipient_name',
        'released_by',
        'prepared_document_id',
        'signed_document_id',
        'requirements_complete',
    ];

    protected $casts = [
        'requirements_complete' => 'boolean',
        'verified_at' => 'datetime',
        'approved_at' => 'datetime',
        'ready_for_pickup_at' => 'datetime',
        'claimed_at' => 'datetime',
        'processing_started_at' => 'datetime',
        'document_prepared_at' => 'datetime',
        'document_signed_at' => 'datetime',
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

    public function documents()
    {
        return $this->hasMany(
            BarangayRequestDocument::class,
            'request_id',
            'request_id'
        );
    }

    public function preparedDocument()
    {
        return $this->belongsTo(
            BarangayRequestDocument::class,
            'prepared_document_id',
            'request_document_id'
        );
    }

    public function signedDocument()
    {
        return $this->belongsTo(
            BarangayRequestDocument::class,
            'signed_document_id',
            'request_document_id'
        );
    }
}