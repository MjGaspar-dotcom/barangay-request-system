<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
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
    ];

    protected $casts = [
        'birth_date' => 'date',
        'email_verified_at' => 'datetime',
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
        'contact_number',
        'email',
        'verification_status',
        'valid_id_type',
        'valid_id_front',
        'valid_id_back',
    ];
}
