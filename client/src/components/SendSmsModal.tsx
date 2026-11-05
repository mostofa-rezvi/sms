import React, { useState, useEffect } from 'react';
import { X, Send, PhoneCall, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';
import { ApiService } from '../api/client';
import { Phone } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultRecipient?: string;
}

export const SendSmsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultRecipient = '',
}) => {
  const [phones, setPhones] = useState<Phone[]>([]);
  const [selectedFrom, setSelectedFrom] = useState('');
  const [selectedSim, setSelectedSim] = useState('SIM1');
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setRecipient(defaultRecipient);
      loadPhones();
    }
  }, [isOpen, defaultRecipient]);

  const loadPhones = async () => {
    try {
      const res = await ApiService.getPhones();
      if (res.data && res.data.length > 0) {
        setPhones(res.data);
        setSelectedFrom(res.data[0].phoneNumber);
        setSelectedSim(res.data[0].sim || 'SIM1');
      }
    } catch (e) {
      console.warn('Could not load registered phones', e);
    }
  };

  if (!isOpen) return null;

  const charCount = content.length;
  const segments = Math.max(1, Math.ceil(charCount / 160));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !content.trim()) {
      setError('Please provide both recipient phone number and SMS content.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await ApiService.sendMessage({
        to: recipient.trim(),
        content: content.trim(),
        from: selectedFrom || undefined,
        sim: selectedSim,
      });

      setSuccess(true);
      setTimeout(() => {
        setContent('');
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to queue SMS message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-ctp-100 text-ctp-700">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Send New SMS</h3>
              <p className="text-xs text-slate-500">Dispatch message via registered Android phone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>SMS successfully queued! Your Android device will dispatch it.</span>
            </div>
          )}

          {/* Device & SIM Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                From (Gateway Device)
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select
                  value={selectedFrom}
                  onChange={(e) => setSelectedFrom(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ctp-500 font-mono"
                >
                  {phones.length === 0 ? (
                    <option value="">Default registered phone</option>
                  ) : (
                    phones.map((p) => (
                      <option key={p.id} value={p.phoneNumber}>
                        {p.phoneNumber} ({p.sim})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                SIM Slot
              </label>
              <select
                value={selectedSim}
                onChange={(e) => setSelectedSim(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ctp-500 font-mono"
              >
                <option value="SIM1">SIM 1</option>
                <option value="SIM2">SIM 2</option>
              </select>
            </div>
          </div>

          {/* Recipient */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Recipient Phone Number (E.164 Format)
            </label>
            <div className="relative">
              <PhoneCall className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="+18005550199 or +8801700000000"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ctp-500 font-mono"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Include country code starting with +</p>
          </div>

          {/* Message Content */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-600">SMS Content</label>
              <span className="text-[11px] text-slate-400">
                {charCount} chars • {segments} {segments === 1 ? 'part' : 'parts'}
              </span>
            </div>
            <textarea
              rows={4}
              placeholder="Type your SMS message here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ctp-500 resize-none"
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-ctp-600 hover:bg-ctp-700 active:bg-ctp-800 rounded-xl shadow-sm hover:shadow transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Queueing SMS...' : 'Send SMS'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

