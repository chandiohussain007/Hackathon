/* Dispute Resolution Submission Screen — KhidmatAI
   Allows users to file a complaint. Calls the advanced DisputeAgent (Hermes-3-405b)
   and displays the judge-facing structured AI resolution result instantly. */
import React, { useState } from 'react';
import api from '../api';

const COMPLAINT_TYPES = [
  { id: 'no_show', label: 'Provider Did Not Arrive', desc: 'Expert never showed up or called.' },
  { id: 'delay', label: 'Significant Delay', desc: 'Arrived more than 30 mins late.' },
  { id: 'quality', label: 'Poor Quality / Damaged', desc: 'Unsatisfactory work or broken things.' },
  { id: 'price_disagreement', label: 'Pricing Issue', desc: 'Asked for more cash than booked rate.' },
  { id: 'other', label: 'Other Complaint', desc: 'Any other issue or general feedback.' }
];

export default function Dispute({ sessionId, bookingId, selectedProvider, onResolved, onBack }) {
  const [complaintType, setComplaintType] = useState('quality');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const providerName = selectedProvider?.provider_name || "Zubair Ahmed";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please describe your issue.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const resp = await api.raiseDispute({
        sessionId,
        bookingId,
        description: `[Category: ${complaintType}] ${description}`,
        userId: "DEMO-USER"
      });
      setResult(resp.dispute_result);
    } catch (err) {
      setError(err.message || 'Failed to submit dispute.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 h-16"
              style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 16px rgba(0,75,36,0.06)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: '#eeeef0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#1a1c1e' }}>arrow_back</span>
          </button>
          <h1 style={{ fontSize: '17px', fontWeight: 600, color: '#ba1a1a' }}>Raise Dispute</h1>
        </div>
        <div className="w-9" />
      </header>

      <main className="pt-20 pb-8 px-5 max-w-2xl mx-auto w-full space-y-6">

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-on-surface">What went wrong?</h2>
              <p className="text-sm text-secondary mt-1">
                File a claim for booking <strong>{bookingId.slice(0,8)}</strong> with <strong>{providerName}</strong>.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 bg-error-container text-on-error-container text-xs rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Categories */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-wider block">Select Category</label>
              <div className="grid grid-cols-1 gap-2">
                {COMPLAINT_TYPES.map((type) => (
                  <label
                    key={type.id}
                    className={`flex items-start gap-3 p-3 cursor-pointer rounded-xl border transition-all ${
                      complaintType === type.id
                        ? 'border-error/40 bg-error/5 shadow-sm'
                        : 'border-white/40 bg-white/60 hover:bg-white/90'
                    }`}
                  >
                    <input
                      type="radio"
                      name="complaintType"
                      value={type.id}
                      checked={complaintType === type.id}
                      onChange={() => setComplaintType(type.id)}
                      className="mt-1 text-error focus:ring-error h-4 w-4"
                    />
                    <div>
                      <div className="text-sm font-bold text-on-surface">{type.label}</div>
                      <div className="text-[11px] text-secondary mt-0.5">{type.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
                Explain in your own language (English / Urdu / Roman Urdu)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Masla bayan karein... For example: 'Zubair ne pipe repair kiya par abhi bhi pani leak ho rha hai aur usne extra paise liye.'"
                className="w-full p-4 rounded-xl border border-white/50 bg-white/80 focus:ring-2 focus:ring-error/20 focus:border-error text-sm"
                rows={4}
                disabled={loading}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl text-white font-bold transition-all active:scale-98 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(180deg, #ba1a1a 0%, #93000a 100%)',
                boxShadow: '0 8px 24px rgba(186,26,26,0.25)',
              }}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  AI Analysing Dispute...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">gavel</span>
                  Submit for AI Arbitration
                </>
              )}
            </button>
          </form>
        ) : (
          /* Dispute Result / Resolution Card */
          <div className="space-y-6 animate-enter">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-error/10 text-error">
                <span className="material-symbols-outlined text-[32px]">gavel</span>
              </div>
              <h2 className="text-2xl font-bold text-on-surface">AI Arbitration Decision</h2>
              <p className="text-sm text-secondary mt-1">Our autonomous agent has ruled on your claim.</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl ambient-shadow space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-surface-container-high">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Classification</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-error-container text-on-error-container uppercase">
                  {result.dispute_type.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">AI Proposed Resolution</h4>
                  <p className="text-base font-semibold text-primary mt-1">{result.resolution}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">Escrow Adjustment</h4>
                  <p className="text-sm font-semibold text-on-surface mt-1">
                    {result.refund_pct > 0 ? `${result.refund_pct}% refund credited to your wallet.` : 'No refund required.'}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-secondary">Arbitration Confidence Score</span>
                  <span className="text-sm font-bold text-on-surface">{Math.round(result.confidence * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-2">
              <button
                onClick={onResolved}
                className="w-full py-4 rounded-xl text-white font-bold transition-all active:scale-98 premium-btn"
              >
                Close Claim & Return Home
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
