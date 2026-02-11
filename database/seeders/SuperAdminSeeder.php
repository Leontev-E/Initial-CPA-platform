<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('SEED_SUPER_ADMIN_EMAIL', 'owner@platform.test');
        $password = env('SEED_SUPER_ADMIN_PASSWORD', env('SEED_DEFAULT_PASSWORD', 'ChangeMe123!'));

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Super Admin',
                'telegram' => '@super_admin',
                'password' => Hash::make($password),
                'role' => User::ROLE_SUPER_ADMIN,
                'partner_program_id' => null,
                'is_active' => true,
            ]
        );
    }
}
