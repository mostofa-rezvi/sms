import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import '../models/models.dart';
import 'settings_service.dart';

class ApiResult<T> {
  final T? data;
  final String? error;
  final bool success;

  ApiResult.ok(this.data) : error = null, success = true;
  ApiResult.fail(this.error) : data = null, success = false;
}

class ApiService {
  final SettingsService settings;
  final http.Client _client = http.Client();

  ApiService(this.settings);

  String _cleanUrl(String base, String path) {
    var b = base.trim();
    if (b.endsWith('/')) {
      b = b.substring(0, b.length - 1);
    }
    if (!path.startsWith('/')) {
      path = '/$path';
    }
    return '$b$path';
  }

  Map<String, String> _headers() {
    return {
      'x-api-key': settings.apiKey,
      'X-Client-Version': '1.0.0',
      'Content-Type': 'application/json; charset=utf-8',
    };
  }

  static String currentIsoTimestamp() {
    final now = DateTime.now().toUtc();
    final formatter = DateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'000000'Z");
    return formatter.format(now);
  }

  // PUT /v1/phones/fcm-token
  Future<ApiResult<Phone>> loginOrUpdateToken({
    required String phoneNumber,
    required String sim,
    required String fcmToken,
  }) async {
    try {
      final url = Uri.parse(_cleanUrl(settings.serverUrl, '/v1/phones/fcm-token'));
      final body = jsonEncode({
        'fcm_token': fcmToken,
        'phone_number': phoneNumber,
        'sim': sim,
      });

      final response = await _client.put(
        url,
        headers: _headers(),
        body: body,
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        final resp = ResponsePhone.fromJson(decoded);
        if (resp.data != null) {
          await settings.setUserId(resp.data!.userId);
          return ApiResult.ok(resp.data);
        }
        return ApiResult.fail('Invalid server response format');
      } else if (response.statusCode == 401) {
        return ApiResult.fail('Invalid API Key. Please verify your key in Settings.');
      } else {
        return ApiResult.fail(
          'Failed to login (${response.statusCode}): Make sure your phone number is in international E.164 format (e.g. +18005550199)',
        );
      }
    } catch (e) {
      return ApiResult.fail('Connection failed: ${e.toString()}');
    }
  }

  // POST /v1/heartbeats
  Future<bool> sendHeartbeat({
    required List<String> phoneNumbers,
    required bool isCharging,
  }) async {
    try {
      final url = Uri.parse(_cleanUrl(settings.serverUrl, '/v1/heartbeats'));
      final body = jsonEncode({
        'charging': isCharging,
        'phone_numbers': phoneNumbers,
      });

      final response = await _client.post(
        url,
        headers: _headers(),
        body: body,
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        await settings.setHeartbeatTimestamp(DateTime.now().millisecondsSinceEpoch);
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  // POST /v1/messages/receive
  Future<bool> reportReceivedMessage(ReceivedMessageRequest request) async {
    try {
      final url = Uri.parse(_cleanUrl(settings.serverUrl, '/v1/messages/receive'));
      final response = await _client.post(
        url,
        headers: _headers(),
        body: request.toJsonString(),
      ).timeout(const Duration(seconds: 15));

      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  // POST /v1/messages/{id}/events
  Future<bool> reportMessageEvent({
    required String messageId,
    required String eventName, // "SENT", "DELIVERED", "FAILED"
    required String timestamp,
    String? reason,
  }) async {
    try {
      final url = Uri.parse(_cleanUrl(settings.serverUrl, '/v1/messages/$messageId/events'));
      final body = jsonEncode({
        'event_name': eventName,
        'reason': reason,
        'timestamp': timestamp,
      });

      final response = await _client.post(
        url,
        headers: _headers(),
        body: body,
      ).timeout(const Duration(seconds: 15));

      return response.statusCode == 200 || response.statusCode == 404;
    } catch (_) {
      return false;
    }
  }

  // GET /v1/messages/outstanding?message_id={id}
  Future<Message?> getOutstandingMessage(String messageId) async {
    try {
      final url = Uri.parse(
        _cleanUrl(settings.serverUrl, '/v1/messages/outstanding?message_id=$messageId'),
      );
      final response = await _client.get(
        url,
        headers: _headers(),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        final resp = ResponseMessage.fromJson(decoded);
        return resp.data;
      }
      return null;
    } catch (_) {
      return null;
    }
  }
}

