import React, { useState, useEffect } from 'react';
import {
  Send,
  Inbox,
  Clock,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  BatteryCharging,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { ApiService } from '../api/client';
import { DashboardStats, Phone, Message } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { SendSmsModal } from '../components/SendSmsModal';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [replyTo, setReplyTo] = useState('');

  const loadData = async () => {
    try {
      const [statsRes, phonesRes, messagesRes] = await Promise.all([
        ApiService.getStats(),
        ApiService.getPhones(),
        ApiService.getMessages({ limit: 10 }),
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (phonesRes.data) setPhones(phonesRes.data);
      if (messagesRes.data) setRecentMessages(messagesRes.data);
    } catch (e) {
      console.error('Error loading dashboard data', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 20000); // Poll every 20 seconds
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleReply = (contact: string) => {
    setReplyTo(contact);
    setIsSendOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">System Overview</h1>
          <p className="text-sm text-slate-500">Live metrics and Android gateway activity</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setReplyTo('');
              setIsSendOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-ctp-600 hover:bg-ctp-700 active:bg-ctp-800 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Quick SMS</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sent */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Sent</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {isLoading ? '...' : (stats?.sent_messages ?? 0)}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Outbound SMS
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <Send className="w-6 h-6" />
          </div>
        </div>

        {/* Total Received */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Received SMS</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {isLoading ? '...' : (stats?.received_messages ?? 0)}
            </h3>
            <p className="text-xs text-purple-600 font-medium mt-1 flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5" /> Inbound SMS
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        {/* Pending In Queue */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">In Queue</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {isLoading ? '...' : (stats?.pending_messages ?? 0)}
            </h3>
            <p className="text-xs text-amber-600 font-medium mt-1">Awaiting dispatch</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Active Phones */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gateway Devices</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {isLoading ? '...' : (phones.length)}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              {stats?.active_phones ?? phones.length} Active online
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Gateway Devices Live Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-ctp-600" />
            <h2 className="text-base font-bold text-slate-800">Connected Gateway Devices</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {phones.length} Registered {phones.length === 1 ? 'Device' : 'Devices'}
          </span>
        </div>

        {phones.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <Smartphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Android Phone Registered</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Download and open the CTP SMS app on your Android device and log in with your API Key to turn it into your gateway.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {phones.map((phone) => (
              <div
                key={phone.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono font-bold text-sm text-slate-800">
                      {phone.phoneNumber}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-md bg-slate-200 text-slate-700">
                    {phone.sim}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Rate Limit</span>
                    <span className="font-semibold text-slate-700">{phone.messagesPerMinute} SMS/min</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Status</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-800">Recent Message Activity</h2>
            <p className="text-xs text-slate-500">Latest SMS logs routed through gateway</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Message Content</th>
                <th className="px-5 py-3">SIM</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentMessages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-xs">
                    No message activity found. Click "Quick SMS" to dispatch a message.
                  </td>
                </tr>
              ) : (
                recentMessages.map((msg) => {
                  const isInbound = msg.type === 'mobile-originated';
                  return (
                    <tr key={msg.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isInbound
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {isInbound ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isInbound ? 'Inbound' : 'Outbound'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs font-semibold text-slate-800">
                        {msg.contact}
                      </td>
                      <td className="px-5 py-3.5 max-w-xs truncate text-slate-700 text-xs">
                        {msg.content}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono text-slate-500">
                        {msg.sim}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <StatusBadge status={msg.status} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-400">
                        {new Date(msg.order_timestamp || msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleReply(msg.contact)}
                          className="text-xs font-semibold text-ctp-600 hover:text-ctp-700"
                        >
                          Reply
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SendSmsModal
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
        defaultRecipient={replyTo}
        onSuccess={loadData}
      />
    </div>
  );
};

