<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\BarangayRequest; 

class DocumentType extends Model
{
    /** @use HasFactory<\Database\Factories\DocumentTypeFactory> */
    use HasFactory;

    protected $primaryKey = 'document_type_id';

    protected $fillable = [
        'document_name',
        'description',
        'processing_days',
        'is_active',
    ];

    public function requests()
    {
        return $this->hasMany(BarangayRequest::class, 'document_type_id', 'document_type_id');
    }
}