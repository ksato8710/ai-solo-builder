import 'package:flutter/material.dart';

import '../services/content_api_client.dart';
import '../theme/app_colors.dart';
import 'home_screen.dart';
import 'news_list_screen.dart';
import 'products_list_screen.dart';

/// The main shell of the app with bottom navigation.
///
/// Features 3 tabs:
/// - Home: Feed view with all content sections
/// - News: Infinite scroll news list with digests
/// - Products: Grid view of products
class MainShell extends StatefulWidget {
  const MainShell({super.key, required this.apiClient});

  final ContentApiClient apiClient;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  late final List<Widget> _screens;

  void _switchTab(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  void initState() {
    super.initState();
    _screens = [
      HomeScreen(apiClient: widget.apiClient, onNavigateToTab: _switchTab),
      NewsListScreen(apiClient: widget.apiClient),
      ProductsListScreen(apiClient: widget.apiClient),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        backgroundColor: AppColors.background,
        selectedItemColor: AppColors.brandBlue,
        unselectedItemColor: AppColors.textSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedFontSize: 12,
        unselectedFontSize: 12,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'ホーム',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.article_outlined),
            activeIcon: Icon(Icons.article),
            label: 'ニュース',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.apps_outlined),
            activeIcon: Icon(Icons.apps),
            label: 'プロダクト',
          ),
        ],
      ),
    );
  }
}
