import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  Shield,
  Zap,
} from 'lucide-react';
import { ApiService } from '../api/client';
import { Phone } from '../types';

export const Phones: React.FC = () => {
  const [phones, setPhones] = useState<Phone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newSim, setNewSim] = useState('SIM1');
  const [messagesPerMinute, setMessagesPerMinute] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPhones = async () => {
    try {
      const res = await ApiService.getPhones();
      if (res.data) setPhones(res.data);
    } catch (e) {
      console.error('Error fetching phones', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPhones();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await ApiService.registerPhone({
        phoneNumber: newPhoneNumber.trim(),
        sim: newSim,
        messagesPerMinute,
      });

      setIsModalOpen(false);
      setNewPhoneNumber('');
      loadPhones();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to register phone');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (phoneId: string, phoneNum: string) => {
    if (!confirm(`Are you sure you want to unregister ${phoneNum}?`)) return;
    try {
      await ApiService.deletePhone(phoneId);
      loadPhones();
    } catch (e) {
      console.error('Error deleting phone', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Android Gateway Phones</h1>
          <p className="text-sm text-slate-500">Manage Android devices connected to your SMS dispatch network</p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-ctp-600 hover:bg-ctp-700 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register Phone</span>
        </button>
      </div>

      {/* Phones Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading devices...</div>
      ) : phones.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Smartphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Gateway Phones Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Connect an Android phone by opening the CTP SMS app and logging in, or manually register a phone number here.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-ctp-600 hover:bg-ctp-700 rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Phone Number</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {phones.map((phone) => (
            <div
              key={phone.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-mono font-bold text-base text-slate-800">{phone.phoneNumber}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-medium text-emerald-700">Online Gateway</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                    {phone.sim}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Zap className="w-3.5 h-3.5 text-ctp-600" />
                      Rate Limit
                    </span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {phone.messagesPerMinute} SMS / min
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Radio className="w-3.5 h-3.5 text-blue-600" />
                      FCM Push Triggers
                    </span>
                    <span className="font-semibold text-slate-800">
                      {phone.fcmToken ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" /> Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          Polling mode
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Registered
                    </span>
                    <span className="font-mono text-slate-600">
                      {new Date(phone.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleDelete(phone.id, phone.phoneNumber)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Unregister</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Register Android Phone</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add phone number and configure dispatch preferences
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Phone Number (E.164 format)
                </label>
                <input
                  type="text"
                  placeholder="+18005550199 or +8801700000000"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-ctp-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    SIM Card Slot
                  </label>
                  <select
                    value={newSim}
                    onChange={(e) => setNewSim(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-ctp-500"
                  >
                    <option value="SIM1">SIM 1</option>
                    <option value="SIM2">SIM 2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Rate Limit (SMS/min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={messagesPerMinute}
                    onChange={(e) => setMessagesPerMinute(parseInt(e.target.value, 10) || 30)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-ctp-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                  {isSubmitting ? 'Registering...' : 'Save Phone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

