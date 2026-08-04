<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentType extends Model
{
    public function requests()
{
    return $this->hasMany(Request::class, 'document_type_id', 'document_type_id');
}       
    /** @use HasFactory<\Database\Factories\DocumentTypeFactory> */
    use HasFactory;
}
