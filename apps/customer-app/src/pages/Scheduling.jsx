/* Smart Scheduling Screen — KhidmatAI
   Ported from stitch_khidmatai_premium_ai_orchestrator/smart_scheduling/code.html */
import { useState } from 'react';

export default function Scheduling({ sessionData, selectedProvider, onConfirm, onBack }) {
  const slots = sessionData?.proposed_slots || [
    { date: "Today", time: "4:00 PM", status: "Ideal", duration: "1 hr duration" },
    { date: "Today", time: "5:30 PM", status: "Available", duration: "1 hr duration" },
    { date: "Today", time: "7:00 PM", status: "Available", duration: "1 hr duration" }
  ];

  const providerName = selectedProvider?.provider_name || "Expert";
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);

  const handleConfirm = () => {
    onConfirm(slots[selectedSlotIndex], selectedSlotIndex);
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
          <h1 style={{ fontSize: '17px', fontWeight: 600, color: '#004b24' }}>Pick a Slot</h1>
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold bg-primary text-white">
          {providerName.charAt(0)}
        </div>
      </header>

      <main className="pt-20 pb-8 px-5 max-w-2xl mx-auto w-full space-y-6">
        
        {/* Calendar Picker (Minimal representation of October 2023 from Stitch design) */}
        <section className="glass-panel p-4 rounded-2xl ambient-shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-md font-semibold text-on-surface">May 2026</h2>
            <div className="flex gap-2">
              <button className="p-1.5 rounded-full hover:bg-primary-container/20" style={{ background: '#eeeef0' }}>
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button className="p-1.5 rounded-full hover:bg-primary-container/20" style={{ background: '#eeeef0' }}>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-secondary mb-2">
            <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
            <div className="p-2 text-outline-variant opacity-35">16</div>
            <div className="p-2 text-outline-variant opacity-35">17</div>
            <button className="p-2 rounded-full bg-primary text-white font-bold shadow-[0_10px_20px_rgba(0,75,36,0.15)] relative">
              18
              <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary-fixed"></span>
            </button>
            <button className="p-2 rounded-full hover:bg-primary-container/10">19</button>
            <button className="p-2 rounded-full hover:bg-primary-container/10">20</button>
            <button className="p-2 rounded-full hover:bg-primary-container/10">21</button>
            <button className="p-2 rounded-full hover:bg-primary-container/10">22</button>
          </div>
        </section>

        {/* AI Suggestion */}
        <section className="flex items-start gap-3 p-4 rounded-xl border-l-4"
                 style={{ background: 'rgba(0,75,36,0.04)', borderColor: '#004b24' }}>
          <span className="material-symbols-outlined mt-0.5 text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <div>
            <h3 className="text-xs font-bold text-primary tracking-wider uppercase mb-1">AI Suggestion</h3>
            <p className="text-sm text-on-surface">
              Based on traffic and <strong>{providerName}'s</strong> availability, <strong className="text-primary font-semibold">Today at 4:00 PM</strong> is optimal.
            </p>
          </div>
        </section>

        {/* Slots List */}
        <section className="relative pl-6 space-y-3 before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-surface-container-high">
          {slots.map((slot, index) => {
            const isIdeal = slot.status === "Ideal" || index === 0;
            const isSelected = selectedSlotIndex === index;
            
            return (
              <div key={index} className="relative cursor-pointer" onClick={() => setSelectedSlotIndex(index)}>
                {/* Node Orb */}
                <div className={`absolute -left-6 mt-2.5 w-3 h-3 rounded-full border-2 border-surface ${
                  isSelected ? 'bg-primary scale-125' : (isIdeal ? 'bg-primary-fixed' : 'bg-surface-variant')
                }`} style={{
                  boxShadow: isSelected ? '0 0 10px rgba(0,75,36,0.5)' : (isIdeal ? '0 0 8px rgba(159,246,180,0.8)' : 'none')
                }} />

                {/* Card */}
                <div className="p-4 transition-all duration-200"
                     style={{
                       background: isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                       backdropFilter: 'blur(20px)',
                       border: isSelected ? '1px solid rgba(0,75,36,0.3)' : '1px solid rgba(255,255,255,0.4)',
                       borderRadius: '12px',
                       boxShadow: isSelected ? '0 12px 24px rgba(0,75,36,0.08)' : '0 2px 8px rgba(0,0,0,0.02)'
                     }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className={`text-lg font-bold ${isSelected || isIdeal ? 'text-primary' : 'text-on-surface'}`}>
                        {slot.time || slot.scheduled_start}
                      </div>
                      <div className="text-xs text-secondary mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {slot.duration || "1 hr duration"}
                      </div>
                    </div>
                    
                    <div>
                      {isIdeal ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary-fixed/20 text-primary uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                          Ideal
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-secondary">
                          Available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Action Button */}
        <div className="pt-4">
          <button
            onClick={handleConfirm}
            className="w-full py-4 rounded-xl text-white font-bold transition-all active:scale-98 premium-btn"
          >
            Confirm Appointment
          </button>
        </div>

      </main>
    </div>
  );
}
