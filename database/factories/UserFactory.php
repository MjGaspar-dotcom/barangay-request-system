<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'username' => fake()->unique()->userName(),
            'password' => static::$password ??= Hash::make('password'),
            'first_name' => fake()->firstName(),
            'middle_name' => fake()->lastName(),
            'last_name' => fake()->lastName(),
            'birth_date' => fake()->date('Y-m-d', '2000-01-01'),
            'gender' => fake()->randomElement(['Male', 'Female']),
            'civil_status' => fake()->randomElement(['Single', 'Married']),
            'address' => fake()->address(),
            'contact_number' => '09123456789',
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'valid_id_type' => 'National ID',
            'valid_id_front' => 'ids/front.jpg',
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn(array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
