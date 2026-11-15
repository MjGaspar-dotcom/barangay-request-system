<?php

namespace App\Services;

use App\Models\BarangayRequest;
use App\Models\BarangaySettings;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DocumentGenerationService
{
    public const TEMPLATE_VERSION = '1.0';

    private const TEMPLATE_REGISTRY = [
        'barangay clearance' => 'barangay_clearance',
        'certificate of residency' => 'certificate_of_residency',
        'certificate of indigency' => 'certificate_of_indigency',
        'barangay business clearance' => 'barangay_business_clearance',
        'certificate of first-time job seeker' => 'certificate_of_first_time_job_seeker',
        'certificate of good moral character' => 'certificate_of_good_moral_character',
        'certificate of low income' => 'certificate_of_low_income',
        'certificate of no income' => 'certificate_of_no_income',
        'certificate of unemployment' => 'certificate_of_unemployment',
        'certificate of actual residency' => 'certificate_of_actual_residency',
        'certificate of solo parent' => 'certificate_of_solo_parent',
        'certificate of family composition' => 'certificate_of_family_composition',
        'certificate of appearance' => 'certificate_of_appearance',
        'certificate of blotter' => 'certificate_of_blotter',
        'certificate of no pending complaint' => 'certificate_of_no_pending_complaint',
    ];

    public function generateForReadyPickup(
        BarangayRequest $request,
        ?CarbonImmutable $issuedAt = null
    ): BarangayRequest {
        return DB::transaction(function () use ($request, $issuedAt): BarangayRequest {
            $request = BarangayRequest::query()
                ->with(['user', 'documentType'])
                ->lockForUpdate()
                ->findOrFail($request->request_id);

            if (!in_array($request->status, [
                RequestStatusService::STATUS_APPROVED,
                RequestStatusService::STATUS_READY_FOR_PICKUP,
            ], true)) {
                throw new \InvalidArgumentException(
                    'A generated document can only be created for an approved request.'
                );
            }

            if ($request->document_number && $request->generated_document_data) {
                return $request;
            }
            if ($request->document_number || $request->generated_document_data) {
                throw new \InvalidArgumentException(
                    'The saved generated-document record is incomplete and requires administrator review.'
                );
            }

            $issuedAt ??= CarbonImmutable::now('Asia/Manila');
            $template = $this->templateFor($request->documentType?->document_name);

            $settings = BarangaySettings::query()->find(1);
            $resident = $request->user;
            $this->validateSourceData($request, $resident, $settings, $template, $issuedAt);

            $sequenceId = DB::table('barangay_document_number_sequences')
                ->insertGetId([
                    'created_at' => $issuedAt,
                    'updated_at' => $issuedAt,
                ], 'sequence_id');
            $documentNumber = sprintf(
                'BA-%s-%06d',
                $issuedAt->format('Y'),
                $sequenceId
            );

            $fullName = implode(' ', array_filter([
                $resident->first_name,
                $resident->middle_name,
                $resident->last_name,
            ], static fn ($part): bool => is_string($part) && trim($part) !== ''));
            $birthDate = CarbonImmutable::parse($resident->birth_date);
            $generatedAt = $issuedAt;
            $barangay = [
                'barangay_name' => $settings->barangay_name,
                'municipality' => $settings->municipality,
                'province' => $settings->province,
                'punong_barangay_name' => $settings->punong_barangay_name,
                'seal_path' => $settings->seal_path,
                'office_address' => $settings->office_address,
                'contact_information' => $settings->contact_information,
                'council_roster' => $settings->council_roster ?? [],
            ];
            $documentData = [
                'template_identifier' => $template,
                'template_version' => self::TEMPLATE_VERSION,
                'template_description' => $request->documentType->description,
                'document_number' => $documentNumber,
                'tracking_number' => $request->tracking_number,
                'document_type' => $request->documentType->document_name,
                'issued_at' => $generatedAt->toISOString(),
                'issued_on' => $generatedAt->toDateString(),
                'resident' => [
                    'full_name' => $fullName,
                    'birth_date' => $birthDate->toDateString(),
                    'age' => (int) $birthDate->diffInYears($generatedAt),
                    'civil_status' => $resident->civil_status,
                    'address' => $resident->address,
                ],
                'request' => [
                    'purpose' => trim($request->purpose),
                ],
                'barangay' => $barangay,
                'official_receipt_information' => null,
            ];

            $request->update([
                'document_number' => $documentNumber,
                'generated_document_data' => $documentData,
                'document_template_identifier' => $template,
                'document_template_version' => self::TEMPLATE_VERSION,
                'document_generated_at' => $generatedAt->utc(),
                'document_generated_by' => Auth::id(),
            ]);

            AuditService::log(
                'document_generated',
                $request,
                "Generated {$request->documentType->document_name} {$documentNumber}.",
                [],
                [
                    'document_number' => $documentNumber,
                    'template_identifier' => $template,
                    'template_version' => self::TEMPLATE_VERSION,
                    'document_generated_by' => Auth::id(),
                    'document_generated_at' => $generatedAt->toISOString(),
                ]
            );

            return $request->fresh();
        });
    }

    public function getGeneratedData(BarangayRequest $request): array
    {
        if (
            !in_array($request->status, [
                RequestStatusService::STATUS_READY_FOR_PICKUP,
                RequestStatusService::STATUS_COMPLETED,
            ], true) ||
            !$request->document_number ||
            !$request->generated_document_data
        ) {
            throw new \InvalidArgumentException(
                'A generated document is not available for this request.'
            );
        }

        return $request->generated_document_data;
    }

    public function getTemplatePreviewData(BarangayRequest $request): array
    {
        if (
            $request->document_number &&
            $request->generated_document_data &&
            in_array($request->status, [
                RequestStatusService::STATUS_READY_FOR_PICKUP,
                RequestStatusService::STATUS_COMPLETED,
            ], true)
        ) {
            return $this->getGeneratedData($request);
        }

        $request->loadMissing(['user', 'documentType']);
        $template = $this->templateFor($request->documentType?->document_name);
        $resident = $request->user;
        $settings = BarangaySettings::query()->find(1);
        $issuedAt = CarbonImmutable::now('Asia/Manila');
        $birthDate = $resident?->birth_date
            ? CarbonImmutable::parse($resident->birth_date)
            : null;
        $fullName = implode(' ', array_filter([
            $resident?->first_name,
            $resident?->middle_name,
            $resident?->last_name,
        ], static fn ($part): bool => is_string($part) && trim($part) !== ''));

        return [
            'template_identifier' => $template,
            'template_version' => self::TEMPLATE_VERSION,
            'template_description' => $request->documentType?->description,
            'document_number' => 'To be assigned',
            'is_preview' => true,
            'tracking_number' => $request->tracking_number,
            'document_type' => $request->documentType?->document_name,
            'issued_at' => $issuedAt->toISOString(),
            'issued_on' => $issuedAt->toDateString(),
            'resident' => [
                'full_name' => $fullName ?: 'Not recorded',
                'birth_date' => $birthDate?->toDateString(),
                'age' => $birthDate
                    ? (int) $birthDate->diffInYears($issuedAt)
                    : 'Not recorded',
                'civil_status' => $resident?->civil_status ?: 'Not recorded',
                'address' => $resident?->address ?: 'Not recorded',
            ],
            'request' => [
                'purpose' => trim($request->purpose) ?: 'Not recorded',
            ],
            'barangay' => [
                'barangay_name' => $settings?->barangay_name ?: 'Not configured',
                'municipality' => $settings?->municipality ?: 'Not configured',
                'province' => $settings?->province ?: 'Not configured',
                'punong_barangay_name' => $settings?->punong_barangay_name ?: 'Not configured',
                'seal_path' => $settings?->seal_path,
                'office_address' => $settings?->office_address,
                'contact_information' => $settings?->contact_information,
                'council_roster' => $settings?->council_roster ?? [],
            ],
            'official_receipt_information' => null,
        ];
    }

    private function templateFor(?string $documentName): string
    {
        $key = strtolower(trim($documentName ?? ''));
        if ($key === '') {
            throw new \InvalidArgumentException(
                'This request does not have a document type configured.'
            );
        }

        return self::TEMPLATE_REGISTRY[$key] ?? 'custom_barangay_document';
    }

    private function validateSourceData(
        BarangayRequest $request,
        mixed $resident,
        ?BarangaySettings $settings,
        string $template,
        CarbonImmutable $issuedAt
    ): void {
        if (!$resident || $resident->verification_status !== 'verified') {
            throw new \InvalidArgumentException(
                'The resident account must be verified before generating an official document.'
            );
        }

        $missing = [];
        foreach ([
            'first_name' => 'resident first name',
            'last_name' => 'resident last name',
            'civil_status' => 'resident civil status',
            'address' => 'resident address',
        ] as $field => $label) {
            if (!is_string($resident->{$field}) || trim($resident->{$field}) === '') {
                $missing[] = $label;
            }
        }
        if (!$resident->birth_date) {
            $missing[] = 'resident date of birth';
        }
        if (!is_string($request->purpose) || trim($request->purpose) === '') {
            $missing[] = 'request purpose';
        }
        if (!$settings) {
            $missing[] = 'barangay settings';
        } else {
            foreach ([
                'barangay_name' => 'barangay name',
                'municipality' => 'municipality or city',
                'province' => 'province',
                'punong_barangay_name' => 'Punong Barangay name',
            ] as $field => $label) {
                if (!is_string($settings->{$field}) || trim($settings->{$field}) === '') {
                    $missing[] = $label;
                }
            }
        }
        if ($missing) {
            throw new \InvalidArgumentException(
                'Complete the following information before generating the document: '
                .implode(', ', $missing).'.'
            );
        }

        $birthDate = CarbonImmutable::parse($resident->birth_date);
        if ($birthDate->greaterThan($issuedAt)) {
            throw new \InvalidArgumentException(
                'The resident date of birth cannot be after the document issue date.'
            );
        }

    }
}
