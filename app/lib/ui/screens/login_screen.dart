import 'package:flutter/material.dart';
import '../../services/settings_service.dart';
import '../../services/api_service.dart';
import '../theme.dart';
import '../widgets/ctp_header.dart';
import 'home_screen.dart';
import 'qr_scanner_screen.dart';

class LoginScreen extends StatefulWidget {
  final SettingsService settings;

  const LoginScreen({super.key, required this.settings});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _apiKeyController;
  late final TextEditingController _phoneController;
  late final TextEditingController _serverUrlController;

  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _apiKeyController = TextEditingController(text: widget.settings.apiKey);
    _phoneController = TextEditingController(text: widget.settings.sim1PhoneNumber);
    _serverUrlController = TextEditingController(text: widget.settings.serverUrl);
  }

  @override
  void dispose() {
    _apiKeyController.dispose();
    _phoneController.dispose();
    _serverUrlController.dispose();
    super.dispose();
  }

  Future<void> _openQrScanner() async {
    final scannedCode = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => const QrScannerScreen()),
    );

    if (scannedCode != null && scannedCode.isNotEmpty && mounted) {
      setState(() {
        _apiKeyController.text = scannedCode;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('API Key scanned successfully!'),
          backgroundColor: AppTheme.primaryGreen,
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  String? _validatePhone(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Enter an international phone number in the E.164 format';
    }
    final trimmed = value.trim();
    final regex = RegExp(r'^\+[1-9]\d{6,14}$');
    if (!regex.hasMatch(trimmed)) {
      return 'Enter an international phone number in the E.164 format (e.g. +18005550199)';
    }
    return null;
  }

  Future<void> _handleLogin() async {
    setState(() {
      _errorMessage = null;
    });

    if (!_formKey.currentState!.validate()) {
      return;
    }

    final apiKey = _apiKeyController.text.trim();
    final phone = _phoneController.text.trim();
    final enteredServerUrl = _serverUrlController.text.trim();
    final serverUrl = enteredServerUrl.isNotEmpty
        ? enteredServerUrl
        : widget.settings.serverUrl;

    setState(() {
      _isLoading = true;
    });

    // Save inputs
    await widget.settings.setApiKey(apiKey);
    await widget.settings.setSim1PhoneNumber(phone);
    await widget.settings.setServerUrl(serverUrl);

    final api = ApiService(widget.settings);
    final result = await api.loginOrUpdateToken(
      phoneNumber: phone,
      sim: 'SIM1',
      fcmToken: widget.settings.fcmToken,
    );

    if (!mounted) return;

    setState(() {
      _isLoading = false;
    });

    if (result.success) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => HomeScreen(settings: widget.settings),
        ),
      );
    } else {
      setState(() {
        _errorMessage = result.error ?? 'Login failed. Please check your inputs.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const CtpHeader(height: 75),
                      const SizedBox(height: 24),
                      const Text(
                        'Get Your API Key at',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 16,
                          color: AppTheme.textDark,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'ctpsms.com/settings',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 16,
                          color: Color(0xFF2196F3),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 32),

                      // API Key Field
                      TextFormField(
                        controller: _apiKeyController,
                        decoration: InputDecoration(
                          labelText: 'API Key',
                          hintText: 'system-user-api-key',
                          suffixIcon: IconButton(
                            icon: const Icon(Icons.qr_code_scanner, color: AppTheme.primaryGreen),
                            tooltip: 'Scan QR Code',
                            onPressed: _openQrScanner,
                          ),
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'API key cannot be empty';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 18),

                      // Phone Number Field
                      TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                          labelText: 'Phone number (SIM1)',
                          hintText: '+18005550199',
                        ),
                        validator: _validatePhone,
                      ),
                      const SizedBox(height: 18),

                      // Server URL Field (suggestion only, not predefined filled)
                      TextFormField(
                        controller: _serverUrlController,
                        keyboardType: TextInputType.url,
                        decoration: InputDecoration(
                          labelText: 'Server URL',
                          hintText: 'https://ctpsms-production.up.railway.app',
                          helperText: 'Default: https://ctpsms-production.up.railway.app',
                          suffixIcon: _serverUrlController.text.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear, size: 18),
                                  onPressed: () {
                                    setState(() {
                                      _serverUrlController.clear();
                                    });
                                  },
                                )
                              : null,
                        ),
                        onChanged: (_) => setState(() {}),
                        validator: (val) {
                          if (val != null && val.trim().isNotEmpty) {
                            final uri = Uri.tryParse(val.trim());
                            if (uri == null || !uri.hasScheme) {
                              return 'Enter a valid URL (e.g. https://ctpsms-production.up.railway.app)';
                            }
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 8),

                      // Quick Suggestion Chips
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          const Text(
                            'Suggestions:',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.textMuted,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          ActionChip(
                            avatar: const Icon(Icons.usb, size: 14, color: Color(0xFFE91E63)),
                            label: const Text('127.0.0.1:8000', style: TextStyle(fontSize: 12)),
                            backgroundColor: Colors.grey.shade100,
                            side: BorderSide(color: Colors.grey.shade300),
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            onPressed: () {
                              setState(() {
                                _serverUrlController.text = 'http://127.0.0.1:8000';
                              });
                            },
                          ),
                          ActionChip(
                            avatar: const Icon(Icons.wifi, size: 14, color: AppTheme.primaryGreen),
                            label: const Text('192.168.0.145:8000', style: TextStyle(fontSize: 12)),
                            backgroundColor: Colors.grey.shade100,
                            side: BorderSide(color: Colors.grey.shade300),
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            onPressed: () {
                              setState(() {
                                _serverUrlController.text = 'http://192.168.0.145:8000';
                              });
                            },
                          ),
                          ActionChip(
                            avatar: const Icon(Icons.cloud_outlined, size: 14, color: Color(0xFF2196F3)),
                            label: const Text('Railway API', style: TextStyle(fontSize: 12)),
                            backgroundColor: Colors.grey.shade100,
                            side: BorderSide(color: Colors.grey.shade300),
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            onPressed: () {
                              setState(() {
                                _serverUrlController.text = 'https://ctpsms-production.up.railway.app';
                              });
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      if (_errorMessage != null)
                        Container(
                          padding: const EdgeInsets.all(10),
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.red.shade200),
                          ),
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(color: Colors.red, fontSize: 13),
                          ),
                        ),

                      const SizedBox(height: 12),

                      // Login Button
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2196F3),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        onPressed: _isLoading ? null : _handleLogin,
                        icon: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.login),
                        label: Text(
                          _isLoading ? 'Logging in...' : 'Login With API Key',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
      );
  }
}

