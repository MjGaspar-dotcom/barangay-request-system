import 'package:flutter/material.dart';

import '../../core/providers/request_provider.dart';

class DocumentTypesError extends StatelessWidget {
  const DocumentTypesError({super.key, required this.provider});

  final RequestProvider provider;

  @override
  Widget build(BuildContext context) {
    final message = provider.errorMessage;
    if (provider.documentTypes.isNotEmpty ||
        provider.status != RequestStatus.error ||
        message == null) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Text(
        message,
        style: TextStyle(color: Theme.of(context).colorScheme.error),
      ),
    );
  }
}
