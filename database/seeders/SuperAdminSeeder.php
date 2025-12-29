<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('SEED_SUPER_ADMIN_PASSWORD', env('SEED_DEFAULT_PASSWORD', 'ChangeMe123!'));

        User::updateOrCreate(
            ['email' => 'evgen.leonev@yandex.ru'],
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
