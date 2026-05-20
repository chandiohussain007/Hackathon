import React, { useState, useEffect } from 'react';

export default function ProfileTab({ profile }) {
  const [womenOnly, setWomenOnly] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch bookings dynamically from database backend and filter for this user
  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        const res = await fetch("https://khidmat-backend-1083893144498.us-central1.run.app/api/bookings");
        if (res.ok) {
          const allBookings = await res.json();
          // Filter to show ONLY completed bookings that match the current user's phone number
          const filtered = allBookings.filter(b => b.customerPhone === profile?.phone && b.status === 'Done');
          setUserBookings(filtered);
        }
      } catch (err) {
        console.error("Failed to load user bookings:", err);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.phone) {
      fetchUserBookings();
    } else {
      setLoading(false);
    }
  }, [profile]);

  return (
    <div className="flex flex-col h-full bg-surface pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full z-40 flex justify-between items-center px-5 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <h1 className="text-lg font-bold ai-gradient-text mx-auto">My Profile / میرا پروفائل</h1>
      </header>

      {/* Profile Content */}
      <div className="pt-20 px-5 max-w-2xl mx-auto w-full space-y-6 overflow-y-auto">
        
        {/* User Card */}
        <div className="bg-gradient-to-br from-[#004b24] to-[#006633] text-white p-5 rounded-2xl shadow-md flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold text-white border border-white/30">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <h2 className="text-lg font-bold">{profile?.name || 'Anonymous'}</h2>
            <p className="text-xs text-white/80">{profile?.phone || 'No phone'}</p>
            <div className="mt-2 inline-flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
              <span className="material-symbols-outlined text-[12px]">stars</span>
              Silver Member (240 Points)
            </div>
          </div>
        </div>

        {/* Women-Only technician toggle */}
        <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-purple-600 text-2xl">female</span>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Women-Only Technician</h3>
              <p className="text-xs text-gray-500">خواتین ٹیکنیشن (For safety & comfort)</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={womenOnly} 
              onChange={(e) => setWomenOnly(e.target.checked)} 
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004b24]"></div>
          </label>
        </div>

        {/* Loyalty Points Section */}
        <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Loyalty Rewards / انعامات</h3>
          <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-yellow-600">redeem</span>
              <div>
                <p className="text-xs font-bold text-yellow-900">PKR 500 Discount Coupon</p>
                <p className="text-[10px] text-yellow-700">Unlocked at 300 points</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#004b24]">60 pts left</span>
          </div>
        </div>

        {/* Booking History */}
        <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Booking History / پرانی بکنگز</h3>
          <div className="space-y-3">
            {loading ? (
              <p className="text-xs text-gray-400 text-center">Loading history...</p>
            ) : userBookings.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">No completed bookings yet.</p>
            ) : (
              userBookings.map((item) => (
                <div key={item.id} className="border-b border-gray-50 pb-3 last:border-b-0 last:pb-0 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">{item.service}</h4>
                    <p className="text-[10px] text-gray-400">{item.slotTime || 'Today'} • {item.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-800">PKR {item.price}</p>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold uppercase">Completed</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Payment Methods / طریقہ ادائیگی</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: 'JazzCash', active: true },
              { name: 'EasyPaisa', active: false },
              { name: 'COD / Cash', active: false }
            ].map((method) => (
              <div key={method.name} className={`p-3 rounded-xl border text-center cursor-pointer active:scale-95 transition-all ${method.active ? 'border-[#004b24] bg-[#004b24]/5 text-[#004b24] font-bold' : 'border-gray-100 bg-gray-50 text-gray-500'}`}>
                <p className="text-xs">{method.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Help & Support */}
        <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Support / مدد چاہیے؟</h3>
          <a 
            href="https://wa.me/923001234567" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white font-bold rounded-xl shadow active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-lg">chat</span>
            Contact via WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}
