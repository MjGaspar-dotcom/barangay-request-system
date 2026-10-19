<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\BarangayRequest;

class Notification extends Model
{
    protected $primaryKey = 'notification_id';

    protected $guarded = [];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

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
        return $this->belongsTo(BarangayRequest::class, 'request_id', 'request_id');
    }
}
