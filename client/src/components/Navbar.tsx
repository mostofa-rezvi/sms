import React, { useState } from 'react';
import { Menu, Plus, Smartphone, LogOut, Globe, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SendSmsModal } from './SendSmsModal';

interface Props {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<Props> = ({ onToggleSidebar }) => {
  const { user, serverUrl, logout } = useAuth();
  const [isSendOpen, setIsSendOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Mobile hamburger & title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl lg:hidden transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Environment</span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-600">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[200px]">{serverUrl}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick SMS, Phone Status, Logout */}
        <div className="flex items-center gap-3">
          {/* Active device pill */}
          <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Active Gateway</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          </div>

          {/* Quick SMS Button */}
          <button
            onClick={() => setIsSendOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold text-white bg-ctp-600 hover:bg-ctp-700 active:bg-ctp-800 rounded-xl shadow-sm transition hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Send SMS</span>
          </button>

          {/* Logout button */}
          <button
            onClick={logout}
            title={`Log out (${user?.email || 'API user'})`}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <SendSmsModal isOpen={isSendOpen} onClose={() => setIsSendOpen(false)} />
    </>
  );
};

