# Barangay Mobile 📱

A production-ready Flutter mobile application for the **Barangay Document Request System**.

## 🚀 Getting Started

### Prerequisites
- Flutter SDK (3.x or later)
- Android Studio / Xcode
- Dart SDK included with Flutter

### Installation

```bash
cd mobile
flutter pub get
flutter run
```

### API Configuration

The Laravel server host and API base URL are configured in
[`lib/utils/utils.dart`](lib/utils/utils.dart):

```dart
const String serverUrl = 'http://172.20.2.180:8000';
const String baseUrl = '$serverUrl/api';
```

Use a host address reachable from the device. For a USB-connected Android
device using ADB reverse forwarding, set `serverUrl` to
`http://127.0.0.1:8000` and run:

```sh
adb reverse tcp:8000 tcp:8000
```

The API host and its generated tracking links must be reachable from the
device. Use HTTPS outside local development; Tesseract runs on the Laravel
server, not on the phone. OCR sends the selected ID image to
`POST /api/ocr/extract`; parsed fields are returned under `data`, including
`data.birth_date`. Install Tesseract with English language data on the Laravel
host and set `TESSERACT_BIN` in its `.env` to the installed executable path
(`OCR_LANG` defaults to `eng`).

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
    │   │   ├── guest_request_screen.dart  # Multipart upload
    │   │   ├── guest_success_screen.dart  # Tracking number display
    │   │   ├── qr_scanner_screen.dart     # Scan a tracking QR code
    │   │   └── track_request_screen.dart  # Status timeline + QR scan
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

### Guest Workflow
- Submit document requests **without an account**
- Upload valid ID photo via image picker (multipart)
- Read the birth date from the selected ID using server-side Tesseract OCR
- Get a **tracking number** immediately on success
- Display a scannable QR code for request tracking
- Copy tracking number to clipboard
- Track status by number or by scanning its QR code

### Resident Workflow
- Register with multi-step stepper form
- Secure JWT token storage (encrypted)
- Dashboard with quick actions and recent requests
- **Verification banner** if ID not yet uploaded
- Simple request form (doc type + purpose only)
- Full request list with status chips
- Notification center with unread badge

### Profile
- View personal info
- Upload profile picture
- Upload Valid ID front + back for verification

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
