<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE barangay_requests MODIFY COLUMN status VARCHAR(40) NOT NULL DEFAULT 'request_submitted'"
            );
        }

        Schema::table('barangay_requests', function (Blueprint $table): void {
            $table->string('rejection_reason', 100)->nullable();
            $table->text('rejection_other')->nullable();
            $table->foreignId('decision_by')
                ->nullable()
                ->constrained('users', 'user_id')
                ->nullOnDelete();
            $table->timestamp('decision_at')->nullable();
        });

        Schema::create('request_workflow_migration_issues', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('request_id')
                ->unique()
                ->constrained('barangay_requests', 'request_id')
                ->cascadeOnDelete();
            $table->string('original_status', 100);
            $table->string('reason');
            $table->timestamps();
        });

        DB::table('barangay_requests')
            ->where('status', 'Pending')
            ->update(['status' => 'request_submitted']);
        DB::table('barangay_requests')
            ->where('status', 'Rejected')
            ->update(['status' => 'rejected']);
        DB::table('barangay_requests')
            ->where('status', 'Ready for Pickup')
            ->update(['status' => 'ready_for_pickup']);
        DB::table('barangay_requests')
            ->where('status', 'Completed')
            ->update(['status' => 'completed']);
        DB::table('barangay_requests')
            ->where('status', 'Approved')
            ->update(['status' => 'approved']);

        foreach ([
            'Processing' => 'The old status does not establish whether approval occurred.',
            'Additional Requirements' => 'The old status may be awaiting resident resubmission; its current requirements state is not represented by the new workflow.',
        ] as $status => $reason) {
            DB::table('request_workflow_migration_issues')
                ->insertUsing(
                    ['request_id', 'original_status', 'reason', 'created_at', 'updated_at'],
                    DB::table('barangay_requests')
                        ->selectRaw('request_id, ? as original_status, ? as reason, CURRENT_TIMESTAMP as created_at, CURRENT_TIMESTAMP as updated_at', [$status, $reason])
                        ->where('status', $status)
                );
            DB::table('barangay_requests')
                ->where('status', $status)
                ->update(['status' => 'migration_review']);
        }
    }

    public function down(): void
    {
        foreach (DB::table('request_workflow_migration_issues')->get() as $issue) {
            DB::table('barangay_requests')
                ->where('request_id', $issue->request_id)
                ->update(['status' => $issue->original_status]);
        }

        DB::table('barangay_requests')
            ->where('status', 'request_submitted')
            ->update(['status' => 'Pending']);
        DB::table('barangay_requests')
            ->where('status', 'rejected')
            ->update(['status' => 'Rejected']);
        DB::table('barangay_requests')
            ->where('status', 'ready_for_pickup')
            ->update(['status' => 'Ready for Pickup']);
        DB::table('barangay_requests')
            ->where('status', 'completed')
            ->update(['status' => 'Completed']);
        DB::table('barangay_requests')
            ->where('status', 'approved')
            ->update(['status' => 'Approved']);

        Schema::dropIfExists('request_workflow_migration_issues');
        Schema::table('barangay_requests', function (Blueprint $table): void {
            $table->dropForeign(['decision_by']);
            $table->dropColumn([
                'rejection_reason',
                'rejection_other',
                'decision_by',
                'decision_at',
            ]);
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE barangay_requests MODIFY COLUMN status ENUM('Pending', 'Additional Requirements', 'Approved', 'Rejected', 'Processing', 'Ready for Pickup', 'Completed') NOT NULL DEFAULT 'Pending'"
            );
        }
    }
};
