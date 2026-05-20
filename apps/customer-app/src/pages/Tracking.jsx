/* Live Booking Tracking Screen — KhidmatAI
   Simulates full booking state lifecycle: MATCHED -> CONFIRMED -> EN_ROUTE -> IN_PROGRESS -> COMPLETED
   Provides standard user status indicator, provider info, and simulated developer control for demo speed. */
import React, { useState, useEffect } from 'react';

const STATES = [
  { status: 'MATCHED', label: 'Expert Matched', desc: 'KhidmatAI has matched you with top choice.', icon: 'manage_search' },
  { status: 'PENDING_CONFIRMATION', label: 'Awaiting Confirm', desc: 'Sending request to expert.', icon: 'contact_mail' },
  { status: 'CONFIRMED', label: 'Booking Confirmed', desc: 'Expert Zubair has accepted the slot!', icon: 'thumb_up' },
  { status: 'EN_ROUTE', label: 'Expert En Route', desc: 'Zubair is traveling to your location.', icon: 'directions_car' },
  { status: 'IN_PROGRESS', label: 'Job In Progress', desc: 'Service is being performed.', icon: 'handyman' },
  { status: 'COMPLETED', label: 'Service Completed', desc: 'Job finished successfully!', icon: 'task_alt' }
];

export default function Tracking({ bookingId, sessionData, selectedProvider, onDispute, onComplete }) {
  const [stateIndex, setStateIndex] = useState(0);
  const [autoSimulate, setAutoSimulate] = useState(true);

  const providerName = selectedProvider?.provider_name || "Zubair Ahmed";
  const rate = selectedProvider?.base_rate_pkr || 2500;
  const service = sessionData?.parsed_intent?.service_type || "service";

  // Simulate lifecycle transitions automatically over time for demo
  useEffect(() => {
    if (!autoSimulate) return;
    if (stateIndex >= STATES.length - 1) return;

    const interval = setTimeout(() => {
      setStateIndex(prev => prev + 1);
    }, 4500); // Transitions every 4.5 seconds

    return () => clearTimeout(interval);
  }, [stateIndex, autoSimulate]);

  const currentState = STATES[stateIndex];

  const handleNextStep = () => {
    if (stateIndex < STATES.length - 1) {
      setStateIndex(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (stateIndex > 0) {
      setStateIndex(prev => prev - 1);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 h-16"
              style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 16px rgba(0,75,36,0.06)' }}>
        <h1 style={{ fontSize: '17px', fontWeight: 600, color: '#004b24' }}>Track Service</h1>
        <div className="text-xs font-bold px-2 py-0.5 rounded bg-primary-fixed/20 text-primary">
          ID: {bookingId.slice(0,8)}
        </div>
      </header>

      <main className="pt-20 pb-24 px-5 max-w-2xl mx-auto w-full space-y-5">
        
        {/* Main Status Panel */}
        <div className="glass-panel p-5 rounded-2xl ambient-shadow text-center relative overflow-hidden">
          {/* Subtle top indicator */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary pulse-glow" />
          
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
               style={{ background: 'rgba(0,75,36,0.08)' }}>
            <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              {currentState.icon}
            </span>
          </div>

          <h2 className="text-xl font-bold text-on-surface">{currentState.label}</h2>
          <p className="text-sm text-secondary mt-1">{currentState.desc}</p>
          
          {currentState.status === 'EN_ROUTE' && (
            <div className="mt-4 p-3 bg-primary-fixed/20 rounded-xl flex items-center justify-center gap-2 text-primary font-bold text-sm">
              <span className="material-symbols-outlined animate-bounce">location_on</span>
              Arriving in ~15 mins
            </div>
          )}

          {currentState.status === 'COMPLETED' && (
            <button
              onClick={onComplete}
              className="mt-4 px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-all active:scale-95 premium-btn"
            >
              Finish & Give Feedback
            </button>
          )}
        </div>

        {/* Stepper Timeline */}
        <div className="glass-panel p-5 rounded-2xl ambient-shadow space-y-4">
          <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">Service Steps</h3>
          
          <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-surface-container-high">
            {STATES.map((step, idx) => {
              const isPast = idx < stateIndex;
              const isCurrent = idx === stateIndex;
              
              return (
                <div key={step.status} className="relative flex items-start gap-4">
                  {/* Step Node */}
                  <div className={`absolute -left-6 mt-1 w-3 h-3 rounded-full border-2 border-surface transition-all duration-300 ${
                    isCurrent ? 'bg-primary scale-125' : (isPast ? 'bg-primary' : 'bg-surface-variant')
                  }`} style={{
                    boxShadow: isCurrent ? '0 0 10px rgba(0,75,36,0.6)' : 'none'
                  }} />

                  <div className="flex-grow">
                    <h4 className={`text-sm font-bold ${isCurrent ? 'text-primary' : (isPast ? 'text-on-surface' : 'text-outline')}`}>
                      {step.label}
                    </h4>
                    {isCurrent && <p className="text-xs text-secondary mt-0.5">{step.desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Provider details */}
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 ambient-shadow">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-primary text-white">
            {providerName.charAt(0)}
          </div>
          <div className="flex-grow">
            <h4 className="text-sm font-bold">{providerName}</h4>
            <p className="text-xs text-secondary mt-0.5">Contact via WhatsApp at +92-300-1234567</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-sm font-bold text-primary">PKR {rate}</div>
            <div className="text-[10px] text-secondary">Pay on finish</div>
          </div>
        </div>

        {/* Development / Presentation Stepper Controls */}
        <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container-high space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-secondary tracking-wider uppercase">Demo State Simulator</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSimulate}
                onChange={(e) => setAutoSimulate(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
              />
              <span className="text-xs font-medium text-on-surface">Auto Progress</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevStep}
              disabled={stateIndex === 0}
              className="flex-grow py-2 rounded-lg text-xs font-semibold bg-surface-container text-on-surface disabled:opacity-40"
            >
              ← Back State
            </button>
            <button
              onClick={handleNextStep}
              disabled={stateIndex === STATES.length - 1}
              className="flex-grow py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
              style={{ background: '#004b24' }}
            >
              Next State →
            </button>
          </div>
        </div>

        {/* Dispute Button */}
        <div className="pt-2 text-center">
          <button
            onClick={() => onDispute(bookingId)}
            className="text-xs text-error font-semibold hover:underline flex items-center justify-center gap-1 mx-auto"
          >
            <span className="material-symbols-outlined text-sm">report_problem</span>
            Have an issue? Raise a Dispute
          </button>
        </div>

      </main>
    </div>
  );
}
