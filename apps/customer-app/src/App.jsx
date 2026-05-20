/* KhidmatAI Customer App — Main SPA Controller
   Coordinates Splash -> Home (AI Chat) -> Matching -> Scheduling -> Booking -> Tracking -> Dispute */
import React, { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import api from './api';

// Pages
import Splash from './pages/Splash';
import Home from './pages/Home';
import Matching from './pages/Matching';
import Scheduling from './pages/Scheduling';
import Booking from './pages/Booking';
import Tracking from './pages/Tracking';
import Dispute from './pages/Dispute';

// Asset Imports
import genieMascot from './assets/hero.png';

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data State
  const [sessionData, setSessionData] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingId, setBookingId] = useState('');

  // User Profile States
  const [profile, setProfile] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Load saved user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { value: savedName } = await Preferences.get({ key: 'user_name' });
        const { value: savedPhone } = await Preferences.get({ key: 'user_phone' });
        if (savedName && savedPhone) {
          setProfile({ name: savedName, phone: savedPhone });
        } else {
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error("Preferences load error:", err);
      }
    };
    loadProfile();
  }, []);

  // 1. Splash finished
  const handleSplashDone = () => {
    setScreen('home');
  };

  // 2. Submit AI service request
  const handleSearch = async (text) => {
    setError('');
    setLoading(true);
    try {
      const resp = await api.submitRequest({
        rawInput: text,
        userId: profile?.phone || "DEMO-USER",
        locationLabel: "Islamabad"
      });
      setSessionData(resp);
      
      // If clarification needed, handle gracefully
      if (resp.clarification_needed && !resp.ranked_providers?.length) {
        setError(resp.clarification_question || "Please provide more details.");
      } else {
        setScreen('matching');
      }
    } catch (err) {
      console.error(err);
      setError('Aap ki request process karne mein masla hua. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. User selects a provider
  const handleSelectProvider = (provider) => {
    setSelectedProvider(provider);
    setScreen('scheduling');
  };

  // 4. User selects a slot
  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setScreen('booking');
  };

  // 5. User confirms final booking
  const handleConfirmBooking = async (bId) => {
    setBookingId(bId);
    setScreen('tracking');
    
    try {
      await fetch("https://khidmat-backend-1083893144498.us-central1.run.app/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bId,
          service: selectedProvider?.specialization || sessionData?.parsed_intent?.service_type || "AC Repair",
          price: (selectedProvider?.base_rate_pkr || 2500) + 250,
          customerName: profile?.name || "New Customer",
          customerPhone: profile?.phone || "+92 300 0000000",
          slotTime: selectedSlot?.time || "04:00 PM",
          city: sessionData?.location_label || "Karachi",
          isEmergency: false
        })
      });
    } catch (err) {
      console.warn("Failed to register booking in Express backend:", err);
    }
  };

  // 6. User raises a dispute during tracking
  const handleRaiseDispute = () => {
    setScreen('dispute');
  };

  // 7. Reset all flows
  const handleReset = () => {
    setSessionData(null);
    setSelectedProvider(null);
    setSelectedSlot(null);
    setBookingId('');
    setError('');
    setScreen('home');
  };

  // Onboarding registration form (shown first time before using the app)
  if (showOnboarding) {
    return (
      <div className="flex flex-col min-h-screen bg-surface justify-center items-center px-6 relative overflow-hidden">
        {/* Background decorative glows */}
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full pointer-events-none"
             style={{ background: 'rgba(159,246,180,0.2)', filter: 'blur(100px)', zIndex: 0 }} />
        <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full pointer-events-none"
             style={{ background: 'rgba(255,224,136,0.12)', filter: 'blur(120px)', zIndex: 0 }} />

        <div className="w-full max-w-md p-6 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl z-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-[#004b24] to-[#006633] mx-auto text-white shadow-lg animate-float">
            <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div>
            <h2 className="ai-gradient-text text-2xl font-bold">Khush Aamdeed! (خوش آمدید)</h2>
            <p className="text-gray-600 text-sm mt-1">Please set up your profile to start ordering services</p>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const name = e.target.name.value.trim();
            const phone = e.target.phone.value.trim();
            if (!name || !phone) return;
            
            try {
              await Preferences.set({ key: 'user_name', value: name });
              await Preferences.set({ key: 'user_phone', value: phone });
              setProfile({ name, phone });
              setShowOnboarding(false);
            } catch (err) {
              console.error(err);
            }
          }} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Full Name / پورا نام</label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Ali Khan"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm bg-white/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Phone Number / فون نمبر</label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="e.g. +92 300 1234567"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm bg-white/50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl text-white font-bold bg-gradient-to-b from-[#004b24] to-[#006633] shadow-md transition-all active:scale-98 text-sm mt-2"
            >
              Start Using KhidmatAI / شروع کریں →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render current screen
  return (
    <div className="flex-grow flex flex-col min-h-screen">
      {error && screen === 'home' && (
        <div className="fixed top-20 left-4 right-4 z-50 p-4 bg-error-container text-on-error-container text-xs rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="font-bold underline">Dismiss</button>
        </div>
      )}

      {screen === 'splash' && (
        <Splash onDone={handleSplashDone} />
      )}
      
      {screen === 'home' && (
        <Home 
          profile={profile}
          onLogout={async () => {
            await Preferences.remove({ key: 'user_name' });
            await Preferences.remove({ key: 'user_phone' });
            setProfile(null);
            setShowOnboarding(true);
            setScreen('home');
          }}
          onSubmit={handleSearch} 
          loading={loading} 
          activeBookings={bookingId ? [{ id: bookingId, service: selectedProvider?.specialization || "Service Appointment", price: `PKR ${((selectedProvider?.base_rate_pkr || 2500) + 250).toLocaleString()}` }] : []}
          onTrackBooking={(id) => {
            setBookingId(id);
            setScreen('tracking');
          }}
        />
      )}
      
      {screen === 'matching' && (
        <Matching
          sessionData={sessionData}
          onBook={handleSelectProvider}
          onBack={handleReset}
        />
      )}
      
      {screen === 'scheduling' && (
        <Scheduling
          sessionData={sessionData}
          selectedProvider={selectedProvider}
          onConfirm={handleSelectSlot}
          onBack={() => setScreen('matching')}
        />
      )}
      
      {screen === 'booking' && (
        <Booking
          sessionData={sessionData}
          selectedProvider={selectedProvider}
          selectedSlot={selectedSlot}
          onProceed={handleConfirmBooking}
          onBack={() => setScreen('scheduling')}
        />
      )}
      
      {screen === 'tracking' && (
        <Tracking
          bookingId={bookingId}
          sessionData={sessionData}
          selectedProvider={selectedProvider}
          onDispute={handleRaiseDispute}
          onComplete={handleReset}
        />
      )}
      
      {screen === 'dispute' && (
        <Dispute
          sessionId={sessionData?.session_id}
          bookingId={bookingId}
          selectedProvider={selectedProvider}
          onResolved={handleReset}
          onBack={() => setScreen('tracking')}
        />
      )}
    </div>
  );
}
