import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  Smartphone,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
} from 'lucide-react';
import { ApiService } from '../api/client';
import { MessageThread, Message, Phone } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { SendSmsModal } from '../components/SendSmsModal';

export const Messages: React.FC = () => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [selectedSim, setSelectedSim] = useState('SIM1');
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadThreads = async () => {
    try {
      const res = await ApiService.getThreads({ query: searchQuery || undefined });
      if (res.data) {
        setThreads(res.data);
        if (!activeThread && res.data.length > 0) {
          setActiveThread(res.data[0]);
        }
      }
    } catch (e) {
      console.error('Error loading message threads', e);
    } finally {
      setIsLoadingThreads(false);
    }
  };

  const loadMessagesForThread = async (contact: string, owner: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await ApiService.getMessages({ contact, owner, limit: 100 });
      if (res.data) {
        // Sort chronologically ascending for chat view
        const sorted = [...res.data].sort((a, b) => {
          const timeA = new Date(a.order_timestamp || a.created_at).getTime();
          const timeB = new Date(b.order_timestamp || b.created_at).getTime();
          return timeA - timeB;
        });
        setMessages(sorted);
      }
    } catch (e) {
      console.error('Error loading messages for thread', e);
    } finally {
      setIsLoadingMessages(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const loadPhones = async () => {
    try {
      const res = await ApiService.getPhones();
      if (res.data) setPhones(res.data);
    } catch (e) {
      console.warn('Error loading phones', e);
    }
  };

  useEffect(() => {
    loadThreads();
    loadPhones();
  }, []);

  useEffect(() => {
    if (activeThread) {
      loadMessagesForThread(activeThread.contact, activeThread.owner);
    } else {
      setMessages([]);
    }
  }, [activeThread]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim() || isSending) return;

    setIsSending(true);
    try {
      await ApiService.sendMessage({
        to: activeThread.contact,
        from: activeThread.owner,
        content: replyText.trim(),
        sim: selectedSim,
      });

      setReplyText('');
      // Reload current conversation
      await loadMessagesForThread(activeThread.contact, activeThread.owner);
      loadThreads();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to dispatch SMS');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!confirm('Are you sure you want to delete this entire conversation?')) return;
    try {
      await ApiService.deleteThread(threadId);
      setActiveThread(null);
      loadThreads();
    } catch (e) {
      console.error('Failed to delete thread', e);
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Bar inside Messages container */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-ctp-600" />
          <h1 className="text-base font-bold text-slate-800">Messages & Conversations</h1>
        </div>

        <button
          onClick={() => setIsSendModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-ctp-600 hover:bg-ctp-700 rounded-xl transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column: Threads list */}
        <div className="w-80 sm:w-96 border-r border-slate-200 flex flex-col bg-slate-50/40">
          {/* Search threads */}
          <div className="p-3 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search contact or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadThreads()}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ctp-500"
              />
            </div>
          </div>

          {/* Threads list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoadingThreads ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading conversations...</div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No conversation threads yet. Start one with "New Chat"!
              </div>
            ) : (
              threads.map((th) => {
                const isSelected = activeThread?.id === th.id;
                return (
                  <div
                    key={th.id}
                    onClick={() => setActiveThread(th)}
                    className={`p-3.5 cursor-pointer transition flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-ctp-50/80 border-l-4 border-ctp-600'
                        : 'hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-xs text-slate-800 truncate">
                          {th.contact}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(th.last_message_timestamp).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{th.last_message_content || 'No text'}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                        <span>via {th.owner}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Active conversation chat history */}
        <div className="flex-1 flex flex-col bg-white">
          {activeThread ? (
            <>
              {/* Active Thread Header */}
              <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                <div>
                  <h3 className="font-mono font-bold text-sm text-slate-800">{activeThread.contact}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Gateway Device: {activeThread.owner}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadMessagesForThread(activeThread.contact, activeThread.owner)}
                    title="Refresh conversation"
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteThread(activeThread.id)}
                    title="Delete conversation"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div className="flex-1 p-6 overflow-y-auto space-y-3 bg-slate-50/30">
                {isLoadingMessages ? (
                  <div className="text-center py-12 text-xs text-slate-400">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    No messages in this conversation yet. Send one below!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isOutbound = m.type !== 'mobile-originated';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isOutbound
                              ? 'bg-ctp-600 text-white rounded-br-sm shadow-sm'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          {m.failure_reason && (
                            <p className="text-[11px] text-rose-200 mt-1 font-mono">
                              Error: {m.failure_reason}
                            </p>
                          )}
                        </div>

                        {/* Timestamp & Status Metadata */}
                        <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-400">
                          <span>
                            {new Date(m.order_timestamp || m.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span>•</span>
                          <span className="font-mono">{m.sim}</span>
                          {isOutbound && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{m.status}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Reply Composer */}
              <form onSubmit={handleSendReply} className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
                <div className="flex items-end gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-ctp-500 focus-within:border-transparent">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply(e);
                        }
                      }}
                      placeholder={`Reply to ${activeThread.contact}...`}
                      className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-none px-2 pt-1"
                    />
                    <div className="flex items-center justify-between pt-1 px-2 text-[11px] text-slate-400 border-t border-slate-200/60">
                      <span>{replyText.length} characters</span>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedSim}
                          onChange={(e) => setSelectedSim(e.target.value)}
                          className="bg-transparent text-slate-600 font-mono text-[11px] focus:outline-none"
                        >
                          <option value="SIM1">SIM 1</option>
                          <option value="SIM2">SIM 2</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSending || !replyText.trim()}
                    className="p-3 bg-ctp-600 hover:bg-ctp-700 active:bg-ctp-800 text-white rounded-2xl shadow-sm transition disabled:opacity-40"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">Select a Conversation</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Choose a conversation thread from the left or click "New Chat" to dispatch an SMS to any recipient.
              </p>
            </div>
          )}
        </div>
      </div>

      <SendSmsModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSuccess={() => {
          loadThreads();
        }}
      />
    </div>
  );
};

