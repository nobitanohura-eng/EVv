import { useState, useEffect, FormEvent } from "react";
import { LogIn, Phone, KeyRound, ShieldAlert, LogOut, Network, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

export default function TelegramLogin() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"initial" | "phone" | "code" | "password" | "connected">("initial");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/telegram/status')
      .then(res => res.json())
      .then(data => {
        if (data.isAuthenticated) {
          setStep("connected");
        } else {
          setStep("phone");
        }
      })
      .catch(e => {
        console.error(e);
        setStep("phone");
      });
  }, []);

  const requestLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/telegram/start-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStep("code");
    } catch (e: any) {
      setError(e.message || "Failed to establish initial handshake");
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/telegram/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setTimeout(async () => {
        const statusRes = await fetch('/api/telegram/status');
        const statusData = await statusRes.json();
        if (statusData.isAuthenticated) {
          setStep("connected");
        } else {
          setStep("password");
        }
        setLoading(false);
      }, 3000);
    } catch (e: any) {
      setError(e.message || "Decryption signature rejected");
      setLoading(false);
    }
  };

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/telegram/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setTimeout(async () => {
        const statusRes = await fetch('/api/telegram/status');
        const statusData = await statusRes.json();
        if (statusData.isAuthenticated) {
          setStep("connected");
        } else {
          setError("Link failed post-authentication");
        }
        setLoading(false);
      }, 3000);
    } catch (e: any) {
      setError(e.message || "Invalid security clearance");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/telegram/logout', { method: 'POST' });
      setStep("phone");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (step === "initial") {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center font-mono text-cyan-400 gap-4">
        <Activity className="w-8 h-8 animate-pulse" />
        <span className="uppercase tracking-widest text-sm">Probing MTProto Subsystems...</span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 font-mono">
      <div className="text-center mb-8 flex flex-col items-center">
        <Network className="w-12 h-12 text-cyan-400 mb-4 opacity-80" />
        <h2 className="text-2xl font-bold tracking-widest uppercase holo-text">Secure Uplink</h2>
        <p className="text-cyan-500/70 mt-2 text-sm uppercase tracking-wider">Initialize Telegram MTProto Protocol</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel rounded-xl p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-950 via-cyan-400 to-cyan-950" />
        
        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/50 text-red-400 rounded-lg flex items-center gap-3 text-sm shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span className="uppercase tracking-wider text-xs">{error}</span>
          </div>
        )}

        {step === "connected" && (
          <div className="text-center space-y-8 py-4">
            <div className="mx-auto w-24 h-24 bg-cyan-950/60 border border-cyan-500/50 rounded-full flex items-center justify-center shadow-[inset_0_0_20px_rgba(6,182,212,0.3),0_0_30px_rgba(6,182,212,0.2)] relative">
              <div className="absolute inset-0 rounded-full border border-cyan-400 animate-ping opacity-20" />
              <LogIn className="w-10 h-10 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-cyan-300 uppercase tracking-widest holo-text">Link Established</h3>
              <p className="text-xs text-cyan-500/80 mt-2 uppercase tracking-wider">Secure channel active</p>
            </div>
            <div className="pt-6 flex flex-col gap-4 border-t border-cyan-500/20">
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 bg-cyan-950/50 text-cyan-300 border border-cyan-500/40 rounded hover:bg-cyan-900/60 transition-all uppercase tracking-widest text-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] font-bold"
              >
                Return to Core
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 bg-red-950/30 border border-red-500/30 text-red-400 rounded hover:bg-red-900/50 transition-all uppercase tracking-widest text-sm disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                Sever Connection
              </button>
            </div>
          </div>
        )}

        {step === "phone" && (
          <form onSubmit={requestLogin} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-cyan-400 mb-2">Target Identifier (Phone)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-cyan-600" />
                </div>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="block w-full pl-12 pr-4 py-3 bg-cyan-950/40 border border-cyan-500/40 text-cyan-100 rounded focus:outline-none focus:border-cyan-300 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] font-mono tracking-wider"
                />
              </div>
              <p className="mt-3 text-xs text-cyan-500/60 uppercase tracking-wider leading-relaxed">International format required. A cryptographic token will be sent to the linked Telegram client.</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 rounded hover:bg-cyan-900 transition-all uppercase tracking-widest text-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 font-bold"
            >
              {loading ? 'Transmitting...' : 'Request Uplink'}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={submitCode} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-cyan-400 mb-2">Cryptographic Token</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-cyan-600" />
                </div>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="12345"
                  className="block w-full pl-12 pr-4 py-3 bg-cyan-950/40 border border-cyan-500/40 text-cyan-100 rounded focus:outline-none focus:border-cyan-300 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] font-mono tracking-widest text-lg"
                />
              </div>
              <p className="mt-3 text-xs text-cyan-500/60 uppercase tracking-wider leading-relaxed">Enter the 5-digit verification sequence.</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 rounded hover:bg-cyan-900 transition-all uppercase tracking-widest text-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 font-bold"
            >
              {loading ? 'Decrypting...' : 'Verify Signature'}
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={submitPassword} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-cyan-400 mb-2">2FA Security Clearance</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-cyan-600" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-12 pr-4 py-3 bg-cyan-950/40 border border-cyan-500/40 text-cyan-100 rounded focus:outline-none focus:border-cyan-300 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] font-mono tracking-wider"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 rounded hover:bg-cyan-900 transition-all uppercase tracking-widest text-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 font-bold"
            >
              {loading ? 'Authorizing...' : 'Submit Clearance'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
