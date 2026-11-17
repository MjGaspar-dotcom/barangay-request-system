<?php

namespace App\Services;

use App\Models\BarangayRequest;
use App\Models\DocumentGenerationProfile;
use Carbon\CarbonImmutable;

class DocumentTemplateDataFieldService
{
    public function catalog(): array
    {
        return [
            [
                'group' => 'Resident Information',
                'fields' => [
                    ['key' => 'resident.first_name', 'label' => 'First Name'],
                    ['key' => 'resident.middle_name', 'label' => 'Middle Name'],
                    ['key' => 'resident.last_name', 'label' => 'Last Name'],
                    ['key' => 'resident.full_name', 'label' => 'Full Name'],
                    ['key' => 'resident.age', 'label' => 'Age'],
                    ['key' => 'resident.birth_date', 'label' => 'Birth Date'],
                    ['key' => 'resident.sex', 'label' => 'Sex'],
                    ['key' => 'resident.civil_status', 'label' => 'Civil Status'],
                    ['key' => 'resident.contact_number', 'label' => 'Contact Number'],
                    ['key' => 'resident.address', 'label' => 'Complete Address'],
                    ['key' => 'resident.street_name', 'label' => 'Street Name'],
                    ['key' => 'resident.resident_id', 'label' => 'Resident ID'],
                ],
            ],
            [
                'group' => 'Request Information',
                'fields' => [
                    ['key' => 'request.document_type', 'label' => 'Document Type'],
                    ['key' => 'request.purpose', 'label' => 'Request Purpose'],
                    ['key' => 'request.request_date', 'label' => 'Request Date'],
                    ['key' => 'request.approval_date', 'label' => 'Approval Date'],
                    ['key' => 'request.issuance_date', 'label' => 'Issuance Date'],
                    ['key' => 'request.control_number', 'label' => 'Control Number'],
                    ['key' => 'request.reference_number', 'label' => 'Reference Number'],
                    ['key' => 'request.remarks', 'label' => 'Remarks'],
                    ['key' => 'request.business_name', 'label' => 'Business Name'],
                    ['key' => 'request.business_address', 'label' => 'Business Address'],
                    ['key' => 'request.business_activity', 'label' => 'Business Activity'],
                    ['key' => 'request.number_of_children', 'label' => 'Number of Children'],
                ],
            ],
            [
                'group' => 'Barangay Information',
                'fields' => [
                    ['key' => 'barangay.name', 'label' => 'Barangay Name'],
                    ['key' => 'barangay.municipality', 'label' => 'Municipality'],
                    ['key' => 'barangay.province', 'label' => 'Province'],
                    ['key' => 'barangay.address', 'label' => 'Barangay Address'],
                    ['key' => 'barangay.captain', 'label' => 'Barangay Captain'],
                    ['key' => 'barangay.secretary', 'label' => 'Barangay Secretary'],
                ],
            ],
        ];
    }

    public function values(
        BarangayRequest $request,
        string $documentNumber,
        CarbonImmutable $issuedAt
    ): array {
        $request->loadMissing(['user', 'documentType']);
        $resident = $request->user;
        $profile = DocumentGenerationProfile::query()->find(1);
        $birthDate = $resident?->birth_date
            ? CarbonImmutable::parse($resident->birth_date)
            : null;
        $requestDate = $request->created_at
            ? CarbonImmutable::parse($request->created_at)
            : null;
        $approvalDate = $request->approved_at
            ? CarbonImmutable::parse($request->approved_at)
            : null;
        $councilRoster = $profile?->council_roster ?? [];
        $secretary = collect($councilRoster)->first(
            fn ($member): bool =>
                is_array($member) &&
                str_contains(strtolower((string) ($member['position'] ?? '')), 'secretary')
        );

        return [
            'resident.first_name' => $resident?->first_name,
            'resident.middle_name' => $resident?->middle_name,
            'resident.last_name' => $resident?->last_name,
            'resident.full_name' => $this->fullName($resident),
            'resident.age' => $birthDate
                ? (string) floor($birthDate->diffInYears($issuedAt))
                : null,
            'resident.birth_date' => $birthDate?->toDateString(),
            'resident.sex' => $resident?->gender,
            'resident.civil_status' => $resident?->civil_status,
            'resident.contact_number' => $resident?->contact_number,
            'resident.address' => $resident?->address,
            'resident.street_name' => $resident?->street_name,
            'resident.resident_id' => $resident
                ? (string) $resident->user_id
                : null,
            'request.document_type' => $request->documentType?->document_name,
            'request.purpose' => $request->purpose,
            'request.request_date' => $requestDate?->toDateString(),
            'request.approval_date' => $approvalDate?->toDateString(),
            'request.issuance_date' => $issuedAt->toDateString(),
            'request.control_number' => $documentNumber,
            'request.reference_number' => $request->tracking_number,
            'request.remarks' => $request->remarks,
            'request.business_name' => $request->request_data['business_name'] ?? null,
            'request.business_address' => $request->request_data['business_address'] ?? null,
            'request.business_activity' => $request->request_data['business_activity'] ?? null,
            'request.number_of_children' =>
                $request->request_data['number_of_children'] ?? null,
            'barangay.name' => $profile?->barangay_name,
            'barangay.municipality' => $profile?->municipality,
            'barangay.province' => $profile?->province,
            'barangay.address' => $profile?->office_address,
            'barangay.captain' => $profile?->punong_barangay_name,
            'barangay.secretary' => is_array($secretary)
                ? ($secretary['name'] ?? null)
                : null,
        ];
    }

    public function fieldKeys(): array
    {
        return collect($this->catalog())
            ->flatMap(fn (array $group): array => $group['fields'])
            ->pluck('key')
            ->all();
    }

    private function fullName(mixed $resident): ?string
    {
        if (!$resident) {
            return null;
        }

        $name = implode(' ', array_filter([
            $resident->first_name,
            $resident->middle_name,
            $resident->last_name,
        ], static fn ($part): bool => is_string($part) && trim($part) !== ''));

        return $name !== '' ? $name : null;
    }

}
