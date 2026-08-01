import { useState, useEffect } from "react";
import { Brain, Trash2, RefreshCw, Database } from "lucide-react";
import { motion } from "motion/react";

type Memory = {
  id: number;
  contact_id: number;
  contact_name: string;
  memory: string;
  importance: number;
  created_at: number;
};

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/memories');
      const data = await res.json();
      setMemories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const deleteMemory = async (id: number) => {
    if (!confirm("Purge this memory fragment?")) return;
    try {
      await fetch(`/api/memories/${id}`, { method: 'DELETE' });
      fetchMemories();
    } catch (e) {
      console.error(e);
    }
  };

  const clearAll = async () => {
    if (!confirm("CRITICAL WARNING: Are you sure you want to format ALL localized memory? This cannot be undone.")) return;
    try {
      await fetch('/api/memories', { method: 'DELETE' });
      fetchMemories();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 font-mono">
      <div className="border-b border-cyan-500/20 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-widest uppercase holo-text flex items-center gap-3">
            <Database className="w-8 h-8" />
            Memory Subsystem
          </h2>
          <p className="text-cyan-500/70 mt-2 uppercase text-sm tracking-wider">Localized Context and Relationship Matrices</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchMemories}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-950/50 text-cyan-300 border border-cyan-500/40 rounded hover:bg-cyan-900/60 transition-all uppercase tracking-wider text-xs hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </button>
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-950/30 text-red-400 border border-red-500/30 rounded hover:bg-red-900/50 transition-all uppercase tracking-wider text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Format All
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/20 via-cyan-400/50 to-cyan-500/20" />
        <div className="divide-y divide-cyan-500/10">
          {memories.length === 0 && !loading ? (
            <div className="p-12 text-center text-cyan-500/50 uppercase tracking-widest text-sm flex flex-col items-center">
              <Brain className="w-8 h-8 mb-4 opacity-50" />
              Memory matrix empty. No fragments found.
            </div>
          ) : (
            memories.map(memory => (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={memory.id} 
                className="p-4 md:p-6 flex gap-4 hover:bg-cyan-900/20 transition-colors items-center justify-between group"
              >
                <div className="flex gap-4 items-start">
                  <div className="mt-1">
                    <div className="w-10 h-10 rounded bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]">
                      <Brain className="w-5 h-5 text-cyan-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="font-bold tracking-wider text-cyan-100 uppercase">
                        {memory.contact_name}
                      </span>
                      <span className="text-xs text-cyan-500/70 uppercase tracking-widest">
                        [{new Date(memory.created_at).toLocaleString()}]
                      </span>
                    </div>
                    <p className="text-sm text-cyan-300/90 leading-relaxed font-sans">{memory.memory}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteMemory(memory.id)}
                  className="p-2 text-cyan-700 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
