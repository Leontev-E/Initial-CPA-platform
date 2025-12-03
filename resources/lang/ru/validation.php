<?php

return [
    'required' => 'Поле :attribute обязательно для заполнения.',
    'email' => 'Поле :attribute должно быть корректным email.',
    'min' => [
        'string' => 'Минимальная длина поля :attribute — :min символов.',
    ],
    'confirmed' => 'Подтверждение для :attribute не совпадает.',

    'custom' => [
        'login' => [
            'email' => 'Укажите корректный email или начните с @ для Telegram.',
        ],
        'password' => [
            'min' => 'Минимальная длина пароля 8 символов.',
        ],
    ],

    'attributes' => [
        'login' => 'логин',
        'email' => 'email',
        'password' => 'пароль',
        'name' => 'название CPA сети',
        'telegram' => 'telegram',
    ],
];
