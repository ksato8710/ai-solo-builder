import 'package:flutter/material.dart';

import 'src/screens/main_shell.dart';
import 'src/services/content_api_client.dart';
import 'src/theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  final apiClient = ContentApiClient();
  runApp(AiSoloBuilderApp(apiClient: apiClient));
}

class AiSoloBuilderApp extends StatelessWidget {
  const AiSoloBuilderApp({super.key, required this.apiClient});

  final ContentApiClient apiClient;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI Solo Builder',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: MainShell(apiClient: apiClient),
    );
  }
}
