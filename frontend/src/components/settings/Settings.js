// frontend/src/components/settings/Settings.js
import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Toggle from '../ui/Toggle';
import { useTheme } from '../../context/ThemeContext';

import {
  User as UserIcon,
  Bell,
  Palette,
  Shield,
  Activity,
  Trash2,
  Save,
  FileText,
  Settings as SettingsIcon,
} from 'lucide-react';

export default function Settings({ user }) {
  // Profile
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Notifications
  const [notif, setNotif] = useState({ taskUpdates: true, inventory: true, weeklyDigest: false });
  const [savingNotif, setSavingNotif] = useState(false);

  // Preferences
  const [prefs, setPrefs] = useState({ itemsPerPage: 8, compactMode: false });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Reports defaults
  const [reports, setReports] = useState({ includeCharts: true, includeSummary: true, format: 'pdf' });
  const [savingReports, setSavingReports] = useState(false);

  // Real-time sockets
  const [realtime, setRealtime] = useState({ liveUpdates: true });
  const [savingRealtime, setSavingRealtime] = useState(false);

  // Theme
  const { theme, toggle: toggleTheme } = useTheme();

  // Load settings (optional: replace with real API)
  useEffect(() => {
    // Example: you could get persisted user settings
    // api.get('/settings/me').then(res => { ... })
  }, []);

  // Save handlers (stubbed to API, works with your axios instance)
  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      await api.put('/users/me', profile); // implement backend if needed
    } finally {
      setSavingProfile(false);
    }
  };

  const saveNotif = async () => {
    try {
      setSavingNotif(true);
      await api.put('/settings/notifications', notif); // implement backend if needed
    } finally {
      setSavingNotif(false);
    }
  };

  const savePrefs = async () => {
    try {
      setSavingPrefs(true);
      localStorage.setItem('servix-items-per-page', String(prefs.itemsPerPage));
      localStorage.setItem('servix-compact', prefs.compactMode ? '1' : '0');
      // optionally: await api.put('/settings/prefs', prefs)
    } finally {
      setSavingPrefs(false);
    }
  };

  const saveReports = async () => {
    try {
      setSavingReports(true);
      await api.put('/settings/reports', reports); // implement backend if needed
    } finally {
      setSavingReports(false);
    }
  };

  const saveRealtime = async () => {
    try {
      setSavingRealtime(true);
      localStorage.setItem('servix-live', realtime.liveUpdates ? '1' : '0');
      // optionally: await api.put('/settings/realtime', realtime)
    } finally {
      setSavingRealtime(false);
    }
  };

  const dangerReset = async () => {
    if (!window.confirm('Reset all my preferences to defaults?')) return;
    localStorage.removeItem('servix-items-per-page');
    localStorage.removeItem('servix-compact');
    localStorage.removeItem('servix-live');
    window.location.reload();
  };

  const section = (title, icon, children) => (
    <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-green-500 p-3 rounded-xl text-white">
              <SettingsIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Manage your profile, preferences, notifications, appearance, and more.
              </p>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile */}
          {section(
            'Profile',
            <UserIcon className="w-5 h-5" />,
            <>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Name</label>
                <input
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Email</label>
                <input
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2"
                  value={profile.email}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-60"
              >
                <Save className="w-4 h-4" /> {savingProfile ? 'Saving…' : 'Save'}
              </button>
            </>
          )}

          {/* Notifications */}
          {section(
            'Notifications',
            <Bell className="w-5 h-5" />,
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-200">Task updates</span>
                <Toggle
                  id="n1"
                  checked={notif.taskUpdates}
                  onChange={(v) => setNotif((n) => ({ ...n, taskUpdates: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-200">Inventory changes</span>
                <Toggle
                  id="n2"
                  checked={notif.inventory}
                  onChange={(v) => setNotif((n) => ({ ...n, inventory: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-200">Weekly digest</span>
                <Toggle
                  id="n3"
                  checked={notif.weeklyDigest}
                  onChange={(v) => setNotif((n) => ({ ...n, weeklyDigest: v }))}
                />
              </div>
              <button
                onClick={saveNotif}
                disabled={savingNotif}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-60"
              >
                <Save className="w-4 h-4" /> {savingNotif ? 'Saving…' : 'Save'}
              </button>
            </>
          )}

          {/* Preferences */}
          {section(
            'Preferences',
            <Activity className="w-5 h-5" />,
            <>
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-700 dark:text-slate-200">Items per page</label>
                <select
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2"
                  value={prefs.itemsPerPage}
                  onChange={(e) => setPrefs((p) => ({ ...p, itemsPerPage: Number(e.target.value) }))}
                >
                  {[8, 12, 20, 50].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-200">Compact mode</span>
                <Toggle
                  id="pref-compact"
                  checked={prefs.compactMode}
                  onChange={(v) => setPrefs((p) => ({ ...p, compactMode: v }))}
                />
              </div>
              <button
                onClick={savePrefs}
                disabled={savingPrefs}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-60"
              >
                <Save className="w-4 h-4" /> {savingPrefs ? 'Saving…' : 'Save'}
              </button>
            </>
          )}

          {/* Appearance (Dark Mode) */}
          {section(
            'Appearance',
            <Palette className="w-5 h-5" />,
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-200">Dark Mode</span>
                <Toggle id="dark-mode" checked={theme === 'dark'} onChange={toggleTheme} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your preference is saved to this device and follows your account.
              </p>
            </>
          )}

          {/* Reports defaults */}
          {section(
            'Reports Defaults',
            <FileText className="w-5 h-5" />,
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-200">Include charts</span>
                <Toggle
                  id="rep-charts"
                  checked={reports.includeCharts}
                  onChange={(v) => setReports((r) => ({ ...r, includeCharts: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-200">Include summary</span>
                <Toggle
                  id="rep-summary"
                  checked={reports.includeSummary}
                  onChange={(v) => setReports((r) => ({ ...r, includeSummary: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-700 dark:text-slate-200">Default format</label>
                <select
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2"
                  value={reports.format}
                  onChange={(e) => setReports((r) => ({ ...r, format: e.target.value }))}
                >
                  <option value="pdf">PDF</option>
                  <option value="xlsx">Excel</option>
                </select>
              </div>
              <button
                onClick={saveReports}
                disabled={savingReports}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-60"
              >
                <Save className="w-4 h-4" /> {savingReports ? 'Saving…' : 'Save'}
              </button>
            </>
          )}

          {/* Real-time & Security */}
          {section(
            'Real-time & Security',
            <Shield className="w-5 h-5" />,
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-200">Live updates (Socket.IO)</span>
                <Toggle
                  id="live-updates"
                  checked={realtime.liveUpdates}
                  onChange={(v) => setRealtime((r) => ({ ...r, liveUpdates: v }))}
                />
              </div>
              <button
                onClick={saveRealtime}
                disabled={savingRealtime}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-60"
              >
                <Save className="w-4 h-4" /> {savingRealtime ? 'Saving…' : 'Save'}
              </button>
            </>
          )}

          {/* Danger zone */}
          {section(
            'Danger Zone',
            <Trash2 className="w-5 h-5" />,
            <>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Reset your local preferences (does not delete data).
              </p>
              <button
                onClick={dangerReset}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                <Trash2 className="w-4 h-4" /> Reset Preferences
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
