<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Request extends Model
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
    /** @use HasFactory<\Database\Factories\RequestFactory> */
    use HasFactory;
}
