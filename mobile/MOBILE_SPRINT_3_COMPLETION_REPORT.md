# BarangayEase Mobile - Sprint 3 Completion Report

**Target completion date:** November 16, 2026  
**Scope:** Flutter mobile application only. No new sprint was created, and no
Web application, backend, Agile plan, or Kanban board files were changed.

## Completed mobile work

- Aligned request and tracking models/providers with the inspected API fields,
  including `request_id`, `request_submitted`, server-provided QR SVG,
  timestamps, and rejection details.
- Added request-history actions for tracking, receipts, and generated
  documents; made request errors visible and retryable.
- Displayed the QR receipt returned by the API after successful submission and
  connected scanned tracking numbers to the public tracking API.
- Added a status timeline for the backend's observed request lifecycle and
  rejection states without inventing timestamps for unobserved transitions.
- Added generated-document metadata and file retrieval, PDF preview, and
  platform share/save actions. When the API has no PDF, the screen shows
  available server fields rather than mock content.
- Documented the API behavior and Android debug-only cleartext configuration.
- Added tests for API model mapping, QR receipt display, and timeline states.

## Files changed or created

- `README.md`
- `MOBILE_SPRINT_3_COMPLETION_REPORT.md` (this report)
- `android/app/src/debug/AndroidManifest.xml`
- `lib/core/models/generated_document.dart`
- `lib/core/models/request_model.dart`
- `lib/core/providers/request_provider.dart`
- `lib/core/services/api_service.dart`
- `lib/ui/screens/guest/track_request_screen.dart`
- `lib/ui/screens/requests/create_request_screen.dart`
- `lib/ui/screens/requests/generated_document_screen.dart`
- `lib/ui/screens/requests/my_requests_screen.dart`
- `lib/ui/widgets/qr_receipt_dialog.dart` (new)
- `lib/ui/widgets/status_chip.dart`
- `pubspec.yaml`, `pubspec.lock`
- `test/document_type_test.dart`
- `test/generated_document_test.dart`
- `test/request_tracking_test.dart` (new)
- `test/available_documents_section_test.dart` (removed; it was empty and
  caused test discovery to fail)
- Flutter-generated desktop plugin registrants updated for the added
  dependencies.

## Bugs addressed

- Request IDs and receipt/tracking fields did not fully match the inspected
  backend response.
- Tracking IDs were not safely URL-encoded and public tracking details were
  incomplete.
- Request history did not provide the complete receipt/tracking/document
  actions or adequately visible retry errors.
- Generated-document retrieval and PDF preview/share were incomplete.
- An empty test file without a `main()` prevented the baseline test suite from
  running.
- Android debug builds needed local HTTP access for emulator API testing;
  cleartext access is limited to debug builds.

## Verification

- `flutter test` — **passed, 40 tests**.
- `flutter analyze --no-fatal-infos` — **passed**, with 26 info-level lint
  notices. Standard `flutter analyze` remains nonzero because of these
  info-level notices, which were present in the baseline.
- Live public API checks — `/api/document-types` returned HTTP 200; an
  intentionally nonexistent public tracking number returned the expected
  HTTP 404 response.
- `git diff --check` — passed; only line-ending conversion warnings were
  reported.
- `flutter build apk --debug` — **passed**; generated
  `build/app/outputs/flutter-apk/app-debug.apk`.

### Requested flow coverage

| Flow | Evidence | End-to-end status |
|---|---|---|
| Login and registration | Widget tests cover form rendering, required details, password length, and narrow-screen layout. | Not tested against a live resident account. |
| Resident profile | Profile/model behavior remains covered by local tests. | Live profile load/update not verified. |
| ID verification and image persistence | Tests cover API profile image path resolution. | Upload, backend verification, and persistence across sessions not verified. |
| Request submission and duplicate prevention | API response/validation mapping has unit coverage. | Authenticated submission and backend duplicate rejection not verified. |
| Status updates and history | Backend status parsing and lifecycle/rejection timeline have tests. | No real resident request was available to verify a live status change. |
| QR receipt and tracking | Receipt rendering and tracking response parsing have tests; public tracking endpoint was checked with an unknown number. | No QR from a real submitted request or successful tracking lookup was available. |
| Generated documents | Metadata parsing and API retrieval flow are implemented. | Protected PDF retrieval/preview/share requires a qualifying authenticated request and was not verified. |
| Notifications | Existing notification model/UI tests pass. | Live push or backend notification delivery was not verified. |
| Age-based recommendations | Age boundaries and recommendation behavior are covered by tests. | Passed locally; no live catalog/account integration scenario was run. |
| API configuration/connectivity | Public document catalog returned HTTP 200; emulator override is documented. | Authenticated API paths and production URL remain unverified. |

## Verification limits and blockers

- Authenticated login/registration, Google OAuth, profile/ID image upload
  persistence, request submission, duplicate rejection, generated PDF access,
  and real resident notifications were not verified end-to-end. They require
  configured credentials/OAuth and resident/request data on the intended
  backend.
- QR receipt creation/display and tracking integration are implemented against
  the inspected API contract, but a real authenticated request lifecycle was
  not available for verification.
- Tests cover recommendation rules and profile image URL mapping, not live
  backend persistence.
- The sibling backend inspected for this work is Laravel, while the task
  described a Flask backend. Confirm which backend is intended for the final
  demonstration.
- The Agile workbook has an empty Sprint 3 section. Existing Sprint 4/5
  headings were left unchanged, no tasks were marked complete, and no plan or
  board edits were made.

## Agile/Kanban disposition

- The Agile plan contains no Sprint 3 task rows to close.
- Existing Kanban topics relevant to this mobile scope include mobile
  verification, QR receipts/public tracking, and backend ID verification /
  duplicate prevention. Mobile-side implementation and local tests are
  complete where described above; externally dependent flows remain
  unverified.
- No Kanban item was marked complete because authenticated and backend
  end-to-end verification is still outstanding. No Sprint 4 or Sprint 5 was
  created.

## Web/backend integration status

Mobile request submission, statuses, QR receipts, tracking, and generated
documents use the existing API client and inspected backend routes. Public
catalog/tracking connectivity was checked, but authenticated workflows and
consistency with the separately developed Web application were not proven.
Web/backend integration must therefore remain **unverified**, not complete.
