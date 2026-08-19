<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Staff;


class Admin extends Model
{
    public function user() 
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function staff() 
    {
        return $this->hasMany(Staff::class, 'assigned_by');
    }

    /** @use HasFactory<\Database\Factories\AdminFactory> */
    use HasFactory;
    protected $primaryKey = 'admin_id';
    protected $fillable = [
        'user_id',
    ];
}
