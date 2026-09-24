<?php

namespace App\Services;

class OcrParsingService
{
    /**
     * Parse raw OCR text extracted from an ID card or document.
     */
    public static function parse(string $rawText): array
    {
        $cleanText = self::normalizeText($rawText);

        $idType = self::detectIdType($cleanText);
        $idNumber = self::extractIdNumber($cleanText, $idType);
        $nameData = self::extractName($cleanText);
        $birthDate = self::extractBirthDate($cleanText);
        $gender = self::extractGender($cleanText);
        $address = self::extractAddress($cleanText);

        $confidenceScore = self::calculateConfidence([
            'id_type' => $idType,
            'id_number' => $idNumber,
            'first_name' => $nameData['first_name'],
            'last_name' => $nameData['last_name'],
            'birth_date' => $birthDate,
        ]);

        return [
            'id_type' => $idType,
            'id_number' => $idNumber,
            'full_name' => $nameData['full_name'],
            'first_name' => $nameData['first_name'],
            'middle_name' => $nameData['middle_name'],
            'last_name' => $nameData['last_name'],
            'birth_date' => $birthDate,
            'gender' => $gender,
            'address' => $address,
            'confidence_score' => $confidenceScore,
            'raw_text' => $rawText,
        ];
    }

    /**
     * Normalize OCR text for pattern matching.
     */
    protected static function normalizeText(string $text): string
    {
        // Fix common OCR typos in labels
        $text = preg_replace('/\b0OB\b/i', 'DOB', $text);
        $text = preg_replace('/\bD\.O\.B\b/i', 'DOB', $text);
        $text = preg_replace('/\bKasah an\b/i', 'Kasarian', $text);
        return $text;
    }

    /**
     * Detect Philippine ID type from keywords.
     */
    protected static function detectIdType(string $text): string
    {
        if (preg_match('/(philid|philippine identification|republika ng pilipinas|psys|philsys)/i', $text)) {
            return 'Philippine National ID (PhilID)';
        }

        if (preg_match('/(driver|\blto\b|land transportation office|license)/i', $text)) {
            return "Driver's License";
        }

        if (preg_match('/(umid|unified multi|sss|gsis)/i', $text)) {
            return 'Unified Multi-Purpose ID (UMID)';
        }

        if (preg_match('/(voter|comelec|commission on elections)/i', $text)) {
            return "Voter's ID";
        }

        if (preg_match('/(barangay|punong barangay|resident card)/i', $text)) {
            return 'Barangay ID';
        }

        if (preg_match('/(passport|dfa|foreign affairs)/i', $text)) {
            return 'Passport';
        }

        if (preg_match('/(tin|taxpayer|bureau of internal revenue|bir)/i', $text)) {
            return 'TIN ID';
        }

        if (preg_match('/(postal|phlpost|philippine postal)/i', $text)) {
            return 'Postal ID';
        }

        return 'Government / Valid ID';
    }

    /**
     * Extract ID Number using pattern matching.
     */
    protected static function extractIdNumber(string $text, string $idType): ?string
    {
        // PhilID / PSN (16 digits or 12 digits: XXXX-XXXX-XXXX-XXXX)
        if (preg_match('/\b(\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4}[-\s]?\d{4})\b/', $text, $matches)) {
            return str_replace(' ', '-', trim($matches[1]));
        }

        // Driver's License format (e.g. N01-12-345678 or A02-34-567890)
        if (preg_match('/\b([A-Z]\d{2}[-\s]?\d{2}[-\s]?\d{6})\b/i', $text, $matches)) {
            return strtoupper(trim($matches[1]));
        }

        // UMID / SSS CRN (e.g. 0111-1234567-8 or 34-1234567-8)
        if (preg_match('/\b(\d{4}[-\s]?\d{7}[-\s]?\d|\d{2}[-\s]?\d{7}[-\s]?\d)\b/', $text, $matches)) {
            return trim($matches[1]);
        }

        // Generic ID format (Numbers with dashes length 8-20)
        if (preg_match('/(?:ID|No|Number|CRN|No\.)[:\s]*([A-Z0-9-]{6,20})/i', $text, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }

    /**
     * Extract Name components (Last, First, Middle).
     */
    protected static function extractName(string $text): array
    {
        $lastName = null;
        $firstName = null;
        $middleName = null;

        $lines = explode("\n", $text);
        foreach ($lines as $line) {
            $line = trim($line);

            if (!$lastName && preg_match('/(?:Surname|Apelyido|Last\s*Name).*:[\s]*([A-Z\sñÑ-]+)/i', $line, $matches)) {
                $lastName = trim($matches[1]);
                continue;
            }

            if (!$firstName && preg_match('/(?:Given|Mga\s*Pangalan|First\s*Name).*:[\s]*([A-Z\sñÑ-]+)/i', $line, $matches)) {
                $firstName = trim($matches[1]);
                continue;
            }

            if (!$middleName && preg_match('/(?:Middle\s*Name|Gitnang\s*Apelyido).*:[\s]*([A-Z\sñÑ-]+)/i', $line, $matches)) {
                $middleName = trim($matches[1]);
                continue;
            }
        }

        // Fallback: Full Name pattern (Name: JUAN DELA CRUZ)
        if (!$firstName && !$lastName && preg_match('/(?:Name|Pangalan).*:[\s]*([A-Z\sñÑ,-]+)/i', $text, $matches)) {
            $nameStr = trim(explode("\n", $matches[1])[0]);
            $parts = preg_split('/[\s,]+/', $nameStr);
            if (count($parts) >= 2) {
                $lastName = array_shift($parts);
                $firstName = implode(' ', $parts);
            } else {
                $firstName = $nameStr;
            }
        }

        $fullNameParts = array_filter([$firstName, $middleName, $lastName]);
        $fullName = !empty($fullNameParts) ? implode(' ', $fullNameParts) : null;

        return [
            'first_name' => $firstName,
            'middle_name' => $middleName,
            'last_name' => $lastName,
            'full_name' => $fullName,
        ];
    }

    /**
     * Extract Date of Birth in standardized YYYY-MM-DD format.
     */
    protected static function extractBirthDate(string $text): ?string
    {
        // Match DOB / Date of Birth / Kaarawan / Petsa ng Kapanganakan
        $dobPattern = '/(?:DOB|Date\s*of\s*Birth|Birth\s*Date|Kaarawan|Petsa\s*ng\s*Kapanganakan).*:[\s]*([A-Z0-9\s,\/\.-]{6,20})/i';

        if (preg_match($dobPattern, $text, $matches)) {
            $dateCandidate = trim($matches[1]);
            $parsedDate = self::parseDateString($dateCandidate);
            if ($parsedDate) {
                return $parsedDate;
            }
        }

        // Generic Date pattern (DD-MM-YYYY, YYYY-MM-DD, or Month DD, YYYY)
        if (preg_match('/\b(\d{2}[-\/\.]\d{2}[-\/\.]\d{4}|\d{4}[-\/\.]\d{2}[-\/\.]\d{2})\b/', $text, $matches)) {
            return self::parseDateString($matches[1]);
        }

        return null;
    }

    /**
     * Standardize date string to YYYY-MM-DD.
     */
    protected static function parseDateString(string $dateStr): ?string
    {
        try {
            $time = strtotime($dateStr);
            if ($time && $time > 0) {
                return date('Y-m-d', $time);
            }
        } catch (\Throwable $e) {
            // Ignore parse errors
        }

        return null;
    }

    /**
     * Extract Gender / Sex.
     */
    protected static function extractGender(string $text): ?string
    {
        if (preg_match('/(?:Sex|Gender|Kasarian).*:[\s]*(Male|Female|Lalaki|Babae|M|F)\b/i', $text, $matches)) {
            $val = strtoupper(trim($matches[1]));
            if (in_array($val, ['M', 'MALE', 'LALAKI'])) {
                return 'Male';
            }
            if (in_array($val, ['F', 'FEMALE', 'BABAE'])) {
                return 'Female';
            }
        }

        return null;
    }

    /**
     * Extract Address / Barangay.
     */
    protected static function extractAddress(string $text): ?string
    {
        if (preg_match('/(?:Address|Tirahan).*:[\s]*([^\n\r]+)/i', $text, $matches)) {
            return trim($matches[1]);
        }

        if (preg_match('/(?:Brgy\.?|Barangay)\s+([A-Za-z0-9\s-]+)/i', $text, $matches)) {
            return 'Barangay ' . trim($matches[1]);
        }

        return null;
    }

    /**
     * Calculate confidence score (0-100%).
     */
    protected static function calculateConfidence(array $fields): int
    {
        $score = 0;
        if (!empty($fields['id_type']) && $fields['id_type'] !== 'Government / Valid ID')
            $score += 20;
        if (!empty($fields['id_number']))
            $score += 30;
        if (!empty($fields['first_name']))
            $score += 20;
        if (!empty($fields['last_name']))
            $score += 15;
        if (!empty($fields['birth_date']))
            $score += 15;

        return min(100, $score);
    }
}
