import React, { useState, useEffect } from 'react';

export default function BookingsTab({ profile, activeBookings = [], onTrackBooking }) {
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch bookings dynamically from database backend and filter for this user
  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        const res = await fetch("https://khidmat-backend-1083893144498.us-central1.run.app/api/bookings");
        if (res.ok) {
          const allBookings = await res.json();
          // Filter to show ONLY bookings that match the current user's phone number
          const filtered = allBookings.filter(b => b.customerPhone === profile?.phone);
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

  // Separate active and completed bookings
  const activeJobs = userBookings.filter(b => b.status !== 'Done');
  const pastJobs = userBookings.filter(b => b.status === 'Done');

  return (
    <div className="flex flex-col h-full bg-surface pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full z-40 flex justify-between items-center px-5 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <h1 className="text-lg font-bold ai-gradient-text mx-auto">My Bookings / میری بکنگز</h1>
      </header>

      <div className="pt-20 px-5 max-w-2xl mx-auto w-full space-y-6 overflow-y-auto">
        {/* Active Bookings */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Active Bookings / جاری بکنگز</h2>
          {loading ? (
            <div className="p-6 text-center text-xs text-gray-400">Loading bookings...</div>
          ) : activeJobs.length === 0 ? (
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm text-center">
              <span className="material-symbols-outlined text-gray-300 text-5xl">event_busy</span>
              <p className="text-sm text-gray-500 mt-2">No active bookings right now.</p>
              <p className="text-xs text-gray-400 mt-1">Koi active booking nahi hai.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs.map((bkg) => (
                <div key={bkg.id} className="bg-white border border-emerald-100 p-4 rounded-2xl shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] bg-emerald-50 text-[#004b24] font-bold px-2 py-0.5 rounded-full uppercase">
                        {bkg.status || 'Active'}
                      </span>
                      <h3 className="text-sm font-bold text-gray-800 mt-1">{bkg.service}</h3>
                      <p className="text-[10px] text-gray-400">{bkg.id} • Scheduled: {bkg.slotTime || 'Today'}</p>
                    </div>
                    <p className="text-sm font-bold text-[#004b24]">PKR {bkg.price || '1,500'}</p>
                  </div>
                  <button
                    onClick={() => onTrackBooking(bkg.id)}
                    className="w-full py-2.5 bg-gradient-to-r from-[#004b24] to-[#006633] text-white text-xs font-bold rounded-xl shadow active:scale-95 transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">location_searching</span>
                    Track Live Status / لائیو ٹریک کریں
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Past Bookings */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Past Bookings / پرانی سروسز</h2>
          {loading ? (
            <div className="p-6 text-center text-xs text-gray-400">Loading history...</div>
          ) : pastJobs.length === 0 ? (
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm text-center">
              <span className="material-symbols-outlined text-gray-300 text-5xl">history</span>
              <p className="text-sm text-gray-500 mt-2">No past bookings yet.</p>
              <p className="text-xs text-gray-400 mt-1">Koi purani booking nahi hai.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastJobs.map((item) => (
                <div key={item.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">{item.service}</h4>
                    <p className="text-[10px] text-gray-400">City: {item.city || 'Hyderabad'}</p>
                    <p className="text-[10px] text-gray-400">{item.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-800">PKR {item.price}</p>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold uppercase">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
