'use client'
import React, { useState, useEffect } from 'react';
import { Wallet, Plus, X, Loader2, CheckCircle, Search } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-blue-100 text-blue-800',
  paid: 'bg-emerald-100 text-emerald-800',
  overdue: 'bg-red-100 text-red-800',
  waived: 'bg-gray-100 text-gray-800',
};

export default function AdminFeesPage() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmModalFee, setConfirmModalFee] = useState(null);

  useEffect(() => {
    fetchFees();
  }, [statusFilter]);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const url = statusFilter
        ? `/api/protected/admin/fees?status=${statusFilter}`
        : '/api/protected/admin/fees';
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setFees(data.data || []);
    } catch (err) {
      console.error('Failed to load fees:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-600" />
            Fees
          </h1>
          <p className="text-gray-500 text-sm mt-1">Create fees and confirm bank-transfer payments manually.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Fee
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {['', 'pending', 'partial', 'paid', 'overdue'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : fees.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No fees found.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fees.map((fee) => (
                <tr key={fee.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">
                    {fee.student.firstName} {fee.student.lastName}
                    <div className="text-xs text-gray-400">{fee.student.studentProfile?.className}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{fee.title}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">₦{Number(fee.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">₦{Number(fee.amountPaid).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[fee.status]}`}>
                      {fee.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {fee.status !== 'paid' && (
                      <button
                        onClick={() => setConfirmModalFee(fee)}
                        className="text-emerald-600 hover:text-emerald-800 text-xs font-medium"
                      >
                        Confirm payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <CreateFeeModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchFees(); }}
        />
      )}

      {confirmModalFee && (
        <ConfirmPaymentModal
          fee={confirmModalFee}
          onClose={() => setConfirmModalFee(null)}
          onConfirmed={() => { setConfirmModalFee(null); fetchFees(); }}
        />
      )}
    </div>
  );
}

function CreateFeeModal({ onClose, onCreated }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [termName, setTermName] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      const res = await fetch(`/api/protected/admin/users?role=STUDENT&search=${encodeURIComponent(search)}&limit=50`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setStudents(data.users || []);
    };
    const t = setTimeout(fetchStudents, 300);
    return () => clearTimeout(t);
  }, [search]);

  const toggleStudent = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    setError('');
    if (selectedIds.length === 0 || !title || !amount) {
      setError('Select at least one student, and fill in title and amount.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/protected/admin/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentIds: selectedIds,
          title,
          description,
          amount: Number(amount),
          termName,
          academicYear,
          dueDate: dueDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create fee');
        return;
      }
      onCreated();
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Create a fee</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}

        <label className="block text-sm font-medium text-gray-700 mb-1">Students</label>
        <div className="relative mb-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students by name..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg mb-1 divide-y divide-gray-100">
          {students.map((s) => (
            <label key={s.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={selectedIds.includes(s.id)}
                onChange={() => toggleStudent(s.id)}
                className="accent-emerald-600"
              />
              {s.firstName} {s.lastName} <span className="text-gray-400 text-xs">({s.studentProfile?.className || 'no class'})</span>
            </label>
          ))}
          {students.length === 0 && <p className="text-gray-400 text-sm px-3 py-2">No students found.</p>}
        </div>
        <p className="text-xs text-gray-500 mb-4">{selectedIds.length} student(s) selected</p>

        <div className="space-y-3">
          <input type="text" placeholder="Title, e.g. First Term Tuition" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input type="number" placeholder="Amount (₦)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Term, e.g. First Term" value={termName} onChange={(e) => setTermName(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input type="text" placeholder="Academic year, e.g. 2025/2026" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create fee'}
        </button>
      </div>
    </div>
  );
}

function ConfirmPaymentModal({ fee, onClose, onConfirmed }) {
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const balance = Number(fee.amount) - Number(fee.amountPaid);

  const handleSubmit = async () => {
    setError('');
    if (!amount || Number(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/protected/admin/fees/${fee.id}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount: Number(amount), reference, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to confirm payment');
        return;
      }
      onConfirmed();
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Confirm payment</h3>
        <p className="text-sm text-gray-500 mb-4">
          {fee.student.firstName} {fee.student.lastName} — {fee.title}<br />
          Balance owed: ₦{balance.toLocaleString()}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}

        <div className="space-y-3">
          <input type="number" placeholder="Amount received (₦)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input type="text" placeholder="Transfer reference (optional)" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (<><CheckCircle className="w-5 h-5" /> Confirm payment</>)}
        </button>
      </div>
    </div>
  );
}
