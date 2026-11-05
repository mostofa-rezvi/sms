import 'dart:convert';

class ResponsePhone {
  final Phone? data;
  final String message;
  final String status;

  ResponsePhone({
    required this.data,
    required this.message,
    required this.status,
  });

  factory ResponsePhone.fromJson(Map<String, dynamic> json) {
    return ResponsePhone(
      data: json['data'] != null ? Phone.fromJson(json['data']) : null,
      message: json['message'] ?? '',
      status: json['status'] ?? '',
    );
  }
}

class Phone {
  final String id;
  final String userId;

  Phone({
    required this.id,
    required this.userId,
  });

  factory Phone.fromJson(Map<String, dynamic> json) {
    return Phone(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? json['userId'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'user_id': userId,
    'userId': userId,
  };
}

class ResponseMessage {
  final Message? data;
  final String message;
  final String status;

  ResponseMessage({
    required this.data,
    required this.message,
    required this.status,
  });

  factory ResponseMessage.fromJson(Map<String, dynamic> json) {
    return ResponseMessage(
      data: json['data'] != null ? Message.fromJson(json['data']) : null,
      message: json['message'] ?? '',
      status: json['status'] ?? '',
    );
  }
}

class Message {
  final String id;
  final String contact;
  final String content;
  final String sim;
  final String status;
  final String type;
  final bool encrypted;
  final String createdAt;
  final String? sentAt;
  final String? receivedAt;
  final String? failureReason;
  final List<String>? attachments;

  Message({
    required this.id,
    required this.contact,
    required this.content,
    required this.sim,
    required this.status,
    required this.type,
    required this.encrypted,
    required this.createdAt,
    this.sentAt,
    this.receivedAt,
    this.failureReason,
    this.attachments,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'] ?? '',
      contact: json['contact'] ?? '',
      content: json['content'] ?? '',
      sim: json['sim'] ?? 'SIM1',
      status: json['status'] ?? '',
      type: json['type'] ?? '',
      encrypted: json['encrypted'] ?? false,
      createdAt: json['created_at'] ?? json['createdAt'] ?? '',
      sentAt: json['sent_at'] ?? json['sentAt'],
      receivedAt: json['received_at'] ?? json['receivedAt'],
      failureReason: json['failure_reason'] ?? json['failureReason'],
      attachments: json['attachments'] != null
          ? List<String>.from(json['attachments'])
          : null,
    );
  }
}

class ReceivedMessageRequest {
  final String sim;
  final String from;
  final String to;
  final String content;
  final bool encrypted;
  final String timestamp;

  ReceivedMessageRequest({
    required this.sim,
    required this.from,
    required this.to,
    required this.content,
    required this.encrypted,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
    'sim': sim,
    'from': from,
    'to': to,
    'content': content,
    'encrypted': encrypted,
    'timestamp': timestamp,
  };

  String toJsonString() => jsonEncode(toJson());
}

