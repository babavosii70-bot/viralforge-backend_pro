import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { Loader2, ArrowRight, Zap } from "lucide-react";

export default function Login() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isLogin) await login(email, password);
      else await register(email, password);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/5 blur-[120px] rounded-full" />
      
      <div className="w-full max-w-md z-10 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-full shadow-[0_0_40px_rgba(242,125,38,0.3)] animate-float">
             <Zap className="text-black" size={32} />
          </div>
          <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">
            Forge<span className="text-brand">Engine</span>
          </h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Autonomous Media Infrastructure</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-10 rounded-[3rem] shadow-2xl space-y-8 backdrop-blur-xl">
          <div className="space-y-2">
            <h2 className="text-3xl font-black uppercase italic">{isLogin ? "Authenticate" : "Initialize"}</h2>
            <p className="text-zinc-500 text-sm font-medium">{isLogin ? "Enter your core frequency." : "Create a new operator identity."}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
               <input 
                type="email" 
                placeholder="EMAIL_ADDRESS" 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 focus:border-brand outline-none transition-all font-mono text-sm tracking-widest"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <input 
                type="password" 
                placeholder="SECRET_KEY" 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 focus:border-brand outline-none transition-all font-mono text-sm tracking-widest"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-red-500 text-xs font-bold uppercase tracking-widest bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black font-black uppercase py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-brand transition-all active:scale-95 text-lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? "Log In" : "Register")}
              <ArrowRight size={24} />
            </button>
          </form>

          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
          >
            {isLogin ? "Switch to Registration Protocol" : "Back to Authentication"}
          </button>
        </div>
      </div>
    </div>
  );
}
