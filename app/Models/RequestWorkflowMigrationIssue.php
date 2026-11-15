<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestWorkflowMigrationIssue extends Model
{
    protected $fillable = [
        'request_id',
        'original_status',
        'reason',
    ];

    public function request()
    {
        return $this->belongsTo(
            BarangayRequest::class,
            'request_id',
            'request_id'
        );
    }
}
