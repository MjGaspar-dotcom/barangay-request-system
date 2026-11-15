<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Request history is recorded in the existing audit_logs table.
    }

    public function down(): void
    {
    }
};