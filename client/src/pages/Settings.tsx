import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Server,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../api/client';

export const Settings: React.FC = () => {
  const { user, serverUrl, updateServerUrl, refreshUser } = useAuth();
  const [currentUrl, setCurrentUrl] = useState(serverUrl);
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Dhaka');
  const [notifyStatus, setNotifyStatus] = useState(user?.notificationMessageStatusEnabled ?? true);
  const [notifyHeartbeat, setNotifyHeartbeat] = useState(user?.notificationHeartbeatEnabled ?? true);
  const [notifyWebhook, setNotifyWebhook] = useState(user?.notificationWebhookEnabled ?? true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTestResult('testing');
    try {
      await ApiService.checkHealth(currentUrl);
      setTestResult('ok');
    } catch (e: any) {
      setTestResult('fail');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      if (currentUrl.trim() !== serverUrl) {
        updateServerUrl(currentUrl.trim());
      }

      await ApiService.updateUser({
        timezone,
        notificationMessageStatusEnabled: notifyStatus,
        notificationHeartbeatEnabled: notifyHeartbeat,
        notificationWebhookEnabled: notifyWebhook,
      });

      await refreshUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to update preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500">
          Configure API connection endpoints, notifications, and gateway behavior
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {/* Server Endpoint Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Backend Server Connection</h2>
              <p className="text-xs text-slate-500">The CTP SMS REST API URL that this web portal communicates with</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Server URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentUrl}
                onChange={(e) => {
                  setCurrentUrl(e.target.value);
                  setTestResult(null);
                }}
                className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-ctp-500"
                placeholder="http://127.0.0.1:8000"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                {testResult === 'testing' ? 'Testing...' : 'Test Ping'}
              </button>
            </div>

            {testResult === 'ok' && (
              <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Backend server is online and responding!
              </p>
            )}
            {testResult === 'fail' && (
              <p className="mt-2 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Cannot connect to server endpoint.
              </p>
            )}
          </div>
        </div>

        {/* Timezone Preference */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Timezone Configuration</h2>
              <p className="text-xs text-slate-500">Display message timestamps in your local time</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ctp-500 font-mono"
            >
              <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
              <option value="UTC">UTC (GMT+0)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
              <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
            </select>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Alert Notifications</h2>
              <p className="text-xs text-slate-500">Configure real-time event triggers and notifications</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition">
              <input
                type="checkbox"
                checked={notifyStatus}
                onChange={(e) => setNotifyStatus(e.target.checked)}
                className="w-4 h-4 text-ctp-600 rounded focus:ring-ctp-500"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">Message Delivery Status Alerts</p>
                <p className="text-xs text-slate-500">Receive notifications when an SMS is sent, delivered, or fails</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition">
              <input
                type="checkbox"
                checked={notifyHeartbeat}
                onChange={(e) => setNotifyHeartbeat(e.target.checked)}
                className="w-4 h-4 text-ctp-600 rounded focus:ring-ctp-500"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">Android Heartbeat Disconnect Warning</p>
                <p className="text-xs text-slate-500">Notify if an Android phone stops reporting heartbeats</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition">
              <input
                type="checkbox"
                checked={notifyWebhook}
                onChange={(e) => setNotifyWebhook(e.target.checked)}
                className="w-4 h-4 text-ctp-600 rounded focus:ring-ctp-500"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">Webhook Forwarding Alerts</p>
                <p className="text-xs text-slate-500">Trigger webhook delivery notifications on inbound/outbound SMS</p>
              </div>
            </label>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-ctp-600 hover:bg-ctp-700 active:bg-ctp-800 rounded-xl shadow-md transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

