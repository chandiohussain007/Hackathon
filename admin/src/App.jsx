import React, { useState, useEffect } from 'react';

const TECHNICIANS = [
  { name: "Zubair Ahmed", rating: "4.9", specialty: "AC Repair" },
  { name: "Sajid Ali", rating: "4.8", specialty: "Plumbing" },
  { name: "Tanveer Shah", rating: "4.7", specialty: "Electrician" },
  { name: "Yasir Khan", rating: "4.6", specialty: "Deep Cleaning" },
  { name: "Imran Ali", rating: "4.9", specialty: "AC Repair" }
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [assignTech, setAssignTech] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, completed: 0 });

  const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://khidmat-backend-1083893144498.us-central1.run.app';

  // Fetch Bookings
  const fetchBookings = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/bookings`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
        updateStats(data);
      }
    } catch (e) {
      console.warn("Failed to fetch from backend, using mock/local bookings:", e);
      // fallback mock data
      const mockData = [
        { id: 'BKG-593A', service: 'AC Repair', customerName: 'Ali Khan', customerPhone: '+92 300 1234567', status: 'In Progress', slotTime: '4:00 PM', city: 'Hyderabad', isEmergency: false, technician: 'Zubair Ahmed', createdAt: '2026-05-12T10:00:00.000Z' },
        { id: 'BKG-112B', service: 'Plumber', customerName: 'Sara Ahmed', customerPhone: '+92 321 9876543', status: 'Done', slotTime: '11:00 AM', city: 'Karachi', isEmergency: false, technician: 'Sajid Ali', createdAt: '2026-04-28T08:30:00.000Z' },
        { id: 'BKG-883F', service: 'Deep Cleaning', customerName: 'Imran Malik', customerPhone: '+92 333 4455667', status: 'New', slotTime: 'Tomorrow 10:00 AM', city: 'Lahore', isEmergency: true, technician: '', createdAt: '2026-05-19T13:45:00.000Z' }
      ];
      setBookings(mockData);
      updateStats(mockData);
    }
  };

  const updateStats = (data) => {
    const statsObj = {
      total: data.length,
      pending: data.filter(b => b.status === 'New').length,
      active: data.filter(b => b.status === 'Assigned' || b.status === 'In Progress').length,
      completed: data.filter(b => b.status === 'Done').length
    };
    setStats(statsObj);
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchBookings();
      const interval = setInterval(fetchBookings, 8000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('Invalid username or password. (Use admin / admin123)');
    }
  };

  const updateBookingStatus = async (bookingId, newStatus, technicianName) => {
    try {
      const response = await fetch(`${backendUrl}/api/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, technician: technicianName })
      });
      if (response.ok) {
        fetchBookings();
        setSelectedBooking(null);
      }
    } catch (e) {
      // Local fallback edit
      console.warn("Backend update failed, modifying state locally", e);
      const updated = bookings.map(b => {
        if (b.id === bookingId) {
          return { 
            ...b, 
            status: newStatus || b.status, 
            technician: technicianName || b.technician 
          };
        }
        return b;
      });
      setBookings(updated);
      updateStats(updated);
      setSelectedBooking(null);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#004b24] to-[#006633] flex items-center justify-center mx-auto shadow-md">
              <span className="material-symbols-outlined text-white text-3xl font-bold">auto_awesome</span>
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-[#004b24]">KhidmatAI Admin</h2>
            <p className="mt-2 text-sm text-gray-500">Service Control Center</p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#004b24]/30 focus:border-[#004b24]"
                  placeholder="admin"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#004b24]/30 focus:border-[#004b24]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-4 px-4 bg-gradient-to-r from-[#004b24] to-[#006633] text-white font-bold rounded-xl shadow-lg hover:shadow-xl active:scale-98 transition-all"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Kanban Columns
  const COLUMNS = ['New', 'Assigned', 'In Progress', 'Done'];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-white text-[18px]">auto_awesome</span>
            </div>
            <h1 className="text-lg font-bold text-primary">KhidmatAI Control</h1>
          </div>
          <nav className="space-y-1">
            <button className="flex items-center gap-3 w-full px-4 py-3 bg-[#004b24]/5 text-primary font-bold rounded-xl">
              <span className="material-symbols-outlined">dashboard</span>
              Kanban Board
            </button>
            <button 
              onClick={() => alert("Reporting & analytics module coming soon.")}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
            >
              <span className="material-symbols-outlined">analytics</span>
              Analytics
            </button>
          </nav>
        </div>
        <div className="p-6 border-t border-gray-50">
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-grow flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <h2 className="text-md font-bold text-gray-800">Job Orchestration Dashboard</h2>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-gray-500">Live Sync Enabled</span>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-6 p-8">
          {[
            { label: 'Total Requests', val: stats.total, color: 'text-blue-600 bg-blue-50' },
            { label: 'Pending Assign', val: stats.pending, color: 'text-yellow-600 bg-yellow-50' },
            { label: 'Active Jobs', val: stats.active, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Completed Jobs', val: stats.completed, color: 'text-green-600 bg-green-50' },
          ].map((item) => (
            <div key={item.label} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{item.label}</p>
                <p className="text-3xl font-extrabold text-gray-800 mt-2">{item.val}</p>
              </div>
              <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${item.color}`}>
                #
              </span>
            </div>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="flex-grow px-8 pb-8 grid grid-cols-4 gap-6 overflow-x-auto">
          {COLUMNS.map((col) => {
            const filtered = bookings.filter(b => b.status === col);
            return (
              <div key={col} className="bg-gray-100/70 p-4 rounded-3xl flex flex-col h-[70vh] border border-gray-200/50">
                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{col}</h3>
                  <span className="text-xs bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded-full">{filtered.length}</span>
                </div>
                
                {/* Column Card List */}
                <div className="flex-grow space-y-3 overflow-y-auto pr-1">
                  {filtered.map((bkg) => (
                    <div
                      key={bkg.id}
                      onClick={() => {
                        setSelectedBooking(bkg);
                        setAssignTech(bkg.technician || '');
                      }}
                      className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200/40 hover:shadow-md hover:border-primary/20 cursor-pointer transition-all active:scale-[0.99] space-y-2 relative"
                    >
                      {bkg.isEmergency && (
                        <span className="absolute top-2 right-2 text-[9px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full uppercase animate-pulse">
                          Urgent
                        </span>
                      )}
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">{bkg.id}</h4>
                      <h3 className="text-sm font-bold text-gray-800">{bkg.service}</h3>
                      <p className="text-xs text-gray-500">Cust: {bkg.customerName}</p>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-gray-50 text-[11px]">
                        <span className="text-gray-400">{bkg.city}</span>
                        <span className="font-bold text-[#004b24]">
                          {bkg.technician ? `👤 ${bkg.technician}` : '⚠️ Unassigned'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {filtered.length === 0 && (
                    <div className="h-24 flex items-center justify-center border border-dashed border-gray-300 rounded-2xl text-xs text-gray-400">
                      Empty column
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-5 border border-gray-100 relative animate-scale-in">
            <button 
              onClick={() => setSelectedBooking(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            <h3 className="text-lg font-bold text-[#004b24]">{selectedBooking.service} Details</h3>

            <div className="space-y-3.5 text-xs text-gray-600">
              <div className="flex justify-between pb-2 border-b border-gray-50">
                <span className="font-semibold">Booking ID:</span>
                <span className="font-bold text-gray-800">{selectedBooking.id}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-50">
                <span className="font-semibold">Customer:</span>
                <span className="text-gray-800">{selectedBooking.customerName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-50">
                <span className="font-semibold">Phone:</span>
                <span className="text-gray-800">{selectedBooking.customerPhone}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-50">
                <span className="font-semibold">Location / Slot:</span>
                <span className="text-gray-800">{selectedBooking.city} ({selectedBooking.slotTime})</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-50">
                <span className="font-semibold">Type Surcharge:</span>
                <span className={selectedBooking.isEmergency ? 'text-red-600 font-bold' : 'text-gray-800'}>
                  {selectedBooking.isEmergency ? 'Emergency (+PKR 200)' : 'Regular'}
                </span>
              </div>
            </div>

            {/* Select Technician */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase">Assign Expert / ٹیکنیشن</label>
              <select
                value={assignTech}
                onChange={(e) => setAssignTech(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#004b24]/30 focus:border-[#004b24]"
              >
                <option value="">-- Choose Expert --</option>
                {TECHNICIANS.map((tech) => (
                  <option key={tech.name} value={tech.name}>
                    {tech.name} (Specialty: {tech.specialty}, Rating: {tech.rating})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Change Controls */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase">Update Progress Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'Assigned', assignTech)}
                  disabled={!assignTech}
                  className="py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  Assign Expert
                </button>
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'In Progress', assignTech)}
                  disabled={!selectedBooking.technician && !assignTech}
                  className="py-2.5 bg-yellow-500 text-white font-bold rounded-xl text-xs hover:bg-yellow-600 disabled:opacity-40 transition-colors"
                >
                  Start Progress
                </button>
              </div>
              <button
                onClick={() => updateBookingStatus(selectedBooking.id, 'Done', assignTech || selectedBooking.technician)}
                className="w-full py-3 mt-2 bg-gradient-to-r from-[#004b24] to-[#006633] text-white font-bold rounded-xl text-xs shadow hover:shadow-md transition-all"
              >
                Complete Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
