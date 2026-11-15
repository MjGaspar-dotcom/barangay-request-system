<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeneratedDocument extends Model
{
    protected $primaryKey = 'generated_document_id';

    protected $fillable = [
        'request_id',
        'template_version_id',
        'version_number',
        'document_number',
        'storage_disk',
        'storage_path',
        'original_name',
        'mime_type',
        'file_size',
        'sha256',
        'data_snapshot',
        'generated_by',
        'generated_at',
    ];

    protected $hidden = [
        'storage_path',
        'storage_disk',
    ];

    protected $casts = [
        'version_number' => 'integer',
        'file_size' => 'integer',
        'data_snapshot' => 'array',
        'generated_at' => 'datetime',
    ];

    public function request()
    {
        return $this->belongsTo(
            BarangayRequest::class,
            'request_id',
            'request_id'
        );
    }

    public function templateVersion()
    {
        return $this->belongsTo(
            DocumentTemplateVersion::class,
            'template_version_id',
            'template_version_id'
        );
    }

    public function generator()
    {
        return $this->belongsTo(User::class, 'generated_by', 'user_id');
    }
}
