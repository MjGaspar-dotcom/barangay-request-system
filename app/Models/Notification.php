<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
public function user()
{
    return $this->belongsTo(User::class, 'user_id', 'user_id');
}
public function staff()
{
    return $this->belongsTo(Staff::class, 'staff_id', 'staff_id');
}
public function request()
{
    return $this->belongsTo(Request::class, 'request_id', 'request_id');
}
}
