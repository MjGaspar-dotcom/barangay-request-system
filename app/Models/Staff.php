<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
public function verifiedRequests()
{
    return $this->hasMany(Request::class, 'verified_by', 'staff_id');
}
public function notifications()
{
    return $this->hasMany(Notification::class, 'staff_id', 'staff_id');
}
public function auditLogs()
{
    return $this->hasMany(AuditLog::class, 'staff_id', 'staff_id');
}
    /** @use HasFactory<\Database\Factories\StaffFactory> */
    use HasFactory;
}
