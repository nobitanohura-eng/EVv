import { useEffect, useState, useRef } from "react";
import { Power, CheckCircle, XCircle, Cpu, Activity, BrainCircuit, Network, ShieldCheck, BarChart, Server, Radio, Database } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Terminal } from "../components/Terminal";

const SYSTEM_LOGS = [
  "Running diagnostic sweep...",
  "Calibrating optical sensors...",
  "Updating neural pathways...",
  "Syncing with global time servers...",
  "Defragmenting localized memory...",
  "Optimizing token throughput...",
  "Securing network protocols...",
  "Monitoring ambient frequencies...",
];

function SystemClock() {
  const [time, setTime] = useState(new Date());
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const start = Date.now() - performance.now();
    const timer = setInterval(() => {
      setTime(new Date());
      setUptime(Date.now() - start);
    }, 47);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden md:flex flex-col items-end text-[10px] tracking-widest font-mono">
      <div className="text-cyan-300">SYS.T: {time.toISOString().split('T')[1].replace('Z', '')}</div>
      <div className="text-cyan-600">UPT.MS: {uptime.toString().padStart(10, '0')}</div>
    </div>
  );
}

export default function Home() {
  const [status, setStatus] = useState({
    isAuthenticated: false,
    hasSessionSaved: false,
    autoReplyEnabled: false
  });
  
  const [metrics, setMetrics] = useState({
    messagesSent: 0,
    messagesSentToday: 0,
    dailyLimit: 1500,
    totalOutputChars: 0,
    totalInputChars: 0,
    modelUsed: "gemini-2.5-flash-lite (Free Tier)"
  });

  const [loading, setLoading] = useState(true);
  const [activeLog, setActiveLog] = useState(0);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/telegram/status');
      const data = await res.json();
      setStatus(data);
      
      const metricsRes = await fetch('/api/metrics');
      if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const logInterval = setInterval(() => {
      setActiveLog(prev => (prev + 1) % SYSTEM_LOGS.length);
    }, 4500);
    return () => clearInterval(logInterval);
  }, []);

  const toggleAutoReply = async () => {
    try {
      setLoading(true);
      await fetch('/api/telegram/toggle-auto-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !status.autoReplyEnabled })
      });
      await fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !status.hasSessionSaved) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-cyan-400">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 animate-pulse" />
          <span>Synchronizing System Core...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-mono pb-20 relative">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full space-y-8">
          <div className="border-b border-cyan-500/20 pb-6 flex items-center justify-between relative">
            <div>
              <h2 className="text-3xl font-bold tracking-widest uppercase holo-text flex items-center gap-3">
                <Cpu className="w-8 h-8" />
                E.V. System Core
              </h2>
              <p className="text-cyan-500/70 mt-2 uppercase text-sm tracking-wider">Primary Node // Enhanced Virtual Assistant</p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <SystemClock />
              <div className="flex items-center gap-2 bg-cyan-950/40 px-4 py-2 rounded-lg border border-cyan-500/30 hud-corners">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
                <span className="text-xs text-cyan-300">CORE ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Telegram Connection Module */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="holo-panel hud-corners rounded-xl p-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm uppercase tracking-widest text-cyan-300 flex items-center gap-2">
                  <Network className="w-4 h-4" />
                  Uplink Status
                </h3>
                {status.isAuthenticated ? (
                  <span className="text-xs text-cyan-400 bg-cyan-950/50 px-2 py-1 rounded border border-cyan-500/30 animate-pulse">ONLINE</span>
                ) : (
                  <span className="text-xs text-red-400 bg-red-950/50 px-2 py-1 rounded border border-red-500/30">OFFLINE</span>
                )}
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-full border ${status.isAuthenticated ? 'bg-cyan-900/30 border-cyan-500/40 text-cyan-400 holo-glow' : 'bg-red-900/30 border-red-500/40 text-red-400'}`}>
                  {status.isAuthenticated ? <ShieldCheck className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-cyan-100">
                    {status.isAuthenticated ? 'MTProto Link Established' : 'Connection Required'}
                  </p>
                  <p className="text-xs text-cyan-500/70 mt-1">
                    {status.isAuthenticated ? 'Listening for encrypted signals.' : 'System isolated.'}
                  </p>
                </div>
              </div>

              {!status.isAuthenticated && (
                <Link 
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 rounded text-sm uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                >
                  <Power className="w-4 h-4" /> Initialize Link
                </Link>
              )}
            </motion.div>

            {/* AI Auto Reply Core */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="holo-panel hud-corners rounded-xl p-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-cyan-500/5 to-transparent pointer-events-none" />
              
              <div className="flex flex-col h-full justify-between gap-4 relative z-10">
                <div>
                  <h3 className="text-sm uppercase tracking-widest text-cyan-300 mb-2 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4" />
                    Away Mode / Autonomy
                  </h3>
                  <p className="text-xs text-cyan-100/70 leading-relaxed">
                    E.V. handles incoming communications autonomously using local memory matrices and remote Gemini processing.
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-cyan-500/20 pt-4 mt-2">
                  <div className="flex flex-col">
                    <span className="text-cyan-500/70 text-[10px] tracking-widest">CURRENT PROTOCOL</span>
                    <span className={status.autoReplyEnabled ? "text-cyan-400 holo-text text-xs" : "text-neutral-500 text-xs"}>
                      {status.autoReplyEnabled ? 'ACTIVE [OVERRIDE]' : 'STANDBY'}
                    </span>
                  </div>

                  <button
                    onClick={toggleAutoReply}
                    disabled={!status.isAuthenticated || loading}
                    className={`relative w-12 h-12 flex items-center justify-center rounded-full border transition-all duration-500 ${
                      status.autoReplyEnabled 
                        ? 'border-cyan-400 bg-cyan-900/40 shadow-[0_0_20px_rgba(0,243,255,0.5)]' 
                        : 'border-cyan-800 bg-cyan-950/20'
                    } ${(!status.isAuthenticated || loading) ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-300 cursor-pointer'}`}
                  >
                    {status.autoReplyEnabled && (
                      <div className="absolute inset-0 rounded-full border border-cyan-400 animate-ping opacity-20" />
                    )}
                    <Power className={`w-5 h-5 ${status.autoReplyEnabled ? 'text-cyan-300' : 'text-cyan-700'}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Animated Diagnostics terminal */}
          <div className="holo-panel hud-corners rounded border-l-2 border-cyan-500 p-4 font-mono text-xs overflow-hidden h-24 relative">
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[var(--color-ev-dark)] to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[var(--color-ev-dark)] to-transparent z-10" />
            
            <div className="flex flex-col justify-center h-full relative z-0">
               <AnimatePresence mode="popLayout">
                 <motion.div
                    key={activeLog}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-cyan-400 flex items-center gap-2"
                 >
                    <span className="text-cyan-700">{">"}</span> {SYSTEM_LOGS[activeLog]}
                 </motion.div>
               </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right side Arc Core Graphic */}
        <div className="hidden lg:flex flex-col items-center justify-center w-[400px] flex-shrink-0 relative">
           <div className="relative w-64 h-64 flex items-center justify-center mb-8">
              {/* Core Rings */}
              <div className="absolute inset-0 border-2 border-dashed border-cyan-800 rounded-full arc-ring-3" />
              <div className="absolute inset-2 border border-cyan-600/50 rounded-full arc-ring-2" />
              <div className="absolute inset-4 border-4 border-t-cyan-400 border-r-transparent border-b-cyan-600 border-l-transparent rounded-full arc-ring-1 opacity-70 holo-glow" />
              <div className="absolute inset-8 border border-cyan-500/30 rounded-full arc-ring-2" />
              
              {/* Center Core */}
              <div className="absolute inset-[30%] bg-cyan-900/40 rounded-full backdrop-blur-sm border border-cyan-400/50 holo-glow flex items-center justify-center z-10">
                 <BrainCircuit className="w-10 h-10 text-cyan-300 animate-pulse" />
              </div>
              
              {/* Outer decorative elements */}
              <div className="absolute -inset-4 border border-cyan-900/30 rounded-full" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full holo-glow" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full holo-glow" />
              <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-700 rounded-full" />
              <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-700 rounded-full" />
           </div>
           
           {/* System Radar */}
           <div className="flex flex-col items-center justify-center mb-8 gap-3">
              <div className="w-16 h-16 radar-bg border border-cyan-500/30 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
                 <div className="radar-sweep" />
              </div>
              <span className="text-[9px] text-cyan-500/50 uppercase tracking-widest">Threat Scan</span>
           </div>
           
           {/* Acoustic Visualizer */}
           <div className="flex flex-col items-center justify-center mb-8 h-12">
              <div className="flex items-end justify-center gap-[3px] h-6">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="audio-bar"
                    style={{ 
                      animationDelay: `${Math.random() * 0.8}s`, 
                      animationDuration: `${0.8 + Math.random() * 0.5}s`,
                      height: `${10 + Math.random() * 14}px` 
                    }}
                  />
                ))}
              </div>
              <span className="text-[9px] text-cyan-500/50 mt-3 uppercase tracking-widest">Acoustic Processor</span>
           </div>
           
           <div className="w-full grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center gap-1">
                 <Server className="w-4 h-4 text-cyan-600" />
                 <span className="text-[10px] text-cyan-500/70 tracking-widest">HOST</span>
                 <span className="text-xs text-cyan-300">RAILWAY.APP</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                 <Radio className="w-4 h-4 text-cyan-600" />
                 <span className="text-[10px] text-cyan-500/70 tracking-widest">PING</span>
                 <span className="text-xs text-cyan-300">14ms</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                 <Database className="w-4 h-4 text-cyan-600" />
                 <span className="text-[10px] text-cyan-500/70 tracking-widest">MEMORY</span>
                 <span className="text-xs text-cyan-300">SQLITE (LOCAL)</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                 <Cpu className="w-4 h-4 text-cyan-600" />
                 <span className="text-[10px] text-cyan-500/70 tracking-widest">ENGINE</span>
                 <span className="text-xs text-cyan-300">GEMINI PRO</span>
              </div>
           </div>
        </div>
      </div>

      {/* System Modules Grid */}
      <div className="grid gap-4 md:grid-cols-4 mt-6">
        {[
          { label: 'Gemini Core', status: 'ONLINE', icon: BrainCircuit },
          { label: 'Memory DB', status: 'LOCAL', icon: Activity },
          { label: 'Whitelists', status: 'ACTIVE', icon: ShieldCheck },
          { label: 'Task Engine', status: 'V1.0', icon: Cpu }
        ].map((module, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + (i * 0.05) }}
            className="holo-panel p-4 rounded-lg flex flex-col gap-2 border-l-2 border-l-cyan-500/50"
          >
            <module.icon className="w-5 h-5 text-cyan-500/50 mb-1" />
            <h4 className="text-[10px] uppercase tracking-widest text-cyan-300/80">{module.label}</h4>
            <span className="text-xs font-semibold text-cyan-400">{module.status}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="holo-panel hud-corners rounded-xl p-6 relative overflow-hidden h-full"
          >
              <div className="flex items-center justify-between mb-6 border-b border-cyan-500/20 pb-4">
                  <div className="flex items-center gap-2">
                      <BarChart className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-sm uppercase tracking-widest text-cyan-300">System Analytics & Quota Usage</h3>
                  </div>
                  <div className="text-[10px] text-cyan-500 bg-cyan-950/30 px-3 py-1 rounded border border-cyan-500/20 uppercase tracking-widest">
                      MODEL: <span className="text-cyan-300">{metrics.modelUsed}</span>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-cyan-950/40 rounded border border-cyan-500/20 relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-16 h-16 bg-cyan-500/10 blur-[20px]" />
                      <p className="text-[10px] text-cyan-500 uppercase tracking-widest mb-1 relative z-10">Total Sent</p>
                      <p className="text-3xl font-bold holo-text relative z-10">{metrics.messagesSent} <span className="text-sm text-cyan-500 font-normal">msgs</span></p>
                  </div>
                  <div className="p-4 bg-cyan-950/40 rounded border border-cyan-500/20 relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-16 h-16 bg-cyan-500/10 blur-[20px]" />
                      <p className="text-[10px] text-cyan-500 uppercase tracking-widest mb-1 relative z-10">Today's Usage</p>
                      <p className="text-3xl font-bold holo-text relative z-10">{metrics.messagesSentToday} <span className="text-sm text-cyan-500 font-normal">/ {metrics.dailyLimit}</span></p>
                      <div className="w-full bg-cyan-950/50 h-1 mt-3 rounded overflow-hidden relative z-10">
                          <div className="bg-cyan-400 h-full shadow-[0_0_8px_#00f3ff]" style={{ width: `${Math.min(100, (metrics.messagesSentToday / metrics.dailyLimit) * 100)}%` }} />
                      </div>
                      <p className="text-[9px] text-cyan-500/70 mt-2 uppercase tracking-widest relative z-10">{metrics.dailyLimit - metrics.messagesSentToday} remaining today</p>
                  </div>
                  <div className="p-4 bg-cyan-950/40 rounded border border-cyan-500/20 relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-16 h-16 bg-cyan-500/10 blur-[20px]" />
                      <p className="text-[10px] text-cyan-500 uppercase tracking-widest mb-1 relative z-10">Output Tokens</p>
                      <p className="text-3xl font-bold holo-text relative z-10">~{Math.floor(metrics.totalOutputChars / 4)} <span className="text-sm text-cyan-500 font-normal">est.</span></p>
                      <p className="text-[9px] text-cyan-500/70 mt-2 uppercase tracking-widest relative z-10">Total: {metrics.totalOutputChars} chars</p>
                  </div>
                  <div className="p-4 bg-cyan-950/40 rounded border border-cyan-500/20 relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-16 h-16 bg-cyan-500/10 blur-[20px]" />
                      <p className="text-[10px] text-cyan-500 uppercase tracking-widest mb-1 relative z-10">Input Tokens</p>
                      <p className="text-3xl font-bold holo-text relative z-10">~{Math.floor(metrics.totalInputChars / 4)} <span className="text-sm text-cyan-500 font-normal">est.</span></p>
                      <p className="text-[9px] text-cyan-500/70 mt-2 uppercase tracking-widest relative z-10">Total: {metrics.totalInputChars} chars</p>
                  </div>
              </div>
              
              <div className="mt-6 p-3 bg-cyan-900/10 border border-cyan-500/10 rounded text-[10px] text-cyan-500/60 leading-relaxed uppercase tracking-widest">
                  // The system is currently utilizing the generous Free Tier limits of the Gemini API. Output responses are configured to be highly concise, preserving maximum token quota for prolonged active operation.
              </div>
          </motion.div>
        </div>
        <div className="lg:col-span-1">
          <Terminal />
        </div>
      </div>
    </div>
  );
}
