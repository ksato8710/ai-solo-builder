import 'package:flutter/material.dart';

import 'src/screens/home_screen.dart';
import 'src/services/content_api_client.dart';

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
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        appBarTheme: const AppBarTheme(
          centerTitle: false,
          surfaceTintColor: Colors.transparent,
        ),
        scaffoldBackgroundColor: const Color(0xFFF7FAFC),
      ),
      home: HomeScreen(apiClient: apiClient),
    );
  }
}
