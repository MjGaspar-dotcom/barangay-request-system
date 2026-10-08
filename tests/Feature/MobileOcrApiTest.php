<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class MobileOcrApiTest extends TestCase
{
    public function test_mobile_ocr_endpoint_returns_parsed_birth_date(): void
    {
        $builder = new class
        {
            public function language(string $language): self
            {
                return $this;
            }

            public function run(): string
            {
                return "PHILIPPINE IDENTIFICATION SYSTEM\n"
                    ."Surname/Apelyido: DELA CRUZ\n"
                    ."Given Names/Mga Pangalan: JUAN\n"
                    ."DOB: 15-08-1995\n"
                    .'PSN: 1234-5678-9012-3456';
            }
        };

        app()->instance('ocr', new class($builder)
        {
            public function __construct(private object $builder) {}

            public function image(string $path): object
            {
                return $this->builder;
            }
        });

        $response = $this->post('/api/ocr/extract', [
            'image' => UploadedFile::fake()->createWithContent(
                'id.png',
                base64_decode(
                    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCYsAAAAASUVORK5CYII=',
                    true
                )
            ),
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.birth_date', '1995-08-15');
    }

    public function test_mobile_ocr_endpoint_rejects_non_image_uploads(): void
    {
        $response = $this->post('/api/ocr/extract', [
            'image' => UploadedFile::fake()->create('document.txt', 10, 'text/plain'),
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('image');
    }
}
