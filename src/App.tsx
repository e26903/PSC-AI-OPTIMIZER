import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { 
  BarChart3, 
  Search, 
  Zap, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  ChevronRight,
  Database,
  Wind,
  Layers,
  FileText,
  Hexagon,
  Cpu,
  Monitor,
  Settings,
  Link2,
  RefreshCw,
  CheckCircle2,
  X,
  Menu
} from 'lucide-react';
import { rbrData as staticData, RBRRow } from './data/rbrData';
import { analyzePSCApproval } from './services/geminiService';
import { fetchGoogleSheetData } from './services/dataService';
import video0 from './assets/video_0.mp4';

export default function App() {
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [siteSearch, setSiteSearch] = useState('');
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RBRRow | null>(null);
  const [requestedKw, setRequestedKw] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [videoState, setVideoState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [videoError, setVideoError] = useState(false);
  const [videoDiagnostics, setVideoDiagnostics] = useState<string | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Diagnostic check and Blob loading for video asset
  useEffect(() => {
    const loadVideo = async () => {
      try {
        const response = await fetch('/video_0.mp4');
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        
        if (!response.ok) {
          setVideoDiagnostics(`Status: ${response.status} (${contentType || 'Unknown'})`);
          return;
        }

        // Successfully fetched, now create a blob for bulletproof playback
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setVideoBlobUrl(url);
        setVideoDiagnostics(`Ready: ${contentType} (${Math.round(blob.size/1024)}KB)`);
        console.log("Video blob created successfully:", url);
      } catch (err) {
        setVideoDiagnostics(`Fetch failed: ${err instanceof Error ? err.message : String(err)}`);
        console.error("Video load error", err);
      }
    };
    loadVideo();
    
    return () => {
      if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
    };
  }, []);

  // Dynamic Data Source State
  const [activeData, setActiveData] = useState<RBRRow[]>(staticData);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 1. Fetch shared config from server on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const config = await response.json();
          if (config.sheetUrl) {
            setSheetUrl(config.sheetUrl);
          }
        }
      } catch (err) {
        console.error('Failed to fetch shared config:', err);
      }
    };
    fetchConfig();
  }, []);

  // 2. Load dynamic data on mount or URL change
  useEffect(() => {
    const loadData = async () => {
      if (!sheetUrl) {
        setActiveData(staticData);
        return;
      }

      setIsDataLoading(true);
      setDataError(null);
      try {
        const remoteData = await fetchGoogleSheetData(sheetUrl);
        setActiveData(remoteData);
        
        // Persist to server so other devices see it
        await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheetUrl })
        });
      } catch (err) {
        console.error('Failed to load sheet:', err);
        setDataError('Could not sync with Google Sheet. Ensure the link share settings are "Anyone with the link can view". Fallback to static inventory active.');
        setActiveData(staticData);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadData();
  }, [sheetUrl]);

  // Derive unique site names starting with MSC
  const sites = useMemo(() => {
    try {
      if (!activeData || !Array.isArray(activeData)) return [];

      const rawSites = Array.from(new Set(
        activeData
          .filter(r => {
            if (!r || !r.siteName || typeof r.siteName !== 'string') return false;
            return r.siteName.trim().toUpperCase().startsWith('MSC');
          })
          .map(r => r.siteName.trim())
      )).sort();

      if (!siteSearch) return rawSites;

      const lowerSearch = siteSearch.toLowerCase().trim();
      return rawSites.filter((name: any) => {
        const lowerName = (name as string).toLowerCase();
        // Match the part after "MSC " (assuming "MSC " prefix)
        const suffix = lowerName.startsWith('msc ') ? lowerName.substring(4) : lowerName;
        return lowerName.includes(lowerSearch) || suffix.startsWith(lowerSearch);
      });
    } catch (err) {
      console.error('Error deriving site list:', err);
      return [];
    }
  }, [siteSearch, activeData]);

  // Filter rooms based on selected site and non-N/A supporting plant (Column K)
  const filteredRooms = useMemo(() => {
    if (!selectedSite) return [];
    return activeData.filter(r => 
      r && r.siteName && typeof r.siteName === 'string' &&
      r.siteName.trim().toUpperCase() === selectedSite.trim().toUpperCase() && 
      r.supportingPlant !== 'N/A'
    );
  }, [selectedSite, activeData]);

  const handleAnalyze = async () => {
    if (!selectedRoom || !requestedKw) return;
    setIsAnalyzing(true);
    setResult(null);
    setVideoState('playing');
    setVideoError(false);
    try {
      const analysis = await analyzePSCApproval(selectedRoom, parseFloat(requestedKw));
      setResult(analysis);
    } catch (error) {
      console.error(error);
      const errorMsg = error instanceof Error ? error.message : "Analysis failed. Please try again.";
      alert(errorMsg);
      setVideoState('idle');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <LayoutGroup>
      <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen w-full bg-[#0F172A] text-[#F8FAFC] font-sans lg:overflow-hidden select-none">
        
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-[#1E293B] border-b border-[#334155] sticky top-0 z-[60]">
          <div className="flex items-center gap-2 font-bold text-lg text-[#38BDF8]">
            <Hexagon className="w-5 h-5 fill-[#38BDF8]/20" strokeWidth={2.5} />
            PSC AI OPTIMIZER
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-[#38BDF8] hover:bg-[#334155] rounded-md transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Sidebar Layout */}
        <AnimatePresence>
          {(isMobileMenuOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
            <>
              {/* Mobile Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
              />
              
              <motion.aside 
                initial={typeof window !== 'undefined' && window.innerWidth < 1024 ? { x: -320 } : false}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={`
                  fixed lg:static inset-y-0 left-0 z-[80] 
                  w-[280px] sm:w-[320px] lg:w-[320px] 
                  bg-[#1E293B] border-r border-[#334155] p-6 
                  flex flex-col gap-6 scrollbar-hide overflow-y-auto
                  lg:translate-x-0
                `}
              >
                <div className="hidden lg:flex items-center gap-3 font-bold text-xl text-[#38BDF8] pb-6 border-b border-[#334155]">
                  <Hexagon className="w-6 h-6 fill-[#38BDF8]/20" strokeWidth={2.5} />
                  PSC AI OPTIMIZER
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.75rem] uppercase tracking-wider text-[#94A3B8] font-semibold">MCS SITE NAME</label>
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#38BDF8] z-10" />
                        <input 
                          type="text" 
                          placeholder={selectedSite?.toUpperCase() || "Search & Select Site..."}
                          className="w-full bg-[#0F172A] border border-[#334155] pl-10 pr-10 p-3 rounded-md text-[#F8FAFC] text-sm outline-none focus:ring-1 focus:ring-[#38BDF8] placeholder:text-[#F8FAFC]"
                          value={siteSearch}
                          onFocus={() => setIsSiteDropdownOpen(true)}
                          onChange={(e) => {
                            setSiteSearch(e.target.value);
                            setIsSiteDropdownOpen(true);
                          }}
                        />
                        <ChevronRight 
                          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] transition-transform duration-200 pointer-events-none ${isSiteDropdownOpen ? 'rotate-270' : 'rotate-90'}`} 
                        />
                      </div>

                      <AnimatePresence>
                        {isSiteDropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-20" 
                              onClick={() => {
                                setIsSiteDropdownOpen(false);
                                setSiteSearch('');
                              }} 
                            />
                            <motion.div 
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 4 }}
                              className="absolute left-0 right-0 top-[calc(100%+4px)] bg-[#1E293B] border border-[#334155] rounded-md shadow-2xl z-30 max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#334155]"
                            >
                              {sites.length > 0 ? (
                                sites.map(site => (
                                  <div 
                                    key={site} 
                                    className={`p-3 text-sm cursor-pointer hover:bg-[#38BDF8]/10 hover:text-[#38BDF8] border-b border-[#334155]/50 last:border-0 transition-colors ${selectedSite === site ? 'bg-[#38BDF8]/20 text-[#38BDF8] font-bold' : ''}`}
                                    onClick={() => {
                                      setSelectedSite(site);
                                      setSelectedRoom(null);
                                      setResult(null);
                                      setVideoState('idle');
                                      setRequestedKw('');
                                      setIsSiteDropdownOpen(false);
                                      setSiteSearch('');
                                    }}
                                  >
                                    {site.toUpperCase()}
                                  </div>
                                ))
                              ) : (
                                <div className="p-8 text-center text-[#94A3B8] italic text-sm">
                                  {siteSearch ? `No sites matching "${siteSearch}" found` : "No sites found in data source"}
                                </div>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[0.75rem] uppercase tracking-wider text-[#94A3B8] font-semibold">REQUESTED ROOM</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-[#0F172A] border border-[#334155] p-3 rounded-md text-[#F8FAFC] text-sm outline-none appearance-none cursor-pointer disabled:opacity-50 focus:ring-1 focus:ring-[#38BDF8]"
                        disabled={!selectedSite}
                        onChange={(e) => {
                          setSelectedRoom(filteredRooms.find(r => r.roomName === e.target.value) || null);
                          setResult(null);
                          setVideoState('idle');
                        }}
                        value={selectedRoom?.roomName || ''}
                      >
                        <option value="" disabled>Select Room...</option>
                        {filteredRooms.map(room => (
                          <option key={room.roomName} value={room.roomName}>
                            {room.roomName.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] rotate-90 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[0.75rem] uppercase tracking-wider text-[#94A3B8] font-semibold">Requested Load (kW)</label>
                    <input 
                      type="number" 
                      step="any"
                      placeholder="e.g. 0.747" 
                      className="w-full bg-[#0F172A] border border-[#334155] p-3 rounded-md text-[#F8FAFC] text-sm outline-none focus:ring-1 focus:ring-[#38BDF8]"
                      value={requestedKw}
                      onChange={(e) => setRequestedKw(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={() => {
                      handleAnalyze();
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) setIsMobileMenuOpen(false);
                    }}
                    disabled={!selectedRoom || !requestedKw || isAnalyzing}
                    className="bg-[#38BDF8] text-[#0F172A] p-3.5 rounded-md font-bold uppercase cursor-pointer hover:bg-[#38BDF8]/90 transition-all disabled:bg-[#334155] disabled:text-[#94A3B8] disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <div className="w-4 h-4 border-2 border-[#0F172A]/20 border-t-[#0F172A] rounded-full animate-spin" />
                    ) : (
                      'Analyze Approval'
                    )}
                  </button>

                  <div className="text-[0.75rem] text-[#94A3B8] leading-relaxed bg-black/20 p-3 rounded-md border border-dashed border-[#334155] mt-auto">
                    <div className="flex justify-between items-center mb-2">
                      <strong className="text-[#F8FAFC]">AI Recommendation Engine</strong>
                      <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="text-[#38BDF8] hover:text-[#38BDF8]/80 transition-colors p-1"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                    Currently running RBR v4.2 analysis against {activeData.length} site parameters.
                    {sheetUrl && (
                      <div className="flex items-center gap-1.5 mt-2 text-[0.65rem] text-[#38BDF8] font-bold">
                        <Link2 className="w-3 h-3" />
                        SYNCED TO REMOTE
                      </div>
                    )}
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-[#1E293B] border border-[#334155] rounded-xl shadow-2xl z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-[#334155] flex justify-between items-center bg-[#0F172A]/50">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-[#38BDF8]" />
                  <h2 className="font-bold text-lg">System Data Sync</h2>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 hover:bg-[#334155] rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <label className="text-[0.7rem] uppercase font-bold text-[#94A3B8] tracking-widest block">Google Sheet URL</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Paste your shared Google Sheet URL..."
                      className="w-full bg-[#0F172A] border border-[#334155] p-3 pl-10 rounded-md text-[#F8FAFC] text-sm outline-none focus:ring-1 focus:ring-[#38BDF8]"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                    />
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#38BDF8]" />
                  </div>
                  <p className="text-[0.65rem] text-[#64748B] leading-relaxed">
                    Ensure your Google Sheet is shared with **"Anyone with the link can view"**. The Genie will automatically map headers to site parameters.
                  </p>
                </div>

                <div className="bg-[#0F172A] p-5 rounded-lg border border-[#334155] space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[0.7rem] uppercase font-bold text-[#94A3B8]">Sync Profile</span>
                    {isDataLoading ? (
                      <div className="flex items-center gap-2 text-[#F59E0B] text-[0.7rem] font-bold">
                        <RefreshCw className="w-3 h-3 animate-spin" /> SYNCHRONIZING
                      </div>
                    ) : dataError ? (
                      <div className="flex items-center gap-2 text-[#EF4444] text-[0.7rem] font-bold">
                        <ShieldAlert className="w-3 h-3" /> SYNC FAILED
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[#22C55E] text-[0.7rem] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> ACTIVE SYNC
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-[0.6rem] text-[#475569] uppercase font-bold">Total Rows Found</div>
                      <div className="text-lg font-mono font-bold text-[#F8FAFC]">{activeData.length} Rows</div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="text-[0.6rem] text-[#475569] uppercase font-bold">MSC Sites Found</div>
                      <div className="text-lg font-mono font-bold text-[#38BDF8]">
                        {Array.from(new Set(activeData.filter(r => {
                          if (!r || !r.siteName || typeof r.siteName !== 'string') return false;
                          return r.siteName.trim().toUpperCase().startsWith('MSC');
                        }).map(r => r.siteName.trim()))).length}
                      </div>
                    </div>
                  </div>

                  {dataError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-[0.7rem] text-red-400 italic">
                      {dataError}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full bg-[#38BDF8] text-[#0F172A] p-3 rounded-md font-bold uppercase hover:bg-[#38BDF8]/90 transition-all flex items-center justify-center gap-2"
                >
                  Close & Apply Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Panel Layout */}
      <main className="flex-1 p-4 sm:p-6 grid grid-rows-[auto_1fr_auto] gap-5 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#1E293B] border border-[#334155] p-4 rounded-lg">
            <div className="text-[0.7rem] text-[#94A3B8] uppercase font-bold tracking-wider">Room LCD</div>
            <div className="text-2xl font-bold mt-1 text-[#38BDF8]">{selectedRoom?.lcdKw ? `${selectedRoom.lcdKw} kW` : '--'}</div>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] p-4 rounded-lg">
            <div className="text-[0.7rem] text-[#94A3B8] uppercase font-bold tracking-wider">Actual Utilization</div>
            <div className="text-2xl font-bold mt-1">{selectedRoom?.actualUtilization ? `${selectedRoom.actualUtilization}%` : '--'}</div>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] p-4 rounded-lg">
            <div className="text-[0.7rem] text-[#94A3B8] uppercase font-bold tracking-wider">Reserve Utilization</div>
            <div className="text-2xl font-bold mt-1 text-[#F59E0B]">{selectedRoom?.reserveUtilization ? `${selectedRoom.reserveUtilization}%` : '--'}</div>
          </div>
        </div>

        <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6 overflow-y-auto relative">
          {/* Mini Viewport Video (Shrunk State) */}
          <AnimatePresence mode="wait">
            {videoState === 'finished' && !isAnalyzing && (
              <motion.div
                key="mini-genie"
                layoutId="geenie-lamp"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  duration: 0.6, 
                  ease: [0.16, 1, 0.3, 1],
                  opacity: { duration: 0.3 } 
                }}
                className="fixed bottom-10 left-10 w-64 aspect-video z-50 shadow-2xl rounded-lg overflow-hidden border-2 border-[#38BDF8]/50 bg-black cursor-pointer hover:scale-105 transition-transform"
                onClick={() => {
                  setVideoState('playing');
                }}
              >
                <video
                  key="corner-video"
                  src={videoBlobUrl || "/video_0.mp4"}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  autoPlay={false}
                  loop={false}
                  onLoadedMetadata={(e) => {
                    const video = e.currentTarget;
                    video.currentTime = video.duration;
                  }}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLVideoElement;
                    const error = target.error;
                    console.error("Corner video failed to load", {
                      src: target.src,
                      error: error?.code,
                      msg: error?.message
                    });
                    setVideoError(true);
                    setVideoDiagnostics(`B-Error ${error?.code}: ${error?.message || 'Decode'}`);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-[#38BDF8]">
                    {videoError ? "Asset: video_0.mp4 Not Found" : "Replay Optimization Genie"}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!result && !isAnalyzing ? (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full flex flex-col items-center justify-center text-[#94A3B8] gap-4 py-20"
              >
                <div className="w-16 h-16 rounded-full bg-[#0F172A] flex items-center justify-center border border-[#334155]">
                  <Monitor className="w-8 h-8 opacity-40 text-[#38BDF8]" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-[#F8FAFC]">System Idle</p>
                  <p className="text-sm">Ready for real-time capacity simulation and risk analysis.</p>
                </div>
              </motion.div>
            ) : (isAnalyzing || videoState === 'playing') ? (
              <motion.div 
                key="video"
                layoutId="geenie-lamp"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.6, 
                  ease: [0.16, 1, 0.3, 1]
                }}
                className="col-span-full h-full min-h-[400px] flex items-center justify-center rounded-lg overflow-hidden relative bg-[#0F172A] border-2 border-dashed border-[#334155] group"
              >
                {!videoError ? (
                    <video
                      key={`main-video-${videoError}-${videoBlobUrl ? 'blob' : 'url'}`}
                      ref={videoRef}
                      src={videoBlobUrl || "/video_0.mp4"}
                      className="absolute inset-0 w-full h-full object-contain"
                      autoPlay
                      muted
                      playsInline
                      preload="auto"
                      onEnded={() => {
                        setVideoState('finished');
                      }}
                      onError={(e) => {
                        setVideoError(true);
                        const target = e.currentTarget as HTMLVideoElement;
                        const error = target.error;
                        console.error("Main video failed to load", {
                          src: target.src,
                          error: error?.code,
                          msg: error?.message
                        });
                        setVideoDiagnostics(`B-Error ${error?.code}: ${error?.message || 'Decode'}`);
                      }}
                    />
                ) : (
                  <div className="text-center p-8">
                    <AlertTriangle className="w-12 h-12 text-[#F59E0B] mx-auto mb-4 opacity-50" />
                    <p className="text-[#F8FAFC] font-bold">Optimization Genie: Missing Asset</p>
                    <p className="text-[#94A3B8] text-sm mt-2 max-w-md mx-auto">
                      The asset <span className="font-mono text-[#38BDF8]">video_0.mp4</span> could not be loaded. Please ensure the file is in the <span className="font-mono text-[#38BDF8]">/public</span> directory and the server is configured to serve static assets.
                    </p>
                    {videoDiagnostics && (
                      <p className="text-[10px] text-[#334155] mt-2 font-mono break-all px-4">
                        Status: {videoDiagnostics}
                      </p>
                    )}
                    <div className="flex flex-col gap-2 mt-6">
                      <button 
                        onClick={() => {
                          setVideoError(false);
                          setVideoState('playing');
                        }}
                        className="px-6 py-2 bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#0F172A] rounded-md text-xs font-bold uppercase transition-colors"
                      >
                        Try Force Reload
                      </button>
                      <button 
                        onClick={() => setVideoState('finished')}
                        className="px-6 py-2 bg-[#1E293B] hover:bg-[#334155] text-white rounded-md text-xs font-bold uppercase transition-colors"
                      >
                        Skip to Results
                      </button>
                      <a 
                        href="/video_0.mp4" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#38BDF8] hover:underline mt-2"
                      >
                        View Raw Asset (Diagnostics)
                      </a>
                    </div>
                  </div>
                )}
                
                {!videoError && (
                  <button 
                    onClick={() => setVideoState('finished')}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-white/20"
                  >
                    Skip Animation
                  </button>
                )}

                {isAnalyzing && result && (
                  <div className="absolute bottom-4 right-4 bg-[#0F172A]/80 backdrop-blur-md px-4 py-2 rounded-full border border-[#38BDF8]/30 flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#38BDF8] rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-[#F8FAFC] uppercase tracking-widest">Processing Analysis...</span>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="col-span-full grid grid-cols-1 xl:grid-cols-[1fr_auto] xl:grid-cols-[1.5fr_1fr] gap-x-12 gap-y-6"
              >
                <div className="min-w-0">
                  <div className={`inline-flex px-4 py-1.5 rounded-full font-extrabold text-xl mb-6 uppercase tracking-tighter border ${
                    result?.determination === 'ACCEPT' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : result?.determination === 'REJECT'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {result?.determination || 'REVIEW REQUIRED'}
                  </div>
                  
                  <div className="space-y-4">
                    <p className="font-bold text-[#F8FAFC] flex items-center gap-2">
                       <FileText className="w-4 h-4 text-[#38BDF8]" />
                       AI Evaluation Summary
                    </p>
                    <div className="bg-[#0F172A]/50 p-6 rounded-xl border border-[#334155] font-mono text-sm leading-7 whitespace-pre-wrap text-[#CBD5E1] shadow-inner">
                      {result?.resultText || "Analysis pending detailed report generation..."}
                    </div>
                  </div>
                </div>

                <div className="xl:w-[400px] flex flex-col gap-8">
                  <div className="space-y-6">
                    <div className="bg-[#0F172A]/30 p-4 rounded-lg border border-[#334155]/50">
                      <label className="text-[0.65rem] text-[#94A3B8] font-black uppercase tracking-widest block mb-3">Actual Utilization Post-Install</label>
                      <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedRoom?.actualUtilization || 0}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]"
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-[0.7rem] font-bold">
                        <span className="text-[#38BDF8]">{selectedRoom?.actualUtilization}% LOAD</span>
                        <span className="text-[#475569]">80% LIMIT</span>
                      </div>
                    </div>

                    <div className="bg-[#0F172A]/30 p-4 rounded-lg border border-[#334155]/50">
                      <label className="text-[0.65rem] text-[#94A3B8] font-black uppercase tracking-widest block mb-3">Reserve Threshold Projection</label>
                      <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(result?.correctedReservePercent || 0, 100)}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                          className={`h-full ${result?.correctedReservePercent > 120 ? 'bg-red-500' : 'bg-emerald-500'}`}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-[0.7rem] font-bold">
                        <span className={`${result?.correctedReservePercent > 120 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {result?.correctedReservePercent}% PROJECTED
                        </span>
                        <span className="text-[#475569]">120% MAX</span>
                      </div>
                    </div>

                    <div className="bg-amber-500/5 border-l-4 border-amber-500 p-5 rounded-r-xl shadow-lg">
                      <div className="flex items-center gap-2 text-amber-500 text-[0.7rem] font-black uppercase tracking-widest mb-3">
                        <AlertTriangle className="w-4 h-4" /> Risk Assessment
                      </div>
                      <ul className="text-[0.8rem] text-[#CBD5E1] space-y-3 list-none">
                        {result?.anomalies?.map((a: string, i: number) => (
                          <li key={i} className="flex gap-3 leading-relaxed">
                            <span className="text-amber-500 font-bold">»</span> {a}
                          </li>
                        ))}
                        {(!result?.anomalies || result?.anomalies.length === 0) && (
                          <li className="text-[#64748B] italic flex items-center gap-2">
                             <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                             No critical capacity risks identified.
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <footer className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-5 border-t border-[#334155] text-[0.7rem] sm:text-[0.75rem] text-[#94A3B8]">
          <div className="flex items-center gap-2 font-medium">
            <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
            CONNECTED: RBR_STATIC_V4.2 (LIVE AI ENGINE)
          </div>
          <div className="font-semibold uppercase tracking-widest text-[#475569]">
            VERSION 1.2.0 • PROPRIETARY SYSTEM DATA • &copy; 2026
          </div>
        </footer>
      </main>
    </div>
    </LayoutGroup>
  );
}


