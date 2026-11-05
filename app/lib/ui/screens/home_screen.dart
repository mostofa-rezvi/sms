import 'package:flutter/material.dart';
import 'package:battery_plus/battery_plus.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../services/settings_service.dart';
import '../../services/api_service.dart';
import '../../services/telephony_service.dart';
import '../theme.dart';
import '../widgets/ctp_header.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  final SettingsService settings;

  const HomeScreen({super.key, required this.settings});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isBatteryOptimizationIgnored = false;
  bool _isSmsPermissionGranted = false;
  bool _isSendingHeartbeat = false;
  final Battery _battery = Battery();

  @override
  void initState() {
    super.initState();
    _checkStatus();
  }

  Future<void> _checkStatus() async {
    await _checkBatteryOptimization();
    await _checkSmsPermission();
  }

  Future<void> _checkBatteryOptimization() async {
    final ignored = await TelephonyService.isBatteryOptimizationIgnored();
    if (mounted) {
      setState(() {
        _isBatteryOptimizationIgnored = ignored;
      });
    }
  }

  Future<void> _checkSmsPermission() async {
    final status = await Permission.sms.status;
    if (mounted) {
      setState(() {
        _isSmsPermissionGranted = status.isGranted;
      });
    }
  }

  Future<void> _handleSmsPermission() async {
    final status = await Permission.sms.request();
    if (status.isPermanentlyDenied) {
      await openAppSettings();
    }
    await _checkSmsPermission();
  }

  Future<void> _handleBatteryOptimization() async {
    await TelephonyService.requestIgnoreBatteryOptimizations();
    await Future.delayed(const Duration(seconds: 1));
    await _checkBatteryOptimization();
  }

  Future<void> _handleSendHeartbeat() async {
    setState(() {
      _isSendingHeartbeat = true;
    });

    bool isCharging = false;
    try {
      final state = await _battery.batteryState;
      isCharging = (state == BatteryState.charging || state == BatteryState.full);
    } catch (_) {}

    final phoneNumbers = <String>[];
    if (widget.settings.sim1PhoneNumber.isNotEmpty) {
      phoneNumbers.add(widget.settings.sim1PhoneNumber);
    }
    if (widget.settings.isDualSim && widget.settings.sim2PhoneNumber.isNotEmpty) {
      phoneNumbers.add(widget.settings.sim2PhoneNumber);
    }

    final api = ApiService(widget.settings);
    final success = await api.sendHeartbeat(
      phoneNumbers: phoneNumbers,
      isCharging: isCharging,
    );

    if (!mounted) return;

    setState(() {
      _isSendingHeartbeat = false;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success
              ? 'Heartbeat sent successfully to server!'
              : 'Failed to send heartbeat. Check server connectivity.',
        ),
        backgroundColor: success ? AppTheme.primaryGreen : Colors.red,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final sim1 = widget.settings.sim1PhoneNumber;
    final sim2 = widget.settings.sim2PhoneNumber;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            children: [
              const SizedBox(height: 16),
              const CtpHeader(height: 70),
              const SizedBox(height: 28),

              // SIM 1 Status Card
              _buildSimCard(
                simLabel: 'SIM 1',
                number: sim1.isNotEmpty ? sim1 : 'No phone number set',
                isActive: sim1.isNotEmpty,
              ),

              // SIM 2 Status Card (if available)
              if (sim2.isNotEmpty) ...[
                const SizedBox(height: 12),
                _buildSimCard(
                  simLabel: 'SIM 2',
                  number: sim2,
                  isActive: true,
                ),
              ],

              const SizedBox(height: 28),

              // Enable SMS Permission Button (if not granted)
              if (!_isSmsPermissionGranted) ...[
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4CAF50),
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(52),
                  ),
                  onPressed: _handleSmsPermission,
                  icon: const Icon(Icons.sms),
                  label: const Text(
                    'Enable SMS Permission',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Disable Battery Optimization Button
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isBatteryOptimizationIgnored
                      ? const Color(0xFF43A047)
                      : AppTheme.accentPink,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(52),
                ),
                onPressed: _handleBatteryOptimization,
                icon: Icon(
                  _isBatteryOptimizationIgnored
                      ? Icons.battery_charging_full
                      : Icons.battery_alert,
                ),
                label: Text(
                  _isBatteryOptimizationIgnored
                      ? 'Battery Optimization Disabled'
                      : 'Disable Battery Optimization',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),

              const SizedBox(height: 16),

              // Send Heartbeat Button
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2196F3),
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(52),
                ),
                onPressed: _isSendingHeartbeat ? null : _handleSendHeartbeat,
                icon: _isSendingHeartbeat
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.favorite),
                label: Text(
                  _isSendingHeartbeat ? 'Sending Heartbeat...' : 'Send Heartbeat',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),

              const Spacer(),

              // Footer version
              const Text(
                'ctpsms.com - v1.0.0',
                style: TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 13,
                ),
              ),

              const SizedBox(height: 16),

              // App Settings Button
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.darkButton,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(200, 48),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                ),
                onPressed: () async {
                  await Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => SettingsScreen(settings: widget.settings),
                    ),
                  );
                  if (mounted) setState(() {});
                },
                icon: const Icon(Icons.settings, size: 20),
                label: const Text(
                  'App Settings',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSimCard({
    required String simLabel,
    required String number,
    required bool isActive,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFE8EEF5),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                number,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textDark,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '$simLabel • Active',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppTheme.textMuted,
                ),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.all(4),
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_circle,
              color: Color(0xFF4CAF50),
              size: 26,
            ),
          ),
        ],
      ),
    );
  }
}
