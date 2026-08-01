import { useState, useEffect } from "react";
import { ScrollText, RefreshCw, MessageCircle, Bot, Activity } from "lucide-react";
import { motion } from "motion/react";

type Log = {
  id: number;
  contact_id: number;
  contact_name: string;
  role: string;
  message: string;
  timestamp: number;
};

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-8 font-mono">
      <div className="border-b border-cyan-500/20 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-widest uppercase holo-text flex items-center gap-3">
            <Activity className="w-8 h-8" />
            System Activity Logs
          </h2>
          <p className="text-cyan-500/70 mt-2 uppercase text-sm tracking-wider">E.V. Automated Communication Records</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-950/50 text-cyan-300 border border-cyan-500/40 rounded hover:bg-cyan-900/60 transition-all uppercase tracking-wider text-xs hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Pull Latest Logs
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/20 via-cyan-400/50 to-cyan-500/20" />
        <div className="divide-y divide-cyan-500/10 max-h-[70vh] overflow-y-auto">
          {logs.length === 0 && !loading ? (
            <div className="p-12 text-center text-cyan-500/50 uppercase tracking-widest text-sm flex flex-col items-center">
              <ScrollText className="w-8 h-8 mb-4 opacity-50" />
              No activity recorded in system logs.
            </div>
          ) : (
            logs.map(log => (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={log.id} 
                className={`p-4 flex gap-4 hover:bg-cyan-900/20 transition-colors ${log.role === 'assistant' ? 'bg-cyan-950/10' : ''}`}
              >
                <div className="mt-1">
                  {log.role === 'user' ? (
                    <div className="w-8 h-8 rounded bg-neutral-900 border border-neutral-700/50 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-neutral-400" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded bg-cyan-900/40 border border-cyan-500/50 flex items-center justify-center shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]">
                      <Bot className="w-4 h-4 text-cyan-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className={`font-bold uppercase tracking-wider ${log.role === 'user' ? 'text-neutral-300' : 'text-cyan-300'}`}>
                      {log.role === 'user' ? `ENTITY: ${log.contact_name}` : 'E.V. SYSTEM'}
                    </span>
                    <span className="text-xs text-cyan-500/50 uppercase tracking-widest">
                      [{new Date(log.timestamp).toLocaleString()}]
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed font-sans ${log.role === 'user' ? 'text-neutral-400' : 'text-cyan-100'}`}>
                    {log.message}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
