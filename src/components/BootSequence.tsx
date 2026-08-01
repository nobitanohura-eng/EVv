import { useState, useEffect } from "react";
import { motion } from "motion/react";

const BOOT_MESSAGES = [
  "INITIALIZING E.V. KERNEL...",
  "LOADING MEMORY SUBSYSTEMS...",
  "ESTABLISHING TELEGRAM UPLINK...",
  "LOADING AI REASONING CORE...",
  "CHECKING SYSTEM INTEGRITY...",
  "MEMORY: ONLINE",
  "AI CORE: ONLINE",
  "SYSTEM READY."
];

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [messages, setMessages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let currentIdx = 0;
    
    const interval = setInterval(() => {
      if (currentIdx < BOOT_MESSAGES.length) {
        setMessages(prev => [...prev, BOOT_MESSAGES[currentIdx]]);
        setProgress(((currentIdx + 1) / BOOT_MESSAGES.length) * 100);
        currentIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 800);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="h-screen w-screen bg-[#050508] text-cyan-400 font-mono flex flex-col items-center justify-center relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-50 opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,243,255,0.1)_50%)] bg-[length:100%_4px]" />
      
      <div className="w-full max-w-2xl p-8 flex flex-col gap-6 relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500 border-t-cyan-200 animate-spin" />
          <h1 className="text-4xl font-bold tracking-[0.2em] holo-text text-white">E.V.</h1>
        </div>

        <div className="h-48 flex flex-col gap-2 overflow-hidden justify-end">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm tracking-widest text-cyan-500"
            >
              &gt; {msg}
            </motion.div>
          ))}
        </div>

        <div className="w-full h-1 bg-cyan-950 rounded-full overflow-hidden mt-4">
          <motion.div 
            className="h-full bg-cyan-400 shadow-[0_0_10px_#00f3ff]"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </div>
    </div>
  );
}
