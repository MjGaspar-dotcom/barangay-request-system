<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
      //valid_id_type to nullable
      //valid_id_front to nullable
      //add verification_status
      Schema::table('users', function (Blueprint $table) {
        $table->string('valid_id_type')->nullable()->change();
        $table->string('valid_id_front')->nullable()->change();
        $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending');
      });   
    
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //reverse those changes
        Schema::table('users', function (Blueprint $table) {
            $table->string('valid_id_type')->nullable(false)->change();
            $table->string('valid_id_front')->nullable(false)->change();
            $table->dropColumn('verification_status');
        });
    }
};
