import 'package:flutter/material.dart';

class CtpHeader extends StatelessWidget {
  final double width;
  final double height;

  const CtpHeader({
    super.key,
    this.width = 220,
    this.height = 70,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Image.asset(
        'assets/images/ctp_logo.png',
        width: width,
        height: height,
        fit: BoxFit.contain,
        errorBuilder: (context, error, stackTrace) {
          return Column(
            children: const [
              Icon(Icons.cloud, size: 64, color: Color(0xFF56A347)),
              Text(
                'ctpsms',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF56A347),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

