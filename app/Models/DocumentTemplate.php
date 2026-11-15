<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentTemplate extends Model
{
    use SoftDeletes;

    protected $primaryKey = 'template_id';

    protected $fillable = [
        'document_type_id',
        'deleted_by',
    ];

    public function documentType()
    {
        return $this->belongsTo(
            DocumentType::class,
            'document_type_id',
            'document_type_id'
        );
    }

    public function versions()
    {
        return $this->hasMany(
            DocumentTemplateVersion::class,
            'template_id',
            'template_id'
        )->orderByDesc('version_number');
    }

    public function activeVersion()
    {
        return $this->hasOne(
            DocumentTemplateVersion::class,
            'template_id',
            'template_id'
        )->where('is_active', true);
    }
}
