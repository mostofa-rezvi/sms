import 'package:flutter/material.dart';
import '../../constants.dart';
import '../../services/settings_service.dart';
import '../theme.dart';
import 'login_screen.dart';

class SettingsScreen extends StatefulWidget {
  final SettingsService settings;

  const SettingsScreen({super.key, required this.settings});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late final TextEditingController _sim1Controller;
  late final TextEditingController _sim2Controller;
  late final TextEditingController _encryptionKeyController;

  late bool _sim1Outgoing;
  late bool _sim1Incoming;
  late bool _sim1MissedCalls;

  late bool _sim2Outgoing;
  late bool _sim2Incoming;
  late bool _sim2MissedCalls;

  late bool _encryptReceived;
  late bool _debugLogs;

  @override
  void initState() {
    super.initState();
    final s = widget.settings;
    _sim1Controller = TextEditingController(text: s.sim1PhoneNumber);
    _sim2Controller = TextEditingController(text: s.sim2PhoneNumber);
    _encryptionKeyController = TextEditingController(text: s.encryptionKey);

    _sim1Outgoing = s.isOutgoingActive(Constants.sim1);
    _sim1Incoming = s.isIncomingActive(Constants.sim1);
    _sim1MissedCalls = s.isMissedCallActive(Constants.sim1);

    _sim2Outgoing = s.isOutgoingActive(Constants.sim2);
    _sim2Incoming = s.isIncomingActive(Constants.sim2);
    _sim2MissedCalls = s.isMissedCallActive(Constants.sim2);

    _encryptReceived = s.encryptReceivedMessages;
    _debugLogs = s.debugLogEnabled;
  }

  @override
  void dispose() {
    _sim1Controller.dispose();
    _sim2Controller.dispose();
    _encryptionKeyController.dispose();
    super.dispose();
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Log Out'),
        content: const Text('Are you sure you want to log out from ctpsms?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Log Out', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await widget.settings.logout();
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (_) => LoginScreen(settings: widget.settings),
        ),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'App Settings',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        children: [
          // SIM 1 Phone Number
          TextField(
            controller: _sim1Controller,
            decoration: const InputDecoration(
              labelText: 'SIM1',
              hintText: '+18005550199',
            ),
            onChanged: (val) => widget.settings.setSim1PhoneNumber(val),
          ),
          const SizedBox(height: 16),

          // SIM1 Switches
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            title: const Text('Enable SIM1 outgoing messages'),
            value: _sim1Outgoing,
            activeThumbColor: const Color(0xFF4A5568),
            onChanged: (val) {
              setState(() => _sim1Outgoing = val);
              widget.settings.setOutgoingActive(Constants.sim1, val);
            },
          ),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            title: const Text('Enable SIM1 incoming messages'),
            value: _sim1Incoming,
            activeThumbColor: const Color(0xFF4A5568),
            onChanged: (val) {
              setState(() => _sim1Incoming = val);
              widget.settings.setIncomingActive(Constants.sim1, val);
            },
          ),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            title: const Text('Enable SIM1 missed call events'),
            value: _sim1MissedCalls,
            activeThumbColor: const Color(0xFF4A5568),
            onChanged: (val) {
              setState(() => _sim1MissedCalls = val);
              widget.settings.setMissedCallActive(Constants.sim1, val);
            },
          ),

          const Divider(height: 32),

          // SIM 2 Phone Number (Optional)
          TextField(
            controller: _sim2Controller,
            decoration: const InputDecoration(
              labelText: 'SIM2 (Optional for Dual SIM)',
              hintText: '+18005550198',
            ),
            onChanged: (val) => widget.settings.setSim2PhoneNumber(val),
          ),
          const SizedBox(height: 16),

          if (_sim2Controller.text.isNotEmpty) ...[
            SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              title: const Text('Enable SIM2 outgoing messages'),
              value: _sim2Outgoing,
              activeThumbColor: const Color(0xFF4A5568),
              onChanged: (val) {
                setState(() => _sim2Outgoing = val);
                widget.settings.setOutgoingActive(Constants.sim2, val);
              },
            ),
            SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              title: const Text('Enable SIM2 incoming messages'),
              value: _sim2Incoming,
              activeThumbColor: const Color(0xFF4A5568),
              onChanged: (val) {
                setState(() => _sim2Incoming = val);
                widget.settings.setIncomingActive(Constants.sim2, val);
              },
            ),
            SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              title: const Text('Enable SIM2 missed call events'),
              value: _sim2MissedCalls,
              activeThumbColor: const Color(0xFF4A5568),
              onChanged: (val) {
                setState(() => _sim2MissedCalls = val);
                widget.settings.setMissedCallActive(Constants.sim2, val);
              },
            ),
            const Divider(height: 32),
          ],

          // Encryption Key
          TextField(
            controller: _encryptionKeyController,
            decoration: const InputDecoration(
              labelText: 'Encryption Key',
              hintText: 'Secret encryption key (optional)',
            ),
            onChanged: (val) => widget.settings.setEncryptionKey(val),
          ),
          const SizedBox(height: 12),

          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            title: const Text('Encrypt received messages'),
            value: _encryptReceived,
            activeThumbColor: const Color(0xFF4A5568),
            onChanged: (val) {
              setState(() => _encryptReceived = val);
              widget.settings.setEncryptReceivedMessages(val);
            },
          ),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            title: const Text('Enable debug logs'),
            value: _debugLogs,
            activeThumbColor: const Color(0xFF4A5568),
            onChanged: (val) {
              setState(() => _debugLogs = val);
              widget.settings.setDebugLogEnabled(val);
            },
          ),

          const SizedBox(height: 36),

          // Log Out Button
          Center(
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.darkButton,
                foregroundColor: Colors.white,
                minimumSize: const Size(200, 48),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
              ),
              onPressed: _handleLogout,
              icon: const Icon(Icons.logout, size: 20),
              label: const Text(
                'Log Out',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
