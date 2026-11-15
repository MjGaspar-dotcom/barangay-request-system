# barangay-request-system
A barangay document request system to lessen the hassle on getting barangay documents such as indigency

## Community recommendations

Run `php artisan migrate` to create the recommendations catalog. Admins can add
official programs, government assistance, services, announcements, and
activities from **Programs & Recommendations** in the admin portal. The catalog
starts empty; there are no seeded sample entries.

The authenticated `GET /api/recommendations` feed filters by date, age range,
gender, civil status, and verification requirements, then prioritizes government
assistance. Residents with a missing or under-13 age receive general entries
only. Eligibility notes are informational; supported profile filters are
enforced automatically.

## PDF document templates

Run `php artisan migrate` to create the template, field-mapping, and generated
PDF version tables. Install the PDF worker dependencies in the Python
environment used by the Laravel application:

```powershell
python -m pip install -r pdf_worker\requirements.txt
```

Set `PDF_PYTHON_BINARY` to that environment's Python executable when it is not
available as `python`. `DOCUMENT_TEMPLATE_MAX_KB` limits template uploads
(default 20,480 KB), and `DOCUMENT_TEMPLATE_WORKER_TIMEOUT` sets the PDF worker
timeout in seconds (default 120). Use a private local disk for development or a
private S3 bucket in production by configuring `PRIVATE_UPLOAD_DISK` and the
corresponding filesystem credentials.

Administrators upload templates and map PDF fields from **Document Templates**.
Staff generate and preview PDFs from the request workflow; regenerated PDFs are
stored as immutable versions and can be previewed or reprinted from version
history. Template and generated PDF files are served through authenticated,
role-protected API routes rather than public storage URLs.

Official details used by document generation are stored in row `id = 1` of
`document_generation_profiles`. Existing values are preserved by the migration
that renames the former settings table. There is no settings page or API; on a
fresh deployment, provision `barangay_name`, `municipality`, `province`, and
`punong_barangay_name` through a controlled database/deployment process before
issuing documents. Missing required details prevent official document
generation. `office_address`, `contact_information`, `seal_path`, and
`council_roster` are also retained for document output where used.

Template uploads currently support PDF files only. DOCX uploads are rejected by
the PDF template processor.

## Request workflow and mobile setup

Resident requests move through `request_submitted`, `approved`,
`ready_for_pickup`, and `completed`; rejected requests use `rejected` with a
recorded reason. A resident may have only one open request for a document type
at a time. Printing a generated document records print activity but does not
complete the request.

Set `FRONTEND_URL` to the deployed React origin so request receipts link to
`/track-request?tracking_number=...`. The public tracking page reads that
parameter and looks up the request through the API. Generated PDFs are
available to staff and administrators, and to the owning resident only when
the request is ready for pickup or completed.

For mobile builds, install packages from `mobile` and configure the API URL
with Flutter's `--dart-define`:

```powershell
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=https://your-api.example/api
```

Configure `GOOGLE_WEB_CLIENT_ID` as a Flutter define when Google sign-in is
enabled. The mobile app can show a QR receipt after submission, read QR images
from the gallery, and preview available generated PDFs. Live camera scanning
is not implemented. OCR parsing is not connected to resident ID verification,
and email OTP is not configured.
