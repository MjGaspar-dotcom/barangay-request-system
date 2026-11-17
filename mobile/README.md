# Barangay Mobile 📱

A production-ready Flutter mobile application for the **Barangay Document Request System**.

## 🚀 Getting Started

### Prerequisites
- Flutter SDK (3.x or later)
- Android Studio / Xcode
- Dart SDK included with Flutter

### Installation

```bash
cd barangay_mobile
flutter pub get
flutter run
```

### API Configuration

Set `API_BASE_URL` at build/run time when the default (`127.0.0.1`) is not
reachable from the target:

| Environment         | URL                         |
|--------------------|-----------------------------|
| Android Emulator   | `http://10.0.2.2:8000/api`  |
| iOS Simulator      | `http://localhost:8000/api`  |
| Real Device (WiFi) | `http://<your-lan-ip>:8000/api` |

For example, add
`--dart-define="API_BASE_URL=http://10.0.2.2:8000/api"` to the Flutter run
command when testing on the Android emulator.
Android debug builds permit cleartext traffic for local HTTP API testing; use
HTTPS for release deployments.

### Google Sign-In setup

Google sign-in requires a Google OAuth **Web application** client ID and backend
configuration. Do not put a client secret in the Flutter app.

1. In Google Cloud Console, configure the OAuth consent screen and create a
   **Web application** OAuth client ID. While the consent screen is in testing
   mode, add the Google accounts you will use as test users.
2. Add the exact local web origin as an authorized JavaScript origin. For local
   Edge testing, use `http://localhost:65110` and start Flutter on that fixed
   port.
3. Add the Web client ID to the Laravel API's `.env`:

   ```dotenv
   GOOGLE_CLIENT_IDS=your-web-client-id.apps.googleusercontent.com
   CORS_ALLOWED_ORIGINS=http://localhost:65110,http://127.0.0.1:65110
   ```

   Clear Laravel's cached configuration and start the API from the backend
   project directory:

   ```powershell
   cd ..\barangay-request-system
   php artisan config:clear
   php artisan serve --host=0.0.0.0 --port=8000
   ```

4. Run the Flutter app with the same Web client ID:

   ```powershell
   flutter run -d edge --web-port=65110 --dart-define="GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com"
   ```

   Use `-d chrome` instead of `-d edge` if preferred.
5. The first Google sign-up asks for resident details that Google does not
   provide (birth date, gender, civil status, address, and contact number).

For Android, create an additional **Android** OAuth client using the app's
package name (`com.example.barangay_mobile`) and the signing certificate SHA-1.
Get the debug SHA-1 with `.\gradlew signingReport` from the `android` directory.
Keep the Web client ID as `GOOGLE_WEB_CLIENT_ID`; the Android client is
registered in Google Cloud against the package and SHA-1. Set
`GOOGLE_CLIENT_IDS` to the Web client ID for web testing. For Android, include
both IDs there, comma-separated (Web client first, Android client second), so
the API accepts Google's authorized-party claim as well as the Web audience.
When using the Android emulator, set the API URL to
`http://10.0.2.2:8000/api` with `--dart-define="API_BASE_URL=http://10.0.2.2:8000/api"`.

---

## 🗂 Project Structure

```
lib/
├── main.dart                       # App entry + theme + providers
├── core/
│   ├── models/
│   │   ├── user_model.dart         # AppUser
│   │   ├── request_model.dart      # DocumentType, BarangayRequest, TrackResult
│   │   └── notification_model.dart # AppNotification
│   ├── services/
│   │   ├── api_service.dart        # Centralized Dio API client + interceptor
│   │   └── storage_service.dart    # Secure token storage + SharedPreferences
│   └── providers/
│       ├── auth_provider.dart      # Auth state machine
│       ├── request_provider.dart   # Requests + tracking
│       └── notification_provider.dart
└── ui/
    ├── screens/
    │   ├── splash_screen.dart      # Auto session restore
    │   ├── landing_screen.dart     # Onboarding + pathway selection
    │   ├── auth/
    │   │   ├── login_screen.dart
    │   │   └── register_screen.dart  # Multi-step stepper form
    │   ├── home/
    │   │   └── home_screen.dart    # Dashboard + bottom nav
    │   ├── requests/
    │   │   ├── my_requests_screen.dart
    │   │   └── create_request_screen.dart
    │   ├── guest/
    │   │   └── track_request_screen.dart  # Status timeline
    │   ├── notifications/
    │   │   └── notifications_screen.dart
    │   └── profile/
    │       └── profile_screen.dart  # ID upload + profile picture
    └── widgets/
        ├── app_text_field.dart
        ├── loading_button.dart
        └── status_chip.dart
```

---

## ✨ Features

### Request Tracking
- Track request status using a tracking number
- View the request status timeline, decision date, and rejection details
- Display the QR SVG returned with the request; it links to the backend-configured public tracker
- Download/share the QR receipt image from its visible receipt button (SVG format)
- Scan a receipt QR image to look up its tracking number through the public tracking API

### Resident Workflow
- Register with multi-step stepper form
- Secure JWT token storage (encrypted)
- Dashboard with quick actions and recent requests
- Personalized **For You** feed from the authenticated recommendations API; age-group and profile eligibility are checked against the admin-managed catalog
- Active document types from the backend catalog appear in **For You** and can be selected directly when starting a request
- **Verification banner** if ID not yet uploaded
- Simple request form (doc type + purpose only)
- Full request list with status chips
- Request history actions for receipt QR, live tracking, and generated documents
- Notification center with unread badge and in-app pickup-ready alerts while the app is open

### Generated Documents
- Load generated document data from the authenticated request API
- Preview server-generated PDFs in the app and use the platform share/save action where available
- Show server-provided document fields when no PDF file is available; no sample document is substituted

### Profile
- View personal info
- Upload profile picture
- Upload Valid ID front + back for verification

The recommendations catalog is maintained in the backend admin portal and is
intentionally empty until official content is entered. If a resident has no
usable date of birth, the feed shows general recommendations only.
Document request choices are synchronized from the backend document-type
catalog. Saved profile pictures and ID images are loaded from the resident
profile after app reload.

---

## 🛡 Security
- Tokens stored with `flutter_secure_storage` (AES-encrypted on Android)
- Auto-clear token on `401 Unauthorized`
- Session restored on app launch via `/api/user`

---

## 🎨 Design System
- **Color**: Rich emerald green `#1A6B4A`  
- **Typography**: Google Fonts — Outfit  
- **Theme**: Material 3 with custom seed color  
- **Components**: Cards, chips, steppers, bottom nav all themed consistently  
