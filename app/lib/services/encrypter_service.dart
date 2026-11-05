import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart' as enc;

class EncrypterService {
  static const int ivSize = 16;

  static Uint8List _hashKey(String key) {
    final bytes = utf8.encode(key);
    final digest = sha256.convert(bytes);
    return Uint8List.fromList(digest.bytes);
  }

  static String encrypt(String key, String plainText) {
    final keyBytes = _hashKey(key);
    final keyObj = enc.Key(keyBytes);

    final random = Random.secure();
    final ivBytes = Uint8List(ivSize);
    for (int i = 0; i < ivSize; i++) {
      ivBytes[i] = random.nextInt(256);
    }
    final iv = enc.IV(ivBytes);

    final encrypter = enc.Encrypter(
      enc.AES(keyObj, mode: enc.AESMode.cfb64, padding: null),
    );

    final encrypted = encrypter.encrypt(plainText, iv: iv);
    final combined = Uint8List(ivBytes.length + encrypted.bytes.length);
    combined.setRange(0, ivBytes.length, ivBytes);
    combined.setRange(ivBytes.length, combined.length, encrypted.bytes);

    return base64.encode(combined);
  }

  static String decrypt(String key, String cipherText) {
    final combined = base64.decode(cipherText);
    if (combined.length < ivSize) {
      throw ArgumentError('Ciphertext too short');
    }

    final ivBytes = combined.sublist(0, ivSize);
    final cipherBytes = combined.sublist(ivSize);

    final keyBytes = _hashKey(key);
    final keyObj = enc.Key(keyBytes);
    final iv = enc.IV(ivBytes);

    final encrypter = enc.Encrypter(
      enc.AES(keyObj, mode: enc.AESMode.cfb64, padding: null),
    );

    return encrypter.decrypt(enc.Encrypted(cipherBytes), iv: iv);
  }
}

