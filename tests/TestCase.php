<?php

namespace Tests;

use App\Models\DocumentType;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function createDocumentType(array $attributes): DocumentType
    {
        $documentType = DocumentType::withTrashed()
            ->where('document_name', $attributes['document_name'])
            ->first();

        if (!$documentType) {
            return DocumentType::create($attributes);
        }

        if ($documentType->trashed()) {
            $documentType->restore();
        }
        $documentType->fill($attributes);
        $documentType->save();

        return $documentType;
    }
}
