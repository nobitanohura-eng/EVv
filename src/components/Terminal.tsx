import React from "react";
import { useState, useRef, useEffect } from "react";
import { Terminal as TermIcon } from "lucide-react";

export function Terminal() {
  const [history, setHistory] = useState<string[]>([
    "E.V. System Terminal v1.0.4",
    "Encrypted connection established.",
    "Type 'help' for available commands."
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      const cmd = input.trim().toLowerCase();
      const newHistory = [...history, `> ${input}`];

      if (cmd === "help") {
        newHistory.push("Available commands: status, ping, clear, reboot, override");
      } else if (cmd === "status") {
        newHistory.push("All core systems operating at optimal parameters. Zero threats detected.");
      } else if (cmd === "ping") {
        newHistory.push("Pong. Uplink latency: 14ms. Signal strength: 98%.");
      } else if (cmd === "override") {
        newHistory.push("ACCESS DENIED. Biometric signature required for manual override.");
      } else if (cmd === "clear") {
        setHistory([]);
        setInput("");
        return;
      } else if (cmd === "reboot") {
        newHistory.push("Initiating soft reboot...");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        newHistory.push(`Command not recognized: ${cmd}. Type 'help'.`);
      }

      setHistory(newHistory);
      setInput("");
    }
  };

  return (
    <div className="holo-panel rounded-xl flex flex-col overflow-hidden h-full min-h-[300px] relative group">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
      
      <div className="bg-cyan-950/40 p-3 border-b border-cyan-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TermIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] text-cyan-300 uppercase tracking-widest font-bold">Manual Override Terminal</span>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-cyan-500/50" />
          <div className="w-2 h-2 rounded-full bg-cyan-500/50" />
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f3ff]" />
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs flex flex-col gap-2">
        {history.map((line, i) => (
          <div key={i} className={line.startsWith(">") ? "text-cyan-300" : "text-cyan-600"}>
            {line}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-cyan-500/20 flex items-center gap-2 bg-cyan-950/20">
        <span className="text-cyan-500 font-bold">{">"}</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleCommand}
          className="flex-1 bg-transparent border-none outline-none text-xs text-cyan-300 font-mono focus:ring-0 placeholder-cyan-800"
          placeholder="Enter command..."
          autoComplete="off"
          spellCheck="false"
        />
        <div className="terminal-cursor" />
      </div>
    </div>
  );
}
