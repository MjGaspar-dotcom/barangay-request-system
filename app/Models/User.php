<?php

namespace App\Models;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\BarangayRequest;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Staff;
use App\Models\Admin;

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
    //staff
    public function staff()
    {
        return $this->hasOne(Staff::class, 'user_id', 'user_id');
    }
    //admin
    public function admin()
    {
        return $this->hasOne(Admin::class, 'user_id', 'user_id');
    }



    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory;
    protected $primaryKey = 'user_id';

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'email_verified_at' => 'datetime',
    ];

    protected $fillable = [
        'username',
        'password',
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


