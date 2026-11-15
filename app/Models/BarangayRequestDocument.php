<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BarangayRequestDocument extends Model
{
    protected $primaryKey = 'request_document_id';

    protected $fillable = [
        'request_id',
        'uploaded_by',
        'purpose',
        'original_name',
        'storage_path',
        'storage_disk',
        'mime_type',
    ];

    protected $hidden = [
        'storage_path',
        'storage_disk',
    ];

    public function request()
    {
        return $this->belongsTo(BarangayRequest::class, 'request_id', 'request_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by', 'user_id');
    }
}
