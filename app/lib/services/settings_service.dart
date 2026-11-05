import 'package:shared_preferences/shared_preferences.dart';
import '../constants.dart';

class SettingsService {
  static SettingsService? _instance;
  final SharedPreferences _prefs;

  SettingsService._(this._prefs);

  static Future<SettingsService> getInstance() async {
    if (_instance == null) {
      final prefs = await SharedPreferences.getInstance();
      _instance = SettingsService._(prefs);
    }
    return _instance!;
  }

  // API Key
  String get apiKey => _prefs.getString(Constants.prefApiKey) ?? '';
  Future<bool> setApiKey(String value) =>
      _prefs.setString(Constants.prefApiKey, value.trim());

  // Server URL
  String get serverUrl {
    final url = _prefs.getString(Constants.prefServerUrl);
    if (url == null || url.isEmpty) {
      return Constants.defaultServerUrl;
    }
    return url;
  }
  /// Saved server URL entered by user; empty by default so UI is not pre-filled
  String get savedServerUrl => _prefs.getString(Constants.prefServerUrl) ?? '';

  Future<bool> setServerUrl(String value) =>
      _prefs.setString(Constants.prefServerUrl, value.trim());

  // SIM1 Phone Number
  String get sim1PhoneNumber =>
      _prefs.getString(Constants.prefSim1PhoneNumber) ?? '';
  Future<bool> setSim1PhoneNumber(String value) =>
      _prefs.setString(Constants.prefSim1PhoneNumber, value.trim());

  // SIM2 Phone Number
  String get sim2PhoneNumber =>
      _prefs.getString(Constants.prefSim2PhoneNumber) ?? '';
  Future<bool> setSim2PhoneNumber(String value) =>
      _prefs.setString(Constants.prefSim2PhoneNumber, value.trim());

  // Outgoing Status (Active)
  bool isOutgoingActive(String sim) {
    final key = sim == Constants.sim2
        ? Constants.prefSim2Active
        : Constants.prefSim1Active;
    return _prefs.getBool(key) ?? true;
  }
  Future<bool> setOutgoingActive(String sim, bool active) {
    final key = sim == Constants.sim2
        ? Constants.prefSim2Active
        : Constants.prefSim1Active;
    return _prefs.setBool(key, active);
  }

  // Incoming Message Status
  bool isIncomingActive(String sim) {
    final key = sim == Constants.sim2
        ? Constants.prefSim2IncomingActive
        : Constants.prefSim1IncomingActive;
    return _prefs.getBool(key) ?? true;
  }
  Future<bool> setIncomingActive(String sim, bool active) {
    final key = sim == Constants.sim2
        ? Constants.prefSim2IncomingActive
        : Constants.prefSim1IncomingActive;
    return _prefs.setBool(key, active);
  }

  // Missed Call Events
  bool isMissedCallActive(String sim) {
    final key = sim == Constants.sim2
        ? Constants.prefSim2IncomingCallActive
        : Constants.prefSim1IncomingCallActive;
    return _prefs.getBool(key) ?? false;
  }
  Future<bool> setMissedCallActive(String sim, bool active) {
    final key = sim == Constants.sim2
        ? Constants.prefSim2IncomingCallActive
        : Constants.prefSim1IncomingCallActive;
    return _prefs.setBool(key, active);
  }

  // Encryption Key
  String get encryptionKey =>
      _prefs.getString(Constants.prefEncryptionKey) ?? '';
  Future<bool> setEncryptionKey(String value) =>
      _prefs.setString(Constants.prefEncryptionKey, value.trim());

  // Encrypt Received Messages
  bool get encryptReceivedMessages =>
      _prefs.getBool(Constants.prefEncryptReceived) ?? false;
  Future<bool> setEncryptReceivedMessages(bool value) =>
      _prefs.setBool(Constants.prefEncryptReceived, value);

  // Debug Log
  bool get debugLogEnabled =>
      _prefs.getBool(Constants.prefDebugLogEnabled) ?? false;
  Future<bool> setDebugLogEnabled(bool value) =>
      _prefs.setBool(Constants.prefDebugLogEnabled, value);

  // User ID
  String get userId => _prefs.getString(Constants.prefUserId) ?? '';
  Future<bool> setUserId(String value) =>
      _prefs.setString(Constants.prefUserId, value);

  // FCM Token
  String get fcmToken => _prefs.getString(Constants.prefFcmToken) ?? '';
  Future<bool> setFcmToken(String value) =>
      _prefs.setString(Constants.prefFcmToken, value);

  // Heartbeat Timestamp
  int get heartbeatTimestamp =>
      _prefs.getInt(Constants.prefHeartbeatTimestamp) ?? 0;
  Future<bool> setHeartbeatTimestamp(int value) =>
      _prefs.setInt(Constants.prefHeartbeatTimestamp, value);

  // Auth State
  bool get isLoggedIn => apiKey.isNotEmpty && sim1PhoneNumber.isNotEmpty;
  bool get isDualSim => sim1PhoneNumber.isNotEmpty && sim2PhoneNumber.isNotEmpty;

  // Clear / Logout
  Future<void> logout() async {
    await _prefs.remove(Constants.prefApiKey);
    await _prefs.remove(Constants.prefUserId);
    await _prefs.remove(Constants.prefSim1PhoneNumber);
    await _prefs.remove(Constants.prefSim2PhoneNumber);
  }
}

