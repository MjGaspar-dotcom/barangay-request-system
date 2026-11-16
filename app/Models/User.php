<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\URL;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    public function requests()
    {
        return $this->hasMany(BarangayRequest::class, 'user_id', 'user_id');

    }

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'user_id', 'user_id');
    }

    // staff
    public function staff()
    {
        return $this->hasOne(Staff::class, 'user_id', 'user_id');
    }

    // admin
    public function admin()
    {
        return $this->hasOne(Admin::class, 'user_id', 'user_id');
    }
    //     //admin
    // public function isAdmin()
    // {
    //     return $this->role === 'admin';
    // }

    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, SoftDeletes;

    protected $primaryKey = 'user_id';

    protected $hidden = [
        'password',
        'remember_token',
        'google_id',
        'profile_picture',
        'profile_picture_disk',
        'valid_id_front',
        'valid_id_front_disk',
        'valid_id_back',
        'valid_id_back_disk',
    ];

    protected $appends = [
        'profile_picture_url',
        'valid_id_front_url',
        'valid_id_back_url',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'email_verified_at' => 'datetime',
        'profile_picture_uploaded_at' => 'datetime',
        'valid_id_front_uploaded_at' => 'datetime',
        'valid_id_back_uploaded_at' => 'datetime',
    ];

    protected $fillable = [
        'username',
        'password',
        'google_id',
        'email_verified_at',
        'first_name',
        'middle_name',
        'last_name',
        'birth_date',
        'gender',
        'civil_status',
        'address',
        'street_name',
        'barangay_name',
        'municipality',
        'province',
        'postal_code',
        'contact_number',
        'email',
        'profile_picture',
        'profile_picture_disk',
        'profile_picture_original_name',
        'profile_picture_mime_type',
        'profile_picture_uploaded_at',
        'verification_status',
        'valid_id_type',
        'valid_id_front',
        'valid_id_front_disk',
        'valid_id_front_original_name',
        'valid_id_front_mime_type',
        'valid_id_front_uploaded_at',
        'valid_id_back',
        'valid_id_back_disk',
        'valid_id_back_original_name',
        'valid_id_back_mime_type',
        'valid_id_back_uploaded_at',
    ];

    public function getProfilePictureUrlAttribute(): ?string
    {
        return $this->signedFileUrl('profile_picture');
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
            'api.user-file',
            now()->addMinutes(30),
            ['user' => $this->getKey(), 'field' => $field]
        );
    }
}
