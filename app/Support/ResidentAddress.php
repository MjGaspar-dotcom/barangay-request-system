<?php

namespace App\Support;

final class ResidentAddress
{
    public const BARANGAY_NAME = 'Barangay Aurora';
    public const MUNICIPALITY = 'Alicia';
    public const PROVINCE = 'Isabela';
    public const POSTAL_CODE = '3306';

    public static function fromStreetName(string $streetName): array
    {
        $streetName = trim($streetName);

        return [
            'street_name' => $streetName,
            'barangay_name' => self::BARANGAY_NAME,
            'municipality' => self::MUNICIPALITY,
            'province' => self::PROVINCE,
            'postal_code' => self::POSTAL_CODE,
            'address' => implode(', ', [
                $streetName,
                self::BARANGAY_NAME,
                self::MUNICIPALITY,
                self::PROVINCE,
                self::POSTAL_CODE,
            ]),
        ];
    }
}