/* KhidmatAI Orchestration & Observability Dashboard
   Sleek obsidian theme split-screen interface displaying live multi-agent traces in real time. */
import React, { useState, useEffect } from 'react';
import api from './api';

const AGENT_COLORS = {
  intentparsingagent: { border: 'border-neon-green/40', text: 'text-neon-green', bg: 'bg-neon-green/10', icon: 'translate', model: 'llama-3.3-70b' },
  providerdiscoveryagent: { border: 'border-neon-blue/40', text: 'text-neon-blue', bg: 'bg-neon-blue/10', icon: 'database', model: 'SQL query (local)' },
  rankingagent: { border: 'border-neon-purple/40', text: 'text-neon-purple', bg: 'bg-neon-purple/10', icon: 'sort', model: 'qwen3-235b' },
  pricingagent: { border: 'border-neon-yellow/40', text: 'text-neon-yellow', bg: 'bg-neon-yellow/10', icon: 'payments', model: 'fast-utility' },
  schedulingagent: { border: 'border-neon-blue/40', text: 'text-neon-blue', bg: 'bg-neon-blue/10', icon: 'schedule', model: 'lfm2.5-1.2b-thinking' },
  bookingagent: { border: 'border-neon-green/40', text: 'text-neon-green', bg: 'bg-neon-green/10', icon: 'book', model: 'State Machine' },
  notificationagent: { border: 'border-white/20', text: 'text-white', bg: 'bg-white/5', icon: 'notifications', model: 'SMS gateway' },
  disputeagent: { border: 'border-neon-red/40', text: 'text-neon-red', bg: 'bg-neon-red/10', icon: 'gavel', model: 'hermes-3-405b' },
  supervisor: { border: 'border-neon-green/40', text: 'text-neon-green', bg: 'bg-neon-green/10', icon: 'auto_awesome', model: 'Pipeline Root' }
};

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(3000); // 3 sec default
  const [pollingActive, setPollingActive] = useState(true);

  // Poll list of sessions
  useEffect(() => {
    if (!pollingActive) return;
    
    const loadList = async () => {
      try {
        const resp = await api.fetchSessions(40);
        setSessions(resp.sessions || []);
        
        // Select the first one by default if nothing is selected
        if (resp.sessions?.length > 0 && !selectedSessionId) {
          setSelectedSessionId(resp.sessions[0].session_id);
        }
      } catch (err) {
        console.error("Failed to load sessions:", err);
      }
    };

    loadList();
    const t = setInterval(loadList, refreshInterval);
    return () => clearInterval(t);
  }, [pollingActive, refreshInterval, selectedSessionId]);

  // Load selected session trace detail
  useEffect(() => {
    if (!selectedSessionId) return;

    const loadDetail = async () => {
      try {
        const data = await api.fetchSessionDetails(selectedSessionId);
        setSessionDetail(data);
      } catch (err) {
        console.error("Failed to load session details:", err);
      }
    };

    loadDetail();
    const t = setInterval(loadDetail, refreshInterval);
    return () => clearInterval(t);
  }, [selectedSessionId, refreshInterval]);

  const handleSelectSession = (id) => {
    setSelectedSessionId(id);
    setSessionDetail(null); // loader trigger
  };

  return (
    <div className="min-h-screen flex flex-col bg-obsidian text-slate-100">
      
      {/* Top Navbar */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-cyber-border bg-cyber-panel backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-neon-green/10 border border-neon-green/30 cyber-glow-green">
            <span className="material-symbols-outlined text-neon-green text-xl font-bold animate-pulse">monitoring</span>
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight text-white flex items-center gap-2">
              KhidmatAI <span className="text-[10px] text-neon-green bg-neon-green/10 border border-neon-green/20 px-1.5 py-0.5 rounded font-mono font-normal">ORCHESTRATOR V1.0</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Multi-Agent Observability Dashboard</p>
          </div>
        </div>

        {/* Polling / Refresh Control */}
        <div className="flex items-center gap-3 text-xs bg-slate-900/50 p-1.5 rounded-lg border border-cyber-border">
          <button
            onClick={() => setPollingActive(!pollingActive)}
            className={`px-3 py-1 rounded font-bold transition-all ${
              pollingActive ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-slate-800 text-slate-400 border border-transparent'
            }`}
          >
            {pollingActive ? '● Live Polling' : '○ Paused'}
          </button>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="bg-transparent border-none focus:ring-0 text-slate-300 py-0.5 pr-8 pl-1 text-xs cursor-pointer font-semibold"
          >
            <option value={1000} className="bg-obsidian">1s interval</option>
            <option value={3000} className="bg-obsidian">3s interval</option>
            <option value={5000} className="bg-obsidian">5s interval</option>
          </select>
        </div>
      </header>

      {/* Split Pane Grid */}
      <div className="flex-grow grid grid-cols-12 overflow-hidden h-[calc(100vh-64px)]">
        
        {/* Left Panel: Session Feed */}
        <aside className="col-span-4 border-r border-cyber-border flex flex-col overflow-hidden bg-cyber-panel/30">
          <div className="p-4 border-b border-cyber-border flex justify-between items-center flex-shrink-0">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">feed</span>
              Active Agent Sessions ({sessions.length})
            </h2>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-2">
            {sessions.length > 0 ? (
              sessions.map((s) => {
                const isSelected = s.session_id === selectedSessionId;
                const statusColor = s.status === 'completed' ? 'text-neon-green bg-neon-green/10' : 
                                    (s.status === 'failed' ? 'text-neon-red bg-neon-red/10' : 'text-neon-yellow bg-neon-yellow/10');
                
                return (
                  <button
                    key={s.session_id}
                    onClick={() => handleSelectSession(s.session_id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col gap-2 ${
                      isSelected
                        ? 'border-neon-green/30 bg-cyber-panel/80 shadow-[0_4px_16px_rgba(0,255,102,0.05)]'
                        : 'border-cyber-border bg-cyber-panel/20 hover:border-slate-700 hover:bg-cyber-panel/40'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-mono text-xs text-neon-blue font-bold tracking-tight">
                        ID: {s.session_id.slice(0, 8)}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${statusColor}`}>
                        {s.status}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-white truncate text-ellipsis">
                      "{s.raw_input}"
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1 capitalize">
                        <span className="material-symbols-outlined text-[13px] text-neon-yellow">home_repair_service</span>
                        {s.service_type.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-cyber-border">
                        Conf: {Math.round(s.confidence * 100)}%
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm gap-2">
                <span className="material-symbols-outlined text-[36px] animate-spin">sync</span>
                Awaiting active customer app sessions...
              </div>
            )}
          </div>
        </aside>

        {/* Right Panel: High-Fidelity Trace Observer */}
        <main className="col-span-8 flex flex-col overflow-hidden bg-obsidian">
          {sessionDetail ? (
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Session Summary Header */}
              <section className="p-5 border-b border-cyber-border bg-cyber-panel/40 flex-shrink-0 flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-mono">Trace Stream</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-900 border border-cyber-border font-mono text-neon-blue">
                      Session: {sessionDetail.session_id}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1.5">
                    "{sessionDetail.raw_input}"
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 capitalize flex items-center gap-1 font-semibold">
                    Service: {sessionDetail.service_type.replace(/_/g, ' ')} • Assigned Provider: {sessionDetail.provider_name || "None"}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400 font-mono">Matched Booking</div>
                  <div className="text-sm font-mono text-neon-green font-bold tracking-wider mt-1">
                    {sessionDetail.booking_id || "AWAITING_MATCH"}
                  </div>
                </div>
              </section>

              {/* Dynamic Agent Flow Timeline */}
              <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6">
                
                {/* Agent Sequence Title */}
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4 font-mono">
                  <span className="material-symbols-outlined text-[16px] text-neon-green">network_node</span>
                  Plan-Execute-Verify Multi-Agent Execution Log
                </h3>

                {/* Step List */}
                <div className="space-y-4">
                  {sessionDetail.trace_log?.map((step, idx) => {
                    const agentKey = step.agent?.toLowerCase() || 'supervisor';
                    const token = AGENT_COLORS[agentKey] || AGENT_COLORS.supervisor;
                    const duration = step.duration_ms ? `${Math.round(step.duration_ms)}ms` : '';
                    
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border ${token.border} bg-cyber-panel/20 flex flex-col gap-3 relative transition-all hover:bg-cyber-panel/40`}
                      >
                        {/* Glowing left strip */}
                        <div className={`absolute inset-y-0 left-0 w-1 rounded-l-xl ${token.bg}`} />
                        
                        {/* Upper row: Agent title + duration */}
                        <div className="flex justify-between items-center pl-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${token.bg} border ${token.border}`}>
                              <span className="material-symbols-outlined text-[14px] text-white">{token.icon}</span>
                            </div>
                            <span className="text-sm font-bold text-white tracking-wide font-mono">
                              {step.agent}
                            </span>
                            <span className="text-[10px] bg-slate-900 border border-cyber-border px-2 py-0.5 rounded font-mono font-medium text-slate-400">
                              routed via {token.model}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 font-mono text-xs font-semibold text-slate-400">
                            <span>{duration}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              step.status === 'completed' ? 'text-neon-green bg-neon-green/10' :
                              (step.status === 'failed' ? 'text-neon-red bg-neon-red/10' : 'text-neon-yellow bg-neon-yellow/10')
                            }`}>
                              {step.status}
                            </span>
                          </div>
                        </div>

                        {/* Reasoning / Execution Summary */}
                        {step.reasoning && (
                          <div className="pl-8 text-sm text-slate-300 leading-relaxed font-semibold">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1 font-mono">Reasoning Trace</span>
                            "{step.reasoning}"
                          </div>
                        )}

                        {/* Decision Schema block */}
                        {step.decision && Object.keys(step.decision).length > 0 && (
                          <div className="pl-8 space-y-1">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block font-mono">Structured Decision payload</span>
                            <pre className="p-3 bg-slate-950/80 border border-cyber-border rounded-lg text-xs font-mono text-neon-green overflow-x-auto max-h-48 custom-scrollbar">
                              {JSON.stringify(step.decision, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>

            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
              <span className="material-symbols-outlined text-[48px] animate-pulse">troubleshoot</span>
              Select a customer session to inspect agentic traces live.
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
