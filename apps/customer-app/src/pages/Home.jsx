/* AI Chat Home — KhidmatAI
   Ported from stitch_khidmatai_premium_ai_orchestrator/ai_chat_home/code.html
   Users type their service request in any language. AI processes it. */
import React, { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';

// Component Imports
import ChatTab from './ChatTab';
import ProfileTab from './ProfileTab';
import BookingsTab from './BookingsTab';

// Asset Imports
import genieMascot from '../assets/hero.png';

const QUICK_CHIPS = [
  { icon: 'plumbing',             label: 'Find a Plumber',   sub: 'Starting Rs.500',  query: 'bhai plummer chahye abhi ghr ka pipe leak ho rha hai' },
  { icon: 'ac_unit',              label: 'AC Repair',        sub: 'Starting Rs.800',  query: 'AC bilkul kaam nahi kar raha, technician chahiye' },
  { icon: 'cleaning_services',    label: 'Deep Cleaning',    sub: 'Starting Rs.1000', query: 'ghar ki complete safai chahiye kal subah' },
  { icon: 'electrical_services',  label: 'Electrician',      sub: 'Starting Rs.500',  query: 'bijli ka masla hai wiring theek karni hai' },
];

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function Home({ profile, onLogout, onSubmit, loading, activeBookings = [], onTrackBooking }) {
  const [activeTab, setActiveTab] = useState('home');
  const [input, setInput] = useState('');
  const [city, setCity] = useState('Hyderabad, Sindh');
  const [isListening, setIsListening] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [language, setLanguage] = useState('ur'); // 'en' or 'ur'

  // Load saved city and preferences
  useEffect(() => {
    const loadSavedPrefs = async () => {
      try {
        const { value: savedCity } = await Preferences.get({ key: 'saved_city' });
        if (savedCity) setCity(savedCity);

        const { value: savedLang } = await Preferences.get({ key: 'saved_lang' });
        if (savedLang) setLanguage(savedLang);
      } catch (e) {
        console.error("Error loading preferences", e);
      }
    };
    loadSavedPrefs();
  }, []);

  const handleLocationTap = async () => {
    try {
      const perm = await Geolocation.requestPermissions();
      if (perm.location === 'granted') {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true
        });
        const { latitude, longitude } = position.coords;
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
          headers: { 'Accept-Language': 'en' }
        });
        const data = await response.json();
        const resolvedCity = data.address.city || data.address.town || data.address.village || data.address.suburb || "Hyderabad";
        const resolvedState = data.address.state || "Sindh";
        const fullLocation = `${resolvedCity}, ${resolvedState}`;
        
        setCity(fullLocation);
        await Preferences.set({ key: 'saved_city', value: fullLocation });
      } else {
        alert("Location permission is required.");
      }
    } catch (err) {
      console.error("Location error", err);
      alert("Location maloom karne mein masla hua.");
    }
  };

  const handleSpeech = async () => {
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported on this browser.");
      return;
    }

    try {
      // Explicitly request microphone permission from webview
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.warn("Microphone access denied:", err);
      alert("Microphone access is required for voice input.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ur-PK';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error", e);
      if (e.error === 'language-not-supported') {
        recognition.lang = 'en-US';
        recognition.start();
      } else {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  const handleSubmit = (text) => {
    const t = text || input;
    if (!t.trim()) return;
    onSubmit(t.trim());
    setInput('');
  };

  const handleLanguageToggle = async (lang) => {
    setLanguage(lang);
    await Preferences.set({ key: 'saved_lang', value: lang });
  };

  // Render proper view based on active bottom tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'bookings':
        return <BookingsTab profile={profile} activeBookings={activeBookings} onTrackBooking={onTrackBooking} />;
      case 'chat':
        return <ChatTab profile={profile} onBookService={(serviceType) => onSubmit(`Need a ${serviceType} service`)} />;
      case 'profile':
        return <ProfileTab profile={profile} />;
      case 'home':
      default:
        return (
          <>
            {/* Location Chip */}
            <div className="fixed top-16 left-0 right-0 z-40 flex justify-center py-2 pointer-events-none">
              <button
                onClick={handleLocationTap}
                className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 bg-white/90 border border-white/50 backdrop-blur-md rounded-full shadow-sm text-xs font-semibold text-primary hover:bg-white active:scale-95 transition-all"
              >
                <span>📍 {city} ▼</span>
              </button>
            </div>

            {/* Main content scroll area */}
            <main className="flex-grow flex flex-col items-center justify-start px-4 pt-24 pb-48 relative z-10 w-full max-w-2xl mx-auto overflow-y-auto">
              {/* Welcome Section */}
              <div className="text-center mb-6 w-full mt-2">
                {!loading ? (
                  <>
                    <img src={genieMascot} className="animate-float h-20 sm:h-24 w-auto mx-auto mb-3 object-contain" alt="Genie Mascot" />
                    <h2 className="ai-gradient-text text-xl sm:text-2xl font-bold leading-7 sm:leading-8 mb-1 px-2">
                      Salaam! Boliye, kya khidmat karun?
                    </h2>
                    <p className="text-gray-600 text-xs sm:text-sm font-medium">How can I help you today?</p>
                    <p className="text-gray-500 text-xs mt-0.5 font-medium" dir="rtl">
                      آج میں آپ کی کیا مدد کر سکتا ہوں؟
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#004b24]/10">
                      <span className="material-symbols-outlined pulse-glow text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        auto_awesome
                      </span>
                    </div>
                    <p className="ai-gradient-text text-md font-bold">
                      KhidmatAI soch raha hai...
                    </p>
                    <p className="text-gray-500 text-xs">Finding the best provider for you</p>
                  </div>
                )}
              </div>

              {/* Service Cards / Quick Chips */}
              {!loading && (
                <div className="grid grid-cols-2 gap-3 w-full mb-8">
                  {QUICK_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => handleSubmit(chip.query)}
                      className="flex flex-col items-start gap-2 p-3.5 text-left group transition-all duration-200 active:scale-95 hover:bg-white hover:shadow-md border border-white/50 hover:border-primary/20 rounded-2xl bg-white/70 backdrop-blur-md shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 group-hover:bg-[#004b24]/10 transition-colors"
                           style={{ color: '#004b24' }}>
                        <span className="material-symbols-outlined text-[18px]">{chip.icon}</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-800 leading-tight">{chip.label}</div>
                        <div className="text-[9px] text-gray-600 mt-1 uppercase tracking-wider font-semibold">{chip.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </main>

            {/* Fixed Bottom Input Bar */}
            <div className="fixed bottom-20 left-0 right-0 px-4 z-40 flex flex-col items-center pointer-events-none">
              <div className="w-full max-w-2xl h-1 rounded-full opacity-60 mb-2 ai-glow-wave" />
              <div className="w-full max-w-2xl flex items-center px-3.5 h-14 rounded-full shadow-md pointer-events-auto bg-white/90 backdrop-blur-md border border-white/50">
                <button 
                  onClick={() => setActiveTab('chat')} 
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-gray-500 hover:bg-black/5 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
                <input
                  type="text"
                  className="flex-grow w-0 min-w-0 bg-transparent border-none outline-none h-full py-2 px-2 text-[14px] text-[#1a1c1e] focus:ring-0 focus:outline-none"
                  placeholder="Ask KhidmatAI... (اردو بھی ٹائپ کریں)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  onFocus={() => setActiveTab('chat')}
                  disabled={loading}
                />
                <button 
                  onClick={handleSpeech}
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-[#004b24] hover:bg-black/5'}`}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isListening ? 'mic_active' : 'mic'}
                  </span>
                </button>
                <button
                  onClick={() => handleSubmit()}
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-40 bg-gradient-to-b from-[#004b24] to-[#006633] text-white shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-2 opacity-70 tracking-wide text-center">
                KhidmatAI can make mistakes. Verify important info.
              </p>
            </div>
          </>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface relative overflow-hidden pb-28">
      {/* Background decorative glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full pointer-events-none"
           style={{ background: 'rgba(159,246,180,0.15)', filter: 'blur(100px)', zIndex: 0 }} />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full pointer-events-none"
           style={{ background: 'rgba(255,224,136,0.08)', filter: 'blur(120px)', zIndex: 0 }} />

      {/* Fixed Top App Bar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 h-16 bg-white/75 backdrop-blur-md border-b border-white/30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-[#004b24] to-[#006633]">
            <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <h1 className="text-xl font-bold ai-gradient-text">KhidmatAI</h1>
        </div>
        <button 
          onClick={() => setShowProfileDrawer(true)} 
          className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#004b24]/20 hover:border-primary active:scale-95 transition-all flex items-center justify-center text-sm font-bold bg-primary text-white"
        >
          {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
        </button>
      </header>

      {/* Tab content view */}
      {renderTabContent()}

      {/* Global Bottom Navigation */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 flex justify-around items-center h-16 bg-white/80 backdrop-blur-md border border-white/50 rounded-full shadow-lg">
        {[
          { icon: 'home_app_logo', label: 'Home', tab: 'home' },
          { icon: 'event_note', label: 'Bookings', tab: 'bookings' },
          { icon: 'auto_awesome', label: 'AI Chat', tab: 'chat' },
          { icon: 'person', label: 'Profile', tab: 'profile' },
        ].map(({ icon, label, tab }) => {
          const active = activeTab === tab;
          return (
            <button 
              key={label}
              onClick={() => setActiveTab(tab)}
              className="flex flex-col items-center justify-center px-4 py-2 rounded-full transition-all active:scale-90"
              style={active ? { background: 'rgba(0,75,36,0.1)' } : {}}
            >
              <span className="material-symbols-outlined text-[22px]"
                    style={{ color: active ? '#004b24' : '#57605d', fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                {icon}
              </span>
              <span className="text-[10px] mt-0.5"
                    style={{ color: active ? '#004b24' : '#57605d', fontWeight: active ? 700 : 400 }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Top-Right Avatar Profile Bottom Sheet Drawer */}
      {showProfileDrawer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setShowProfileDrawer(false)} />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl p-6 shadow-2xl space-y-5 animate-slide-up max-h-[85vh] overflow-y-auto z-10">
            {/* Grabber */}
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto" />
            
            <div className="flex justify-between items-center">
              <h3 className="text-md font-bold text-gray-800">Quick Settings / ترتیبات</h3>
              <button 
                onClick={() => setShowProfileDrawer(false)} 
                className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">{profile?.name || 'Anonymous'}</h4>
                <p className="text-xs text-gray-500">{profile?.phone || 'No phone'}</p>
              </div>
            </div>

            {/* Language Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase">App Language / زبان</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleLanguageToggle('ur')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${language === 'ur' ? 'border-[#004b24] bg-[#004b24]/5 text-[#004b24]' : 'border-gray-100 bg-gray-50 text-gray-500'}`}
                >
                  اردو (Urdu)
                </button>
                <button
                  onClick={() => handleLanguageToggle('en')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${language === 'en' ? 'border-[#004b24] bg-[#004b24]/5 text-[#004b24]' : 'border-gray-100 bg-gray-50 text-gray-500'}`}
                >
                  English
                </button>
              </div>
            </div>

            {/* My Addresses */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase">My Addresses / میرے پتے</label>
              <div className="p-3 border border-gray-100 rounded-xl bg-gray-50 flex items-start gap-2">
                <span className="material-symbols-outlined text-gray-500 text-sm mt-0.5">location_on</span>
                <div>
                  <p className="text-xs font-bold text-gray-800">Home (گھر)</p>
                  <p className="text-[10px] text-gray-500">Flat 302, Phase 6, Defence, Hyderabad, Sindh</p>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button 
              onClick={onLogout}
              className="w-full py-3 border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Logout / لاگ آؤٹ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
