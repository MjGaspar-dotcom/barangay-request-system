<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentTemplateFieldMapping extends Model
{
    protected $primaryKey = 'field_mapping_id';

    protected $fillable = [
        'template_version_id',
        'field_name',
        'field_type',
        'system_field',
        'page_number',
        'x',
        'y',
        'width',
        'height',
        'font_size',
        'font_family',
        'text_align',
        'is_required',
    ];

    protected $casts = [
        'page_number' => 'integer',
        'x' => 'float',
        'y' => 'float',
        'width' => 'float',
        'height' => 'float',
        'font_size' => 'float',
        'is_required' => 'boolean',
    ];

    public function templateVersion()
    {
        return $this->belongsTo(
            DocumentTemplateVersion::class,
            'template_version_id',
            'template_version_id'
        );
    }
}
