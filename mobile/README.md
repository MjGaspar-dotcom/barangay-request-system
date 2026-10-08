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

Open `lib/core/services/api_service.dart` and update the `_baseUrl`:

| Environment         | URL                         |
|--------------------|-----------------------------|
| Android Emulator   | `http://10.0.2.2:8000/api`  |
| iOS Simulator      | `http://localhost:8000/api`  |
| Real Device (WiFi) | `http://<your-lan-ip>:8000/api` |

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

### Guest Workflow
- Submit document requests **without an account**
- Upload valid ID photo via image picker (multipart)
- Get a **tracking number** immediately on success
- Copy tracking number to clipboard
- Track status via elegant status timeline card

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
