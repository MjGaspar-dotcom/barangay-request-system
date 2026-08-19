<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\BarangayRequest;
use App\Models\User;
use App\Models\Admin;

class Staff extends Model
{
public function verifiedRequests()
{
    return $this->hasMany(BarangayRequest::class, 'verified_by', 'staff_id');
}
public function notifications()
{
    return $this->hasMany(Notification::class, 'staff_id', 'staff_id');
}
public function auditLogs()
{
    return $this->hasMany(AuditLog::class, 'staff_id', 'staff_id');
}
//admin
public function admin()
{
    return $this->belongsTo(Admin::class, 'assigned_by');
}   
//user
public function user() 
{
    return $this->belongsTo(User::class, 'user_id');
}

    /** @use HasFactory<\Database\Factories\StaffFactory> */
    use HasFactory;
    protected $primaryKey = 'staff_id';
    protected $fillable = [
    'user_id',
    'assigned_by',
];
}
