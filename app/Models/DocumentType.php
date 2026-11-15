<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentType extends Model
{
    /** @use HasFactory<\Database\Factories\DocumentTypeFactory> */
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'document_type_id';

    protected $fillable = [
        'document_name',
        'description',
        'processing_time_minutes',
        'min_age',
        'max_age',
        'is_active',
    ];

    protected $casts = [
        'min_age' => 'integer',
        'max_age' => 'integer',
    ];

    /**
     * Registered-user requests for this document type.
     */
    public function requests()
    {
        return $this->hasMany(BarangayRequest::class, 'document_type_id', 'document_type_id');
    }

    public function template()
    {
        return $this->hasOne(
            DocumentTemplate::class,
            'document_type_id',
            'document_type_id'
        );
    }
}