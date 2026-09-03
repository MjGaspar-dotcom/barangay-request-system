<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $primaryKey = 'notification_id';

    protected $fillable = [
        'type',
        'user_id',
        'staff_id',
        'request_id',
        'guest_request_id',
        'title',
        'message',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

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

    public function guestRequest()
    {
        return $this->belongsTo(GuestRequest::class, 'guest_request_id', 'guest_request_id');
    }
}
