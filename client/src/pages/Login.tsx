import React, { useState } from 'react';
import {
  Radio,
  KeyRound,
  Server,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../api/client';

export const Login: React.FC = () => {
  const { login, serverUrl, updateServerUrl } = useAuth();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(serverUrl);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverPingStatus, setServerPingStatus] = useState<'idle' | 'testing' | 'online' | 'offline'>('idle');

  const handleTestServer = async () => {
    setServerPingStatus('testing');
    try {
      await ApiService.checkHealth(customServerUrl);
      setServerPingStatus('online');
    } catch (e) {
      setServerPingStatus('offline');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      setErrorMessage('Please enter your CTP SMS API Key');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Save server url first if modified
    if (customServerUrl.trim() !== serverUrl) {
      updateServerUrl(customServerUrl.trim());
    }

    const res = await login(apiKeyInput.trim());
    if (!res.success) {
      setErrorMessage(res.error || 'Login failed. Please verify your API Key and server connection.');
    }
    setIsSubmitting(false);
  };

  const fillSystemKey = () => {
    setApiKeyInput('system-user-api-key');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-ctp-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-ctp-600 to-emerald-400 text-white shadow-xl shadow-ctp-600/30 mb-4">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            CTP <span className="text-ctp-400">SMS Gateway</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Turn your Android phone into an SMS Dispatch & Receiving Server
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* API Key Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  API Key
                </label>
                <button
                  type="button"
                  onClick={fillSystemKey}
                  className="text-xs text-ctp-400 hover:text-ctp-300 transition font-medium"
                >
                  Use system-user-api-key
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="Paste your system-user-api-key"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-900/90 border border-slate-700 rounded-2xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ctp-500 focus:border-transparent transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Server URL Config Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowServerConfig(!showServerConfig)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
              >
                <Server className="w-3.5 h-3.5" />
                <span>{showServerConfig ? 'Hide Server Configuration' : 'Configure Server Endpoint'}</span>
              </button>

              {showServerConfig && (
                <div className="mt-3 p-3.5 bg-slate-900/60 rounded-2xl border border-slate-700/60 space-y-2 animate-fade-in">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Backend Server URL</span>
                    <button
                      type="button"
                      onClick={handleTestServer}
                      className="text-ctp-400 hover:text-ctp-300 font-medium"
                    >
                      {serverPingStatus === 'testing' ? 'Testing...' : 'Test Ping'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={customServerUrl}
                    onChange={(e) => {
                      setCustomServerUrl(e.target.value);
                      setServerPingStatus('idle');
                    }}
                    placeholder="http://127.0.0.1:8000"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-ctp-500"
                  />
                  {serverPingStatus === 'online' && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Server is reachable and online!</span>
                    </div>
                  )}
                  {serverPingStatus === 'offline' && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Cannot connect to {customServerUrl}. Ensure server is running.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-ctp-600 hover:bg-ctp-500 active:bg-ctp-700 text-white rounded-2xl font-semibold shadow-lg shadow-ctp-600/30 transition disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Gateway'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Android Mobile App Sync Info */}
          <div className="mt-6 pt-6 border-t border-slate-700/60">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/50 border border-slate-700/40">
              <div className="p-2 rounded-xl bg-slate-800 text-ctp-400 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-300">
                <p className="font-semibold text-white">Connecting your Android Phone?</p>
                <p className="text-slate-400 mt-0.5">
                  Install the CTP SMS Flutter app on your phone, scan your API Key QR code in Settings, and start routing SMS immediately.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Creative Tech Park SMS Gateway &copy; 2026
        </p>
      </div>
    </div>
  );
};

