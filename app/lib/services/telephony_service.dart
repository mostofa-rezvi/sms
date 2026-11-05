import 'package:flutter/services.dart';
import '../constants.dart';

class TelephonyService {
  static const MethodChannel _channel = MethodChannel(Constants.channelTelephony);

  // Check if battery optimization is disabled
  static Future<bool> isBatteryOptimizationIgnored() async {
    try {
      final bool? result = await _channel.invokeMethod<bool>('isBatteryOptimizationIgnored');
      return result ?? false;
    } catch (_) {
      return false;
    }
  }

  // Request disabling battery optimization
  static Future<bool> requestIgnoreBatteryOptimizations() async {
    try {
      final bool? result = await _channel.invokeMethod<bool>('requestIgnoreBatteryOptimizations');
      return result ?? false;
    } catch (_) {
      return false;
    }
  }

  // Send an SMS
  static Future<bool> sendSms({
    required String address,
    required String message,
    String sim = Constants.sim1,
  }) async {
    try {
      final bool? result = await _channel.invokeMethod<bool>('sendSms', {
        'address': address,
        'message': message,
        'sim': sim,
      });
      return result ?? false;
    } catch (_) {
      return false;
    }
  }

  // Get detected SIM info
  static Future<List<Map<String, dynamic>>> getSimCards() async {
    try {
      final List<dynamic>? result = await _channel.invokeMethod<List<dynamic>>('getSimCards');
      if (result != null) {
        return result.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }
}

