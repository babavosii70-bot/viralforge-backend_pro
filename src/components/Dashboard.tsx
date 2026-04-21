import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Video, BarChart3, TrendingUp, Upload, Settings, LogOut, Loader2, CheckCircle, AlertCircle, Play, Sparkles, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../AuthContext";
import io from "socket.io-client";
import { API_URL } from "../constants";

const socket = io(API_URL);

export default function Dashboard() {
  const { user, logout, token } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchVideos();
    
    // Socket.io for Real-time Updates
    socket.on("connect", () => console.log("Socket connected"));
    socket.onAny((event, data) => {
      if (event.startsWith("video:")) {
        if (event.endsWith(":progress")) {
           const vidId = event.split(":")[1];
           setVideos(prev => prev.map(v => v.id === vidId ? { ...v, progress: data.progress, status: "PROCESSING" } : v));
        } else {
           fetchVideos();
        }
      }
    });

    return () => {
      socket.offAny();
    };
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/videos`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setVideos(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("video", e.target.files[0]);

    try {
      await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      fetchVideos();
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white font-sans selection:bg-brand selection:text-black">
      {/* Cinematic Sidebar */}
      <aside className="w-20 lg:w-64 border-r border-zinc-900 flex flex-col items-center lg:items-start p-6 gap-12 bg-zinc-950">
        <div className="flex items-center gap-3 lg:px-2">
           <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center animate-pulse">
              <TrendingUp className="text-black" size={24} />
           </div>
           <span className="hidden lg:block text-2xl font-black italic tracking-tighter uppercase">ForgeEngine</span>
        </div>

        <nav className="flex-1 w-full space-y-4">
          <NavItem icon={<Video size={20} />} label="Library" active />
          <NavItem icon={<BarChart3 size={20} />} label="Analytics" />
          <NavItem icon={<Sparkles size={20} />} label="Optimize" />
          <NavItem icon={<Settings size={20} />} label="Settings" />
        </nav>

        <button onClick={logout} className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 text-zinc-500 hover:bg-zinc-900 rounded-2xl transition-all">
          <LogOut size={20} />
          <span className="hidden lg:block font-bold uppercase tracking-widest text-xs">Shutdown</span>
        </button>
      </aside>

      {/* Main Grid */}
      <main className="flex-1 p-6 md:p-12 space-y-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Command Center</h1>
            <p className="text-zinc-500 font-medium">Operator: {user?.email} <span className="ml-2 px-2 py-0.5 bg-zinc-800 rounded-full text-[10px] tracking-widest uppercase">{user?.role}</span></p>
          </div>
          
          <label className="flex items-center gap-4 bg-white text-black font-black px-8 py-4 rounded-3xl cursor-pointer hover:bg-zinc-200 transition-all active:scale-95 shadow-2xl">
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
            <span className="uppercase tracking-widest">Deploy Asset</span>
            <input type="file" className="hidden" accept="video/*" onChange={handleUpload} />
          </label>
        </header>

        {/* Forge Control Center (Autonomous) */}
        <section className="bg-gradient-to-br from-zinc-900 to-black border border-brand/20 rounded-[3rem] p-10 relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-brand">
                 <Zap size={24} className="fill-current" />
                 <h2 className="text-2xl font-black uppercase tracking-tighter italic">Autonomous Forge</h2>
              </div>
              <p className="text-zinc-500 max-w-md font-medium">
                Autonomous system active. Targeting <span className="text-white font-black">200 videos/day</span>. 
                Generate custom AI batches on-demand below.
              </p>
            </div>

            <div className="flex w-full md:w-auto items-center gap-4 bg-zinc-900/50 p-3 rounded-[2rem] border border-zinc-800">
               <input 
                 type="text" 
                 id="topic-input"
                 placeholder="Forge Topic (e.g., Cyberpunk City)" 
                 className="bg-transparent px-6 py-3 text-white font-bold placeholder:text-zinc-700 outline-none w-full md:w-64"
               />
               <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={async () => {
                    const input = document.getElementById('topic-input') as HTMLInputElement;
                    const topic = input.value;
                    try {
                      const res = await fetch(`${API_URL}/api/forge/auto-gen`, {
                        method: "POST",
                        headers: { 
                           "Content-Type": "application/json",
                           "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ topic })
                      });
                      if (res.ok) {
                        input.value = "";
                        fetchVideos();
                      }
                    } catch (err) {}
                 }}
                 className="bg-brand text-black font-black px-10 py-5 rounded-[1.5rem] shadow-xl hover:shadow-brand/20 transition-all flex items-center gap-2 uppercase tracking-widest text-sm"
               >
                 <Sparkles size={18} />
                 Forge
               </motion.button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 blur-[120px] rounded-full -mr-32 -mt-32 animate-pulse" />
        </section>

        {/* Cinematic Dashboard Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          
          {/* Active Job Pool */}
          <section className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 border-b border-zinc-900 pb-2">Active Job Pool</h2>
            <div className="grid gap-4">
              {videos.map(v => (
                <div 
                  key={v.id} 
                  onClick={() => setSelectedVideo(v)}
                  className={`group bg-zinc-950 border p-6 rounded-[2rem] flex items-center justify-between cursor-pointer transition-all ${selectedVideo?.id === v.id ? 'border-brand' : 'border-zinc-900 hover:border-zinc-700'}`}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center group-hover:bg-brand group-hover:text-black transition-colors overflow-hidden relative">
                       {v.status === 'COMPLETED' ? <Play className="fill-current" /> : <Loader2 size={24} className={v.status === 'PROCESSING' ? 'animate-spin' : ''} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg line-clamp-1">{v.filename}</h4>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">{new Date(v.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2 ${v.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'bg-brand/10 text-brand'}`}>
                      {v.status}
                    </div>
                    {v.status === 'PROCESSING' && <div className="text-lg font-black">{v.progress}%</div>}
                  </div>
                </div>
              ))}
              {videos.length === 0 && <p className="text-zinc-600 italic">No assets detected in current sector.</p>}
            </div>
          </section>

          {/* Real Video Analytics Panel */}
          <section className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 border-b border-zinc-900 pb-2">Cinematic Retention Matrix</h2>
            <div className="bg-zinc-950 border border-zinc-900 rounded-[3rem] p-8 min-h-[400px] flex flex-col">
              {selectedVideo ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black">{selectedVideo.filename}</h3>
                        <p className="text-brand font-black uppercase tracking-widest text-sm">{selectedVideo.analytics?.views || 0} Total Engagements</p>
                    </div>
                    {selectedVideo.status === 'COMPLETED' && selectedVideo.outputPath && (
                      <a 
                        href={`${API_URL}/${selectedVideo.outputPath}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-zinc-900 hover:bg-zinc-800 text-white p-3 rounded-2xl flex items-center gap-2 transition-all border border-zinc-800"
                      >
                        <Play size={16} fill="currentColor" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Watch Render</span>
                      </a>
                    )}
                  </div>

                  {/* Video Player / Analytics Preview */}
                  {selectedVideo.status === 'COMPLETED' && selectedVideo.outputPath ? (
                    <div className="mb-8 rounded-2xl overflow-hidden border border-zinc-900 bg-black aspect-video relative group">
                      <video 
                        src={`${API_URL}/${selectedVideo.outputPath}`} 
                        controls 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ) : selectedVideo.status === 'PROCESSING' || selectedVideo.status === 'PENDING' ? (
                     <div className="mb-8 rounded-2xl border border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center aspect-video space-y-4">
                        <Loader2 className="animate-spin text-brand" size={48} />
                        <div className="text-center">
                          <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs">Forging Asset...</p>
                          <p className="text-4xl font-black italic">{selectedVideo.progress || 0}%</p>
                        </div>
                     </div>
                  ) : null}

                  <div className="flex-1 min-h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedVideo.analytics?.retention?.map((v: number, i: number) => ({ time: `${i * 3}s`, value: v })) || []}>
                        <defs>
                          <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F27D26" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#F27D26" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                        <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="value" stroke="#F27D26" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-8 p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 space-y-4">
                    <div className="flex items-center gap-2 text-brand">
                       <Sparkles size={16} />
                       <span className="text-xs font-black uppercase tracking-[0.2em]">ForgeEngine AI Suggestion</span>
                    </div>
                    <p className="text-sm text-zinc-300">"Significant drop at 6s. Shorten the transition or add a curiousity loop to increase hook retention."</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-700">
                  <BarChart3 size={64} className="mb-4 opacity-20" />
                  <p className="font-bold uppercase tracking-widest text-sm">Select an Asset for Deep Analysis</p>
                </div>
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all font-bold group ${active ? 'bg-brand text-black shadow-[0_0_20px_rgba(242,125,38,0.4)]' : 'text-zinc-500 hover:bg-zinc-900 hover:text-white'}`}>
      <span className={`${active ? 'text-black' : 'text-brand'} transition-colors`}>{icon}</span>
      <span className="hidden lg:block uppercase tracking-widest text-xs">{label}</span>
    </button>
  );
}
