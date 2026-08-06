<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BarangayRequest  extends Model

{
    public function user()
{
    return $this->belongsTo(User::class, 'user_id', 'user_id');
}

public function documentType()
{
    return $this->belongsTo(DocumentType::class, 'document_type_id', 'document_type_id');
}

public function verifier()
{
    return $this->belongsTo(Staff::class, 'verified_by', 'staff_id');
}
public function notifications()
{
    return $this->hasMany(Notification::class, 'request_id', 'request_id');
}
   /** @use HasFactory<\Database\Factories\BarangayRequestFactory> */
    use HasFactory;
    protected $primaryKey = 'request_id';


    protected $fillable = [
        'user_id',
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
        'document_type_id',
        'purpose',
        'status',
        'remarks',
        'verified_by',
        'verified_at',
        'claimed_at',
    ];
}
