import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Code,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../api/client';
import { PhoneApiKey } from '../types';

export const ApiKeys: React.FC = () => {
  const { user, apiKey, serverUrl, refreshUser } = useAuth();
  const [showMainKey, setShowMainKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  // Phone API keys
  const [phoneKeys, setPhoneKeys] = useState<PhoneApiKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPhoneKeys = async () => {
    try {
      const res = await ApiService.getPhoneApiKeys();
      if (res.data) setPhoneKeys(res.data);
    } catch (e) {
      console.error('Error fetching phone API keys', e);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  useEffect(() => {
    loadPhoneKeys();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRotateKey = async () => {
    if (
      !confirm(
        'Are you sure you want to rotate your primary API Key? Any connected mobile apps and scripts will need to be updated with the new key.',
      )
    ) {
      return;
    }

    setIsRotating(true);
    try {
      await ApiService.rotateApiKey();
      await refreshUser();
      alert('API Key rotated successfully! Please update your mobile app.');
    } catch (e: any) {
      alert(e.message || 'Failed to rotate API Key');
    } finally {
      setIsRotating(false);
    }
  };

  const handleCreatePhoneKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsSubmitting(true);
    try {
      await ApiService.createPhoneApiKey({ name: newKeyName.trim() });
      setNewKeyName('');
      setIsModalOpen(false);
      loadPhoneKeys();
    } catch (e) {
      console.error('Failed to create scoped key', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePhoneKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this scoped API Key?')) return;
    try {
      await ApiService.deletePhoneApiKey(keyId);
      loadPhoneKeys();
    } catch (e) {
      console.error('Failed to delete scoped key', e);
    }
  };

  const activeKey = user?.apiKey || apiKey;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">API Key Management</h1>
        <p className="text-sm text-slate-500">
          Manage authentication credentials for your mobile devices and REST API integrations
        </p>
      </div>

      {/* Primary System API Key Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Primary System API Key</h2>
              <p className="text-xs text-slate-500">
                Grants full access to dispatch SMS, query threads, and connect Android Gateway apps
              </p>
            </div>
          </div>

          <button
            onClick={handleRotateKey}
            disabled={isRotating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
            <span>Rotate Key</span>
          </button>
        </div>

        {/* API Key Box */}
        <div className="mt-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
          <div className="font-mono text-sm text-slate-800 truncate select-all">
            {showMainKey ? activeKey : '•'.repeat(Math.min(32, activeKey.length || 20))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowMainKey(!showMainKey)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
              title={showMainKey ? 'Hide key' : 'Show key'}
            >
              {showMainKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleCopy(activeKey)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-xs transition"
            >
              {copiedKey ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Snippet Example */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-600">
            <Code className="w-4 h-4 text-ctp-600" />
            <span>Example cURL SMS Dispatch</span>
          </div>
          <div className="p-3 bg-slate-900 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto">
            <code>
              curl -X POST {serverUrl}/v1/messages/send \<br />
              &nbsp;&nbsp;-H "x-api-key: {activeKey}" \<br />
              &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
              &nbsp;&nbsp;-d '{'{"to": "+18005550199", "content": "Hello from CTP SMS Gateway!"}'}'
            </code>
          </div>
        </div>
      </div>

      {/* Scoped Phone API Keys Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Scoped Phone API Keys</h2>
            <p className="text-xs text-slate-500">
              Generate restricted API keys scoped to individual phones or sub-accounts
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-ctp-600 hover:bg-ctp-700 rounded-xl transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate Scoped Key</span>
          </button>
        </div>

        {isLoadingKeys ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading scoped keys...</div>
        ) : phoneKeys.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
            No scoped API keys created yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {phoneKeys.map((k) => (
              <div key={k.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{k.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {k.api_key}
                    </span>
                    <button
                      onClick={() => handleCopy(k.api_key)}
                      className="text-slate-400 hover:text-slate-700"
                      title="Copy Key"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleDeletePhoneKey(k.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Key Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Generate Scoped API Key</h3>
            <p className="text-xs text-slate-500 mb-4">Provide a label for this API key</p>

            <form onSubmit={handleCreatePhoneKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Key Label / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Android Phone 1 or Support Bot"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ctp-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-ctp-600 hover:bg-ctp-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

