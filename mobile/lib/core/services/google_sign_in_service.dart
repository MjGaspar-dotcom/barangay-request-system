import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

class GoogleSignInService {
  static const _webClientId = String.fromEnvironment('GOOGLE_WEB_CLIENT_ID');

  late final GoogleSignIn _googleSignIn = GoogleSignIn(
    clientId: kIsWeb ? _webClientId : null,
    serverClientId: kIsWeb ? null : _webClientId,
    scopes: const ['email'],
  );

  Future<String?> signInAndGetIdToken() async {
    if (_webClientId.isEmpty) {
      throw StateError(
        'Google sign-in is not configured. Run with '
        '--dart-define=GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.',
      );
    }

    final account = await _googleSignIn.signIn();
    if (account == null) return null;

    final idToken = (await account.authentication).idToken;
    if (idToken == null || idToken.isEmpty) {
      throw StateError(
        'Google did not return an ID token. Check the OAuth client setup.',
      );
    }
    return idToken;
  }
}
