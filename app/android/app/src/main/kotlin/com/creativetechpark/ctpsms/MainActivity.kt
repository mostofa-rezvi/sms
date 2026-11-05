package com.creativetechpark.ctpsms

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.telephony.SmsManager
import android.telephony.SubscriptionManager
import androidx.annotation.NonNull
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.creativetechpark.ctpsms/telephony"

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        createNotificationChannel()

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "isBatteryOptimizationIgnored" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
                        result.success(powerManager.isIgnoringBatteryOptimizations(packageName))
                    } else {
                        result.success(true)
                    }
                }
                "requestIgnoreBatteryOptimizations" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        try {
                            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                                data = Uri.parse("package:$packageName")
                            }
                            startActivity(intent)
                            result.success(true)
                        } catch (e: Exception) {
                            try {
                                val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                                startActivity(intent)
                                result.success(true)
                            } catch (e2: Exception) {
                                result.success(false)
                            }
                        }
                    } else {
                        result.success(true)
                    }
                }
                "sendSms" -> {
                    val address = call.argument<String>("address")
                    val message = call.argument<String>("message")
                    val simSlot = call.argument<String>("sim") ?: "SIM1"

                    if (address.isNullOrBlank() || message.isNullOrBlank()) {
                        result.error("INVALID_ARGS", "Address and message are required", null)
                        return@setMethodCallHandler
                    }

                    if (ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
                        result.error("NO_PERMISSION", "SEND_SMS permission not granted. Please allow SMS permission in App Info.", null)
                        return@setMethodCallHandler
                    }

                    try {
                        val baseSmsManager = if (Build.VERSION.SDK_INT >= 31) {
                            getSystemService(SmsManager::class.java)
                        } else {
                            @Suppress("DEPRECATION")
                            SmsManager.getDefault()
                        }

                        var targetSmsManager = baseSmsManager
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1 &&
                            ContextCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                            try {
                                val subManager = if (Build.VERSION.SDK_INT >= 31) {
                                    getSystemService(SubscriptionManager::class.java)
                                } else {
                                    @Suppress("DEPRECATION")
                                    SubscriptionManager.from(this)
                                }
                                val subList = subManager.activeSubscriptionInfoList
                                if (subList != null && subList.isNotEmpty()) {
                                    val slotIndex = if (simSlot.equals("SIM2", ignoreCase = true)) 1 else 0
                                    val targetSub = subList.firstOrNull { it.simSlotIndex == slotIndex } ?: subList.first()
                                    targetSmsManager = if (Build.VERSION.SDK_INT >= 31) {
                                        baseSmsManager.createForSubscriptionId(targetSub.subscriptionId)
                                    } else {
                                        @Suppress("DEPRECATION")
                                        SmsManager.getSmsManagerForSubscriptionId(targetSub.subscriptionId)
                                    }
                                }
                            } catch (e: Exception) {
                                // fallback to baseSmsManager
                            }
                        }

                        val parts = targetSmsManager.divideMessage(message)
                        if (parts.size > 1) {
                            targetSmsManager.sendMultipartTextMessage(address, null, parts, null, null)
                        } else {
                            targetSmsManager.sendTextMessage(address, null, message, null, null)
                        }
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("SEND_FAILED", e.localizedMessage, null)
                    }
                }
                "getSimCards" -> {
                    val list = mutableListOf<Map<String, Any>>()
                    if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                        try {
                            val subManager = if (Build.VERSION.SDK_INT >= 31) {
                                getSystemService(SubscriptionManager::class.java)
                            } else {
                                @Suppress("DEPRECATION")
                                SubscriptionManager.from(this)
                            }
                            val subList = subManager.activeSubscriptionInfoList
                            subList?.forEachIndexed { index, info ->
                                list.add(mapOf(
                                    "simSlot" to info.simSlotIndex,
                                    "carrierName" to (info.carrierName?.toString() ?: ""),
                                    "displayName" to (info.displayName?.toString() ?: ""),
                                    "number" to (if (Build.VERSION.SDK_INT >= 33) "" else (info.number ?: ""))
                                ))
                            }
                        } catch (e: Exception) {
                            // ignore
                        }
                    }
                    result.success(list)
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "ctpsms Service"
            val descriptionText = "Notifications for ctpsms service"
            val importance = android.app.NotificationManager.IMPORTANCE_DEFAULT
            val channel = android.app.NotificationChannel("com.creativetechpark.ctpsms.default", name, importance).apply {
                description = descriptionText
            }
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
}
