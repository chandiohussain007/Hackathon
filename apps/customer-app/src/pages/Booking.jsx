/* Booking Confirmation Screen — KhidmatAI
   Shows final pricing details, booking ID, provider summary, and leads to tracking. */
import React, { useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';

export default function Booking({ sessionData, selectedProvider, selectedSlot, onProceed, onBack }) {
  const [isEmergency, setIsEmergency] = useState(false);
  
  const providerName = selectedProvider?.provider_name || "Zubair Ahmed";
  const rate = selectedProvider?.base_rate_pkr || 2500;
  const slotTime = selectedSlot?.time || "4:00 PM";
  
  // Dynamic breakdown estimation
  const platformFee = 250;
  const emergencyFee = isEmergency ? 200 : 0;
  const totalAmount = rate + platformFee + emergencyFee;
  const bookingId = sessionData?.booking_id || `BKG-${Math.random().toString(36).substring(3, 9).toUpperCase()}`;

  const handleTrackBooking = async () => {
    // Schedule 24hr local notification
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "KhidmatAI Follow-up (سروس فالو اپ)",
            body: "Assalam-o-Alaikum! Aap ki plumbing service kaisi rahi? Apna feedback lazmi share karein.",
            id: 24,
            schedule: { at: new Date(Date.now() + 24 * 60 * 60 * 1000) } // 24 hours from now
          }
        ]
      });
    } catch (e) {
      console.warn("Could not schedule local notification", e);
    }
    
    // Proceed
    onProceed(bookingId);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 h-16"
              style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 16px rgba(0,75,36,0.06)' }}>
        <h1 className="text-[17px] font-bold text-primary mx-auto">Confirm Booking / بکنگ کی تصدیق</h1>
      </header>

      <main className="pt-20 pb-8 px-5 max-w-2xl mx-auto w-full space-y-6">
        
        {/* Animated Checkmark and Status */}
        <div className="flex flex-col items-center justify-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-primary text-white mb-4 shadow-lg animate-float"
               style={{ background: 'linear-gradient(135deg, #004b24, #006633)' }}>
            <span className="material-symbols-outlined text-[44px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="text-2xl font-bold text-primary">Appointment Reserved!</h2>
          <p className="text-secondary text-sm mt-1">Booking ID: <strong className="text-on-surface font-semibold">{bookingId}</strong></p>
          <span className="mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-primary-fixed/20 text-primary uppercase">
            MATCHED & RESERVED
          </span>
        </div>

        {/* Provider Brief */}
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 ambient-shadow bg-white/70 border border-white/50 shadow-sm">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold bg-primary text-white">
            {providerName.charAt(0)}
          </div>
          <div className="flex-grow">
            <h3 className="text-md font-bold text-on-surface">{providerName}</h3>
            <p className="text-xs text-secondary mt-0.5">Master Technician • 98% Rating</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-primary font-semibold">
              <span className="material-symbols-outlined text-sm">schedule</span>
              Scheduled for {isEmergency ? "Emergency (Within 1 hour)" : slotTime} (Today)
            </div>
          </div>
        </div>

        {/* Emergency Toggle */}
        <div className="glass-panel p-4 rounded-2xl flex items-center justify-between shadow-sm bg-red-50/70 border border-red-200">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-600 text-2xl animate-pulse">emergency</span>
            <div>
              <h4 className="text-sm font-bold text-red-900">Emergency Dispatch (فوری سروس)</h4>
              <p className="text-xs text-red-700">Need expert within 1 hour? (+PKR 200)</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={isEmergency} 
              onChange={(e) => setIsEmergency(e.target.checked)} 
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        {/* Transparent Pricing Breakdown */}
        <section className="glass-panel p-5 rounded-2xl ambient-shadow bg-white/70 border border-white/50 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Transparent Pricing (شفاف ریٹس)</h3>
          
          <div className="space-y-2 text-sm text-on-surface-variant">
            <div className="flex justify-between">
              <span>Service Base Rate (بنیادی ریٹ)</span>
              <span>PKR {rate.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee (پلیٹ فارم فیس)</span>
              <span>PKR {platformFee.toLocaleString()}</span>
            </div>
            {isEmergency && (
              <div className="flex justify-between text-red-600 font-semibold">
                <span>Emergency Surcharge (ایمرجنسی فیس)</span>
                <span>PKR {emergencyFee.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-gray-200 my-2 pt-2 flex justify-between font-bold text-on-surface text-base">
              <span>Total Estimated Amount (کل رقم)</span>
              <span className="text-primary">PKR {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-[11px] text-secondary bg-surface-container-low p-3 rounded-lg flex items-start gap-2">
            <span className="material-symbols-outlined text-sm text-primary">info</span>
            <span>No advance payment needed. Pay directly via JazzCash, EasyPaisa, or Cash to the expert upon service completion.</span>
          </div>
        </section>

        {/* Next Steps */}
        <div className="pt-4 space-y-3">
          <button
            onClick={handleTrackBooking}
            className="w-full py-4 rounded-xl text-white font-bold transition-all active:scale-98 premium-btn bg-gradient-to-b from-[#004b24] to-[#006633] shadow-md"
          >
            Track Booking Status →
          </button>
          
          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl font-semibold bg-gray-100 text-on-surface hover:bg-gray-200 transition-colors"
          >
            Modify Schedule / شیڈول تبدیل کریں
          </button>
        </div>

      </main>
    </div>
  );
}
