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

Run `php artisan migrate` to create the template, field-mapping, generated PDF
version tables, and request-specific data storage. Install the PDF worker
dependencies in the Python environment used by the Laravel application:

```powershell
python -m pip install -r pdf_worker\requirements.txt
```

Set `PDF_PYTHON_BINARY` to that environment's Python executable when it is not
available as `python`. `DOCUMENT_TEMPLATE_MAX_KB` limits template uploads
(default 20,480 KB), and `DOCUMENT_TEMPLATE_WORKER_TIMEOUT` sets the PDF worker
timeout in seconds (default 120). Use a private local disk for development or a
private S3 bucket in production by configuring `PRIVATE_UPLOAD_DISK` and the
corresponding filesystem credentials.

Administrators upload and manage PDF and DOCX templates from **Document Templates**.
All built-in document designs have been retired. Upload an official PDF or
DOCX for each document type; requests cannot be marked ready for pickup until
an active uploaded template is available. DOCX templates can use tags such as
`{{FULL_NAME}}`, `{{STREET_NAME}}`, `{{PURPOSE}}`, and `{{BARANGAY_NAME}}`; the
system maps these to resident, request, and barangay data and produces a PDF for
preview and pickup. `{{STREET_NAME}}` maps to the resident's separate Street
Name profile field, not the complete address. The mobile profile stores street,
barangay, municipality, province, and optional postal code separately and
builds the resident's complete address from those fields. Every DOCX tag must
be mapped in the template editor.
The system automatically fills AcroForm fields and replaces named
`{{PLACEHOLDER}}` text in non-fillable PDFs; no field-mapping step is needed
when the template uses recognized placeholders. A template with blank areas
but no form fields or named placeholders cannot be reliably mapped
automatically. PDFs are generated as soon as a resident submits a request when
an active template is available, then stored as immutable versions. Residents
can preview their generated PDF immediately, and staff can access it in the
request workflow. If a newer template is uploaded, in-progress requests
generate a new PDF version from the latest active template without overwriting
their earlier PDFs; completed requests keep their issued document. Template and
generated PDF files are served through authenticated, role-protected API routes
rather than public storage URLs.
Install LibreOffice on the application server for DOCX-to-PDF conversion and
set `LIBREOFFICE_BINARY` to its executable when it is not available as
`soffice`. On Windows, the worker also checks standard Program Files install
locations automatically.

The mobile Business Clearance request collects the business name, address, and
nature of business needed by its PDF template. Other template values come from
the resident profile, request, or existing document-generation profile.
Residents with an older submitted request missing those business details can
complete them from **My Requests** to generate its PDF without submitting a
duplicate request.

Official details used by document generation are stored in row `id = 1` of
`document_generation_profiles`. Existing values are preserved by the migration
that renames the former settings table. There is no settings page or API; on a
fresh deployment, provision `barangay_name`, `municipality`, `province`, and
`punong_barangay_name` through a controlled database/deployment process before
issuing documents. Missing required details prevent official document
generation. `office_address`, `contact_information`, `seal_path`, and
`council_roster` are also retained for document output where used.

## Request workflow and mobile setup

Resident requests move through `request_submitted`, `approved`,
`ready_for_pickup`, and `completed`; rejected requests use `rejected` with a
recorded reason. A resident may have only one open request for a document type
at a time. Printing a generated document records print activity but does not
complete the request.

Set `FRONTEND_URL` to the deployed React origin so request receipts link to
`/track-request?tracking_number=...`. The public tracking page reads that
parameter and looks up the request through the API. Generated PDFs are
available to staff and administrators, and to the owning resident as soon as
an uploaded-template PDF has been generated.

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
is not implemented. Uploaded ID front images are scanned locally with
Tesseract to suggest an ID type; administrators must still review the document.
Install Tesseract OCR 5 or newer on the API host and set `TESSERACT_BIN` if it
is not at the platform default. OCR does not determine whether an ID is genuine.
Email OTP is not configured.
