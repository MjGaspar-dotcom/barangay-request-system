<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{

    public function requests(){
    return $this->hasMany(Request::class,'user_id','user_id');
}
    public function notifications(){
        return $this->hasMany(Notification::class, 'user_id', 'user_id');
    }    

    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory;
}


