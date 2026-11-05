import React, { useState, useEffect } from 'react';
import {
  Plus,
  Upload,
  Search,
  Trash2,
  Send,
} from 'lucide-react';
import { ApiService } from '../api/client';
import { Contact } from '../types';
import { SendSmsModal } from '../components/SendSmsModal';

export const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [csvText, setCsvText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Send SMS helper
  const [smsTarget, setSmsTarget] = useState('');
  const [isSendSmsOpen, setIsSendSmsOpen] = useState(false);

  const loadContacts = async () => {
    try {
      const res = await ApiService.getContacts({ query: searchQuery || undefined });
      if (res.data) setContacts(res.data);
    } catch (e) {
      console.error('Error fetching contacts', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phoneNumber.trim()) {
      setError('Name and phone number are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await ApiService.createContact({
        name: name.trim(),
        phone_numbers: [phoneNumber.trim()],
        emails: email.trim() ? [email.trim()] : [],
      });

      setName('');
      setPhoneNumber('');
      setEmail('');
      setIsAddModalOpen(false);
      loadContacts();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
      const parsedContacts = [];

      for (const line of lines) {
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length >= 2) {
          parsedContacts.push({
            name: parts[0],
            phone_numbers: [parts[1]],
            emails: parts[2] ? [parts[2]] : [],
          });
        }
      }

      if (parsedContacts.length === 0) {
        setError('No valid contacts found in CSV. Expected format: Name, PhoneNumber, Email (optional)');
        setIsSubmitting(false);
        return;
      }

      await ApiService.uploadContacts(parsedContacts);
      setCsvText('');
      setIsUploadModalOpen(false);
      loadContacts();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to import CSV');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (contactId: string, contactName: string) => {
    if (!confirm(`Are you sure you want to delete ${contactName}?`)) return;
    try {
      await ApiService.deleteContact(contactId);
      loadContacts();
    } catch (e) {
      console.error('Error deleting contact', e);
    }
  };

  const triggerSms = (num: string) => {
    setSmsTarget(num);
    setIsSendSmsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Contact Manager</h1>
          <p className="text-sm text-slate-500">Store contacts and phone books for quick SMS messaging</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setError(null);
              setIsUploadModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => {
              setError(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-ctp-600 hover:bg-ctp-700 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search by contact name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadContacts()}
          className="flex-1 text-sm bg-transparent border-none focus:outline-none placeholder-slate-400"
        />
        <button
          onClick={loadContacts}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-lg transition"
        >
          Search
        </button>
      </div>

      {/* Contacts List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Phone Number(s)</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-400">
                    Loading contacts...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-400">
                    No contacts found. Click "Add Contact" to save your first recipient.
                  </td>
                </tr>
              ) : (
                contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-ctp-100 text-ctp-700 font-bold flex items-center justify-center text-xs">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {c.phone_numbers.map((num, i) => (
                          <button
                            key={i}
                            onClick={() => triggerSms(num)}
                            title="Click to Send SMS"
                            className="inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-ctp-50 hover:text-ctp-700 text-slate-700 border border-slate-200 transition"
                          >
                            <Send className="w-3 h-3 text-ctp-600" />
                            <span>{num}</span>
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {c.emails && c.emails.length > 0 ? c.emails.join(', ') : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Add Contact</h3>
            <p className="text-xs text-slate-500 mb-4">Save recipient details for easy SMS dispatch</p>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ctp-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Phone Number (E.164)
                </label>
                <input
                  type="text"
                  placeholder="+18005550199 or +8801700000000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-ctp-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ctp-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-ctp-600 hover:bg-ctp-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Batch Import Contacts</h3>
            <p className="text-xs text-slate-500 mb-4">
              Paste CSV text in format: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Name, PhoneNumber, Email</code>
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCsvImport} className="space-y-4">
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Alice, +18005550100, alice@example.com&#10;Bob, +18005550101, bob@example.com"
                className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ctp-500 resize-none"
                required
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-ctp-600 hover:bg-ctp-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Importing...' : 'Import Contacts'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SendSmsModal
        isOpen={isSendSmsOpen}
        onClose={() => setIsSendSmsOpen(false)}
        defaultRecipient={smsTarget}
      />
    </div>
  );
};

