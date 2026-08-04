<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
 public function staff()
{
    return $this->belongsTo(Staff::class, 'staff_id', 'staff_id');
}
}
