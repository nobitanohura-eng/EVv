import { useState, useEffect } from "react";
import { User, Save, Terminal } from "lucide-react";
import { motion } from "motion/react";

export default function Persona() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        const p = data.find((d: any) => d.key === 'system_prompt')?.value;
        if (p) setPrompt(p);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'system_prompt', value: prompt })
    });
    setSaving(false);
  };

  return (
    <div className="space-y-8 font-mono">
      <div className="border-b border-cyan-500/20 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-widest uppercase holo-text flex items-center gap-3">
            <User className="w-8 h-8" />
            E.V. Persona Core
          </h2>
          <p className="text-cyan-500/70 mt-2 uppercase text-sm tracking-wider">Behavioral Matrix and Tone Configuration</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-xl p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-4 border-b border-cyan-500/20 pb-4">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold uppercase tracking-widest text-cyan-300">System Directives</h3>
        </div>
        
        <div className="mb-6 text-sm text-cyan-500/80 leading-relaxed max-w-3xl">
          <p>Configure the foundational personality rules for E.V. Define linguistic patterns (e.g., Hinglish), constraints, and response behaviors. E.V. is programmed to be calm, confident, and brief.</p>
        </div>

        {loading ? (
          <div className="animate-pulse h-48 bg-cyan-950/30 rounded-lg border border-cyan-500/20"></div>
        ) : (
          <div className="relative group">
            <div className="absolute inset-0 bg-cyan-400/5 blur-[2px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-64 px-4 py-4 bg-cyan-950/40 border border-cyan-500/40 text-cyan-100 rounded-lg focus:outline-none focus:border-cyan-300 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] resize-none font-mono text-sm placeholder-cyan-800 leading-relaxed relative z-10"
              placeholder="System directives..."
            />
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-950/50 text-cyan-300 border border-cyan-500/50 rounded hover:bg-cyan-900/80 transition-all uppercase tracking-widest text-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 font-bold"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Compiling...' : 'Save Directives'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
