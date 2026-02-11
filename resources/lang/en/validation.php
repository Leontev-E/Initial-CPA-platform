<?php

return [
    'required' => 'The :attribute field is required.',
    'email' => 'The :attribute field must be a valid email address.',
    'min' => [
        'string' => 'The :attribute must be at least :min characters.',
    ],
    'confirmed' => 'The :attribute confirmation does not match.',

    'custom' => [
        'login' => [
            'email' => 'Enter a valid email or start with @ for Telegram.',
        ],
        'password' => [
            'min' => 'Password must be at least 8 characters.',
        ],
    ],

    'attributes' => [
        'login' => 'login',
        'email' => 'email',
        'password' => 'password',
        'name' => 'CPA network name',
        'telegram' => 'telegram',
    ],
];
