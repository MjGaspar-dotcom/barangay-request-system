<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\BarangayRequest;

class User extends Model

{

    public function requests(){
    return $this->hasMany(BarangayRequest::class,'user_id','user_id');
    
}
    public function notifications(){
        return $this->hasMany(Notification::class, 'user_id', 'user_id');
    }    

    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory;
    protected $primaryKey = 'user_id';
}


