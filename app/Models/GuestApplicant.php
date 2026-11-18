<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;

class GuestApplicant extends Model
{
    protected $primaryKey = 'guest_applicant_id';

    protected $fillable = [
        'request_id',
        'first_name',
        'middle_name',
        'no_middle_name',
        'last_name',
        'birth_date',
        'contact_number',
        'street_name',
        'address',
        'valid_id_type',
        'valid_id_front',
        'valid_id_front_disk',
        'valid_id_front_original_name',
        'valid_id_front_mime_type',
        'valid_id_back',
        'valid_id_back_disk',
        'valid_id_back_original_name',
        'valid_id_back_mime_type',
    ];

    protected $hidden = [
        'valid_id_front',
        'valid_id_front_disk',
        'valid_id_back',
        'valid_id_back_disk',
    ];

    protected $casts = [
        'birth_date' => 'date:Y-m-d',
    ];

    protected $appends = [
        'valid_id_front_url',
        'valid_id_back_url',
    ];

    public function request()
    {
        return $this->belongsTo(
            BarangayRequest::class,
            'request_id',
            'request_id'
        );
    }

    public function getValidIdFrontUrlAttribute(): ?string
    {
        return $this->signedFileUrl('valid_id_front');
    }

    public function getValidIdBackUrlAttribute(): ?string
    {
        return $this->signedFileUrl('valid_id_back');
    }

    private function signedFileUrl(string $field): ?string
    {
        if (! is_string($this->getRawOriginal($field)) || $this->getRawOriginal($field) === '') {
            return null;
        }

        return URL::temporarySignedRoute(
            'api.guest-applicant-file',
            now()->addMinutes(30),
            ['guestApplicant' => $this->getKey(), 'field' => $field]
        );
    }
}
