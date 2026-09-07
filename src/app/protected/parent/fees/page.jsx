'use client'
import React, { useState, useEffect } from 'react';
import { Wallet, Loader2 } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  partial: 'bg-blue-500/20 text-blue-300',
  paid: 'bg-emerald-500/20 text-emerald-300',
  overdue: 'bg-red-500/20 text-red-300',
  waived: 'bg-gray-500/20 text-gray-300',
};

export default function ParentFeesPage() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      const res = await fetch('/api/protected/parent/fees', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load fees');
        return;
      }
      setFees(data.data || []);
    } catch (err) {
      setError('Network error while loading fees');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-red-300">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
        <Wallet className="w-6 h-6 text-emerald-400" />
        Fees
      </h1>
      <p className="text-gray-400 mb-8 text-sm">
        Payments are made by bank transfer — contact your school for account details. Once
        received, your school will confirm it here.
      </p>

      {fees.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No fees recorded yet.</div>
      ) : (
        <div className="space-y-4">
          {fees.map((fee) => (
            <div key={fee.id} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-white font-medium">{fee.title}</p>
                  <p className="text-gray-400 text-xs">{fee.studentName} · {fee.term} {fee.academicYear}</p>
                  {fee.description && <p className="text-gray-500 text-xs mt-1">{fee.description}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap ${STATUS_COLORS[fee.status]}`}>
                  {fee.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <div>
                  <p className="text-gray-500 text-xs">Total</p>
                  <p className="text-white font-semibold">₦{Number(fee.amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Paid</p>
                  <p className="text-emerald-400 font-semibold">₦{Number(fee.amountPaid).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Balance</p>
                  <p className="text-yellow-400 font-semibold">₦{Number(fee.balance).toLocaleString()}</p>
                </div>
              </div>

              {fee.dueDate && (
                <p className="text-gray-500 text-xs mb-2">
                  Due {new Date(fee.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              )}

              {fee.payments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                  {fee.payments.map((p, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-400">
                      <span>{new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} · {p.reference || 'Bank transfer'}</span>
                      <span className="text-gray-300">₦{Number(p.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
