<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'evgen.leonev@yandex.ru'],
            [
                'name' => 'Super Admin',
                'telegram' => '@super_admin',
                'password' => Hash::make('[REDACTED_PASSWORD]'),
                'role' => User::ROLE_SUPER_ADMIN,
                'partner_program_id' => null,
                'is_active' => true,
            ]
        );
    }
}
