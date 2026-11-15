<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentTemplateVersion extends Model
{
    protected $primaryKey = 'template_version_id';

    protected $fillable = [
        'template_id',
        'version_number',
        'storage_disk',
        'storage_path',
        'original_name',
        'mime_type',
        'file_size',
        'sha256',
        'page_count',
        'has_acroform',
        'is_active',
        'uploaded_by',
        'replaced_at',
        'replaced_by',
    ];

    protected $hidden = [
        'storage_path',
        'storage_disk',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'page_count' => 'integer',
        'has_acroform' => 'boolean',
        'is_active' => 'boolean',
        'replaced_at' => 'datetime',
    ];

    public function template()
    {
        return $this->belongsTo(
            DocumentTemplate::class,
            'template_id',
            'template_id'
        );
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by', 'user_id');
    }

    public function mappings()
    {
        return $this->hasMany(
            DocumentTemplateFieldMapping::class,
            'template_version_id',
            'template_version_id'
        );
    }
}
