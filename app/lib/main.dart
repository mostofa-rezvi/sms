import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'services/settings_service.dart';
import 'ui/screens/home_screen.dart';
import 'ui/screens/login_screen.dart';
import 'ui/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final settings = await SettingsService.getInstance();

  // Request runtime permissions gracefully on start
  _requestPermissions();

  runApp(CtpSmsApp(settings: settings));
}

Future<void> _requestPermissions() async {
  try {
    await [
      Permission.sms,
      Permission.phone,
      Permission.notification,
    ].request();
  } catch (_) {}
}

class CtpSmsApp extends StatelessWidget {
  final SettingsService settings;

  const CtpSmsApp({super.key, required this.settings});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ctpsms',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: settings.isLoggedIn
          ? HomeScreen(settings: settings)
          : LoginScreen(settings: settings),
    );
  }
}
