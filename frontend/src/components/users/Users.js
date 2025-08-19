import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

/* --------------------------------- UI bits -------------------------------- */
const Badge = ({ children, color = 'gray' }) => {
  const map = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-emerald-100 text-emerald-700',
    yellow: 'bg-amber-100 text-amber-700',
    red: 'bg-rose-100 text-rose-700',
    teal: 'bg-teal-100 text-teal-700',
    violet: 'bg-violet-100 text-violet-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[color] || map.gray}`}>
      {children}
    </span>
  );
};

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? 'bg-indigo-600' : 'bg-gray-300'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

/* ------------------------------- Add / Edit ------------------------------- */
const emptyForm = {
  serviceNumber: '',
  name: '',
  email: '',
  phoneNumber: '',
  role: 'Technician',
  department: 'TSEU',
  isActive: true,
  preApproved: false,
  avatar: '',
};

function UserModal({ open, onClose, onSubmit, initial, title = 'Add User' }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(initial || emptyForm);
    setError('');
  }, [initial, open]);

  const change = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setError('');
    // simple client-side checks
    if (!form.name || !form.email || !form.serviceNumber || !form.phoneNumber) {
      setError('Please fill name, email, service number and phone.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100" aria-label="Close">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Service Number</label>
            <input className="w-full rounded-lg border p-2" value={form.serviceNumber} onChange={(e) => change('serviceNumber', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Name</label>
            <input className="w-full rounded-lg border p-2" value={form.name} onChange={(e) => change('name', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input type="email" className="w-full rounded-lg border p-2" value={form.email} onChange={(e) => change('email', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Phone</label>
            <input className="w-full rounded-lg border p-2" value={form.phoneNumber} onChange={(e) => change('phoneNumber', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Role</label>
            <select className="w-full rounded-lg border p-2" value={form.role} onChange={(e) => change('role', e.target.value)}>
              <option>Technician</option>
              <option>Engineer</option>
              <option>Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Department</label>
            <input className="w-full rounded-lg border p-2" value={form.department} onChange={(e) => change('department', e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="text-sm font-medium">Active</div>
              <div className="text-xs text-gray-500">Enable/disable account</div>
            </div>
            <Toggle checked={!!form.isActive} onChange={(v) => change('isActive', v)} />
          </div>
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="text-sm font-medium">Pre‑approved</div>
              <div className="text-xs text-gray-500">Allowed to receive tasks</div>
            </div>
            <Toggle checked={!!form.preApproved} onChange={(v) => change('preApproved', v)} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Avatar URL (optional)</label>
            <input className="w-full rounded-lg border p-2" value={form.avatar || ''} onChange={(e) => change('avatar', e.target.value)} />
          </div>

          {error && <div className="md:col-span-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t p-5">
          <button onClick={onClose} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" strokeWidth="4"/><path d="M4 12a8 8 0 018-8" strokeWidth="4"/></svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            )}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirm', message = 'Are you sure?' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-5">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Page ---------------------------------- */
const ROLES = ['All', 'Technician', 'Engineer', 'Admin'];

const Users = ({ user, setCurrentPage }) => {
  const canManage = user?.role === 'Engineer' || user?.role === 'Admin';

  // nav highlight
  useEffect(() => { setCurrentPage?.('users'); }, [setCurrentPage]);

  // state
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(12);

  const [q, setQ] = useState('');
  const [role, setRole] = useState('All');
  const [department, setDepartment] = useState('');
  const [active, setActive] = useState('any'); // any | true | false

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  // fetch
  const fetchUsers = async () => {
    setLoading(true);
    setErr('');
    try {
      const params = {
        page,
        limit,
      };
      if (q) params.q = q;
      if (role !== 'All') params.role = role;
      if (department) params.department = department;
      if (active !== 'any') params.active = String(active);

      const { data } = await axios.get('/users', { params });
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); /* eslint-disable-next-line */ }, [page, role, department, active]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [q]);

  const onCreate = async (payload) => {
    await axios.post('/users', payload);
    setPage(1);
    await fetchUsers();
  };
  const onUpdate = async (payload) => {
    await axios.put(`/users/${editItem._id}`, payload);
    await fetchUsers();
  };
  const onDelete = async () => {
    await axios.delete(`/users/${deleteItem._id}`);
    setDeleteItem(null);
    // if we deleted last row on last page, go back one page
    if (users.length === 1 && page > 1) setPage(page - 1);
    await fetchUsers();
  };

  const roleColor = (r) => (r === 'Admin' ? 'red' : r === 'Engineer' ? 'blue' : 'teal');

  const headerRight = useMemo(
    () => (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, service #, phone…"
            className="w-full sm:w-72 rounded-xl border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Dept"
            className="w-28 rounded-xl border px-3 py-2 text-sm"
          />
          <select value={active} onChange={(e) => setActive(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
            <option value="any">Any</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-teal-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12"/></svg>
            Add User
          </button>
        )}
      </div>
    ),
    [q, role, department, active, canManage]
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        {headerRight}
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Service #</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Phone</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Department</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent mr-2" />
                    Loading users…
                  </td>
                </tr>
              )}

              {!loading && err && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-rose-600">{err}</td>
                </tr>
              )}

              {!loading && !err && users.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                      <p className="mt-1 text-sm text-gray-500">Users will appear here when added to the system.</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !err && users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-white flex items-center justify-center text-xs font-bold">
                        {(u.name?.[0] || 'U').toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{u.name || '—'}</div>
                        <div className="text-xs text-gray-500">ID: {u._id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{u.serviceNumber || '—'}</td>
                  <td className="px-4 py-3">{u.email || '—'}</td>
                  <td className="px-4 py-3">{u.phoneNumber || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge color={roleColor(u.role)}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">{u.department || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge color={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canManage ? (
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setEditItem(u)}
                          className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-gray-50"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteItem(u)}
                          className="rounded-lg border px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                          title="Delete"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Read‑only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t px-4 py-3 text-sm">
          <div className="text-gray-600">Total: <strong>{total}</strong></div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-gray-700">Page {page} / {pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UserModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={onCreate}
        title="Add User"
      />
      <UserModal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        onSubmit={onUpdate}
        initial={editItem || undefined}
        title="Edit User"
      />
      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={onDelete}
        title="Delete user?"
        message={`This will permanently remove "${deleteItem?.name || ''}".`}
      />
    </div>
  );
};

export default Users;
