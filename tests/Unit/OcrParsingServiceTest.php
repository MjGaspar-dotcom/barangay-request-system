<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\OcrParsingService;

class OcrParsingServiceTest extends TestCase
{
    public function test_parses_philippine_national_id(): void
    {
        $sampleText = "REPUBLIKA NG PILIPINAS\nPHILIPPINE IDENTIFICATION SYSTEM\nSurname/Apelyido: DELA CRUZ\nGiven Names/Mga Pangalan: JUAN\nMiddle Name: GONZALES\nDOB: 15-08-1995\nSex/Kasarian: M\nPSN: 1234-5678-9012-3456\nAddress: Brgy San Jose Pasig City";

        $result = OcrParsingService::parse($sampleText);

        $this->assertEquals('Philippine National ID (PhilID)', $result['id_type']);
        $this->assertEquals('1234-5678-9012-3456', $result['id_number']);
        $this->assertEquals('JUAN', $result['first_name']);
        $this->assertEquals('DELA CRUZ', $result['last_name']);
        $this->assertEquals('1995-08-15', $result['birth_date']);
        $this->assertEquals('Male', $result['gender']);
        $this->assertGreaterThanOrEqual(80, $result['confidence_score']);
    }

    public function test_parses_drivers_license(): void
    {
        $sampleText = "LAND TRANSPORTATION OFFICE\nDRIVER'S LICENSE\nLicense No: N01-12-345678\nSurname: SANTOS\nFirst Name: MARIA CLARA\nBirth Date: 1998/12/25\nSex: Female";

        $result = OcrParsingService::parse($sampleText);

        $this->assertEquals("Driver's License", $result['id_type']);
        $this->assertEquals('N01-12-345678', $result['id_number']);
        $this->assertEquals('MARIA CLARA', $result['first_name']);
        $this->assertEquals('SANTOS', $result['last_name']);
        $this->assertEquals('1998-12-25', $result['birth_date']);
        $this->assertEquals('Female', $result['gender']);
    }
}
