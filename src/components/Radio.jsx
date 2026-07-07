import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, Sparkles, Radio as RadioIcon, HelpCircle, X, Loader2 } from 'lucide-react';

const CHANNELS = [
  { id: 'kbs_classic', name: 'KBS 클래식FM', freq: '93.1 MHz', desc: '고품격 클래식, 국악 전문 채널', apiUrl: 'https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/24', logoText: 'KBS', logoColor: '#dc2626' },
  { id: 'kbs_cool', name: 'KBS Cool FM', freq: '89.1 MHz', desc: '가요, 팝송, 대중 음악 라디오', apiUrl: 'https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/25', logoText: 'Cool', logoColor: '#ea580c' },
  { id: 'kbs_1radio', name: 'KBS 1라디오', freq: '97.3 MHz', desc: '뉴스, 시사, 정보 전문 채널', apiUrl: 'https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/21', logoText: '1Radio', logoColor: '#b91c1c' },
  { id: 'mbc_fm4u', name: 'MBC 광주 FM4U', freq: '95.1 MHz', desc: '대중 음악, 가요, 즐거운 방송', streamUrl: 'https://media.kjmbc.co.kr/hls/fmlive/GWANGJU-MBC-FM/playlist.m3u8', logoText: 'MBC', logoColor: '#a21caf' },
  { id: 'mbc_std', name: 'MBC 광주 표준FM', freq: '93.9 MHz', desc: '시사, 뉴스, 전남 생활 정보', streamUrl: 'https://media.kjmbc.co.kr/hls/amlive/GWANGJU-MBC-AM/playlist.m3u8', logoText: '표준', logoColor: '#86198f' },
  { id: 'sbs_power', name: 'SBS 파워FM', freq: '107.7 MHz', desc: '인기 예능, 토크, 최신 가요', apiUrl: 'https://apis.sbs.co.kr/play-api/1.0/livestream/powerpc/powerfm?protocol=hls&ssl=Y', logoText: 'SBS', logoColor: '#059669' },
  { id: 'sbs_love', name: 'SBS 러브FM', freq: '103.5 MHz', desc: '종합 토크, 대중 음악, 종합 뉴스', apiUrl: 'https://apis.sbs.co.kr/play-api/1.0/livestream/lovepc/lovefm?protocol=hls&ssl=Y', logoText: 'Love', logoColor: '#10b981' },
  { id: 'ebs_fm', name: 'EBS FM', freq: '104.5 MHz', desc: '교육, 지상파 교양 라디오 방송', streamUrl: 'https://new_iradio.ebs.co.kr/iradio/iradiolive_m4a/playlist.m3u8', logoText: 'EBS', logoColor: '#2563eb' },
  { id: 'ebs_foreign', name: 'EBS 외국어', freq: '인터넷 전용', desc: '영어 및 제2외국어 어학 전문 교육', streamUrl: 'https://bandibook.ebs.co.kr/bandibook/live_m4a/playlist.m3u8', logoText: '외국어', logoColor: '#3b82f6' },
  { id: 'cbs_music', name: 'CBS 음악FM', freq: '93.9 MHz', desc: '올드팝, 대중음악, 고품격 클래식', streamUrl: 'https://aac.cbs.co.kr/cbs939/cbs939.stream/playlist.m3u8', logoText: 'CBS', logoColor: '#1e3a8a' },
  { id: 'cbs_std', name: 'CBS 표준FM', freq: '98.1 MHz', desc: '뉴스, 토크, 시사 전문 종합 편성', streamUrl: 'https://aac.cbs.co.kr/cbs981/cbs981.stream/playlist.m3u8', logoText: '표준', logoColor: '#1d4ed8' },
  { id: 'tbs_fm', name: 'TBS 교통방송', freq: '95.1 MHz', desc: '교통 정보, 시민 참여형 서울 지역 방송', streamUrl: 'https://cdnfm.tbs.seoul.kr/tbs/_definst_/tbs_fm_web_360.smil/playlist.m3u8', logoText: 'TBS', logoColor: '#d97706' },
  { id: 'tbs_efm', name: 'TBS eFM', freq: '101.3 MHz', desc: '영어 교통방송, 글로벌 청취자를 위해', streamUrl: 'https://cdnfm.tbs.seoul.kr/tbs/_definst_/tbs_efm_web_360.smil/playlist.m3u8', logoText: 'eFM', logoColor: '#f59e0b' }
];

const THEMES = {
  navy: {
    id: 'navy',
    name: 'Deep Navy',
    bg: 'linear-gradient(135deg, #070b19, #0e162b)',
    cardBg: 'rgba(14, 22, 43, 0.7)',
    cardActiveBg: 'rgba(34, 211, 238, 0.12)',
    border: 'rgba(34, 211, 238, 0.2)',
    borderActive: 'rgba(34, 211, 238, 0.6)',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    accent: '#06b6d4',
    visualizerColors: ['#8b5cf6', '#06b6d4'],
    accentText: '#070b19'
  },
  classic: {
    id: 'classic',
    name: 'Classic Radio',
    bg: 'linear-gradient(135deg, #2b1810, #140b07)',
    cardBg: 'rgba(64, 40, 29, 0.7)',
    cardActiveBg: 'rgba(217, 119, 6, 0.15)',
    border: 'rgba(217, 119, 6, 0.25)',
    borderActive: 'rgba(217, 119, 6, 0.65)',
    text: '#fef3c7',
    textSecondary: '#d97706',
    accent: '#d97706',
    visualizerColors: ['#d97706', '#f59e0b'],
    accentText: '#140b07'
  },
  mono: {
    id: 'mono',
    name: 'Mono',
    bg: 'linear-gradient(135deg, #050505, #141414)',
    cardBg: 'rgba(28, 28, 28, 0.85)',
    cardActiveBg: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.2)',
    borderActive: 'rgba(255, 255, 255, 0.8)',
    text: '#ffffff',
    textSecondary: '#a3a3a3',
    accent: '#ffffff',
    visualizerColors: ['#ffffff', '#525252'],
    accentText: '#000000'
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    bg: 'linear-gradient(135deg, #0a0a0a, #161616)',
    cardBg: 'rgba(32, 32, 32, 0.8)',
    cardActiveBg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.25)',
    borderActive: 'rgba(239, 68, 68, 0.7)',
    text: '#f1f5f9',
    textSecondary: '#64748b',
    accent: '#ef4444',
    visualizerColors: ['#ef4444', '#b91c1c'],
    accentText: '#ffffff'
  },
  line: {
    id: 'line',
    name: 'Line Art',
    bg: 'linear-gradient(135deg, #18181b, #09090b)',
    cardBg: 'rgba(24, 24, 27, 0.2)',
    cardActiveBg: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderActive: '1px solid rgba(255, 255, 255, 1)',
    text: '#ffffff',
    textSecondary: '#a1a1aa',
    accent: '#ffffff',
    visualizerColors: ['#ffffff', '#a1a1aa'],
    accentText: '#09090b'
  },
  gold: {
    id: 'gold',
    name: 'Luxury Gold',
    bg: 'linear-gradient(135deg, #14120f, #0d0c0a)',
    cardBg: 'rgba(38, 34, 29, 0.75)',
    cardActiveBg: 'rgba(234, 179, 8, 0.12)',
    border: 'rgba(234, 179, 8, 0.22)',
    borderActive: 'rgba(234, 179, 8, 0.7)',
    text: '#fef08a',
    textSecondary: '#ca8a04',
    accent: '#eab308',
    visualizerColors: ['#ca8a04', '#eab308'],
    accentText: '#0d0c0a'
  },
  mint: {
    id: 'mint',
    name: 'Forest Mint',
    bg: 'linear-gradient(135deg, #052c1e, #021a12)',
    cardBg: 'rgba(10, 58, 41, 0.7)',
    cardActiveBg: 'rgba(52, 211, 153, 0.15)',
    border: 'rgba(52, 211, 153, 0.25)',
    borderActive: 'rgba(52, 211, 153, 0.7)',
    text: '#ecfdf5',
    textSecondary: '#10b981',
    accent: '#34d399',
    visualizerColors: ['#10b981', '#34d399'],
    accentText: '#021a12'
  }
};

export default function Radio() {
  const [selectedChannel, setSelectedChannel] = useState(CHANNELS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [themeKey, setThemeKey] = useState('navy');
  const [showSplash, setShowSplash] = useState(false);
  const [dontShowSplashToday, setDontShowSplashToday] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const audioRef = useRef(null);
  const hlsRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const theme = THEMES[themeKey];

  // 1. Dynamic Script Import for hls.js
  useEffect(() => {
    if (window.Hls) {
      setHlsLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js';
    script.async = true;
    script.onload = () => {
      setHlsLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load hls.js from CDN.');
    };
    document.body.appendChild(script);
  }, []);

  // 2. Splash Modal Cookie/LocalStorage Check
  useEffect(() => {
    const splashDismissed = localStorage.getItem('radio_splash_dismissed_time');
    if (splashDismissed) {
      const timePassed = Date.now() - parseInt(splashDismissed, 10);
      if (timePassed < 24 * 60 * 60 * 1000) {
        setShowSplash(false);
        return;
      }
    }
    setShowSplash(true);
  }, []);

  // 3. Audio Source Management and Cleanup
  useEffect(() => {
    // If it was playing, restart playing on channel change
    if (isPlaying) {
      playStream(selectedChannel);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel]);

  // 4. Volume controller
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // 5. Visualizer Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bars = Array(20).fill(2);
    let targetHeights = Array(20).fill(2);
    let speeds = Array(20).fill(0.15);

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barCount = 35;
      const barWidth = canvas.width / barCount - 3;
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, theme.visualizerColors[0]);
      gradient.addColorStop(1, theme.visualizerColors[1]);

      for (let i = 0; i < barCount; i++) {
        if (isPlaying && !isLoading) {
          // Generate realistic target height oscillations
          if (Math.random() < 0.12) {
            targetHeights[i] = Math.random() * (canvas.height - 10) + 5;
            speeds[i] = 0.08 + Math.random() * 0.12;
          }
          // Linear interpolation for smooth springy transition
          const currentH = bars[i] || 2;
          const targetH = targetHeights[i] || 2;
          bars[i] = currentH + (targetH - currentH) * speeds[i];
        } else {
          // Flatten visualizer when stopped or loading
          bars[i] = (bars[i] || 2) * 0.85;
          if (bars[i] < 2) bars[i] = 2;
          targetHeights[i] = 2;
        }

        const x = i * (barWidth + 3);
        const y = canvas.height - bars[i];
        
        ctx.fillStyle = gradient;
        // Rounded corner bars
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, bars[i], 3);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, isLoading, themeKey, theme.visualizerColors]);

  // HLS/Audio Player Play function
  const playStream = async (channel) => {
    stopStream();
    setIsLoading(true);
    setErrorMsg('');

    try {
      let streamUrl = channel.streamUrl;

      // Handle APIs for SBS/KBS
      if (channel.apiUrl) {
        streamUrl = await fetchStreamUrl(channel);
      }

      if (!streamUrl) {
        throw new Error('스트리밍 주소를 찾을 수 없습니다.');
      }

      const audio = audioRef.current;
      if (!audio) return;

      // Set volume immediately
      audio.volume = isMuted ? 0 : volume / 100;

      // Play based on file type and HLS support
      if (streamUrl.includes('.m3u8')) {
        if (window.Hls && window.Hls.isSupported()) {
          const hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            maxBufferSize: 30 * 1000,
            maxMaxBufferLength: 60
          });
          hlsRef.current = hls;
          hls.loadSource(streamUrl);
          hls.attachMedia(audio);
          
          hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
            audio.play().catch(e => console.warn('Audio play error:', e));
          });

          hls.on(window.Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              console.error('Fatal HLS error:', data.type);
              hls.destroy();
              setErrorMsg('방송 주소 접속에 실패했습니다. 다음 채널을 청취해 주세요.');
              setIsLoading(false);
              setIsPlaying(false);
            }
          });
        } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
          // Native Safari playback
          audio.src = streamUrl;
          audio.play().catch(e => console.warn('Audio play error:', e));
        } else {
          throw new Error('이 브라우저는 실시간 라디오 스트리밍(HLS) 재생을 지원하지 않습니다.');
        }
      } else {
        // Fallback for standard direct streams (e.g. mp3/aac direct url)
        audio.src = streamUrl;
        audio.play().catch(e => console.warn('Audio play error:', e));
      }

      setIsPlaying(true);
    } catch (err) {
      console.error('Stream load error:', err);
      setErrorMsg(err.message || '방송을 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  // Stop Stream and cleanup
  const stopStream = () => {
    setIsLoading(false);
    setErrorMsg('');
    
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
      audio.load();
    }
  };

  // Helper function to call the broadcaster APIs with fallback proxy
  const fetchStreamUrl = async (channel) => {
    const directUrl = channel.apiUrl;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`;

    const parseResponse = async (res) => {
      if (channel.id.startsWith('kbs')) {
        const json = await res.json();
        return json.channel_item?.[0]?.service_url;
      } else if (channel.id.startsWith('sbs')) {
        const text = await res.text();
        if (text && text.includes('.m3u8')) {
          return text.trim();
        }
      }
      return null;
    };

    // Attempt 1: Direct Fetch
    try {
      const response = await fetch(directUrl);
      if (!response.ok) throw new Error('Direct fetch failed');
      const url = await parseResponse(response);
      if (url) return url;
    } catch (directErr) {
      console.warn('Direct API fetch failed, trying proxy...', directErr);
    }

    // Attempt 2: CORS Proxy Fetch
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Proxy fetch failed');
      const url = await parseResponse(response);
      if (url) return url;
    } catch (proxyErr) {
      console.error('Proxy API fetch failed:', proxyErr);
    }

    return null;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      stopStream();
      setIsPlaying(false);
    } else {
      playStream(selectedChannel);
    }
  };

  const handleStop = () => {
    stopStream();
    setIsPlaying(false);
  };

  const handleVolumeChange = (e) => {
    setVolume(parseInt(e.target.value, 10));
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const closeSplash = () => {
    if (dontShowSplashToday) {
      localStorage.setItem('radio_splash_dismissed_time', Date.now().toString());
    }
    setShowSplash(false);
  };

  return (
    <div className="fade-in" style={{
      width: '100%',
      minHeight: 'calc(100vh - 120px)',
      background: theme.bg,
      color: theme.text,
      borderRadius: '24px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      marginBottom: '40px',
      border: theme.id === 'line' ? theme.border : '1px solid rgba(255, 255, 255, 0.05)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.5s ease'
    }}>
      {/* Background ambient light */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        right: '-150px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: theme.accent,
        filter: 'blur(150px)',
        opacity: isPlaying && !isLoading ? 0.15 : 0.03,
        pointerEvents: 'none',
        transition: 'all 1s ease'
      }} />

      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        crossOrigin="anonymous"
      />

      {/* Header section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: theme.id === 'line' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: isPlaying && !isLoading ? `rgba(${theme.accent === '#ffffff' ? '255,255,255' : '6,182,212'}, 0.1)` : 'rgba(255,255,255,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.accent,
            boxShadow: isPlaying && !isLoading ? `0 0 15px ${theme.accent}30` : 'none',
            border: theme.id === 'line' ? theme.border : `1px solid rgba(255, 255, 255, 0.1)`,
            animation: isPlaying && !isLoading ? 'pulse 2s infinite' : 'none'
          }}>
            <RadioIcon size={20} className={isPlaying && !isLoading ? 'rotate-animation' : ''} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>실시간 라디오방송</h2>
            <p style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '2px' }}>고음질 라이브 오디오 플레이어</p>
          </div>
        </div>

        {/* Top Control widgets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Theme Badge Selector */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={14} style={{ color: theme.accent }} />
            <select
              value={themeKey}
              onChange={(e) => setThemeKey(e.target.value)}
              style={{
                background: theme.cardBg,
                color: theme.text,
                border: theme.id === 'line' ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {Object.keys(THEMES).map(k => (
                <option key={k} value={k} style={{ background: '#121214', color: '#fff' }}>
                  {THEMES[k].name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowSplash(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '50%',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      {/* Main content body: Horizontal scrolling channel selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: theme.accent }} />
          방송 채널 선택
        </h3>

        {/* Horizontal scroll selector container */}
        <div style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin'
        }} className="custom-scrollbar">
          {CHANNELS.map((ch) => {
            const isSelected = ch.id === selectedChannel.id;
            return (
              <div
                key={ch.id}
                onClick={() => setSelectedChannel(ch)}
                style={{
                  flex: '0 0 190px',
                  scrollSnapAlign: 'start',
                  background: isSelected ? theme.cardActiveBg : theme.cardBg,
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  border: isSelected 
                    ? (theme.id === 'line' ? '2px solid #ffffff' : `1.5px solid ${theme.accent}`) 
                    : (theme.id === 'line' ? '1px solid rgba(255, 255, 255, 0.4)' : '1.5px solid transparent'),
                  boxShadow: isSelected ? `0 8px 24px ${theme.accent}15` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    if (theme.id !== 'line') e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    if (theme.id !== 'line') e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#ffffff',
                    background: ch.logoColor,
                    padding: '2px 8px',
                    borderRadius: '50px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                  }}>
                    {ch.logoText}
                  </span>
                  <span style={{ fontSize: '11px', color: theme.textSecondary, fontWeight: '700' }}>
                    {ch.freq}
                  </span>
                </div>

                <div style={{ marginTop: '4px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: theme.text, marginBottom: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {ch.name}
                  </h4>
                  <p style={{ fontSize: '11px', color: theme.textSecondary, lineHeight: '1.4', height: '32px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {ch.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom fixed controller card */}
      <div style={{
        background: theme.cardBg,
        borderRadius: '20px',
        padding: '20px',
        border: theme.id === 'line' ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '20px',
        marginTop: 'auto'
      }}>
        {/* Info & Status row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isPlaying ? '#22c55e' : '#64748b',
                display: 'inline-block',
                boxShadow: isPlaying ? '0 0 10px #22c55e' : 'none'
              }} />
              <span style={{ fontSize: '12px', color: theme.textSecondary, fontWeight: '600' }}>
                {isPlaying ? (isLoading ? '연결 중...' : '방송 수신 중') : '대기 중'}
              </span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginTop: '6px', color: theme.text }}>
              {selectedChannel.name}
            </h3>
            <p style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '2px' }}>
              {selectedChannel.freq} • {selectedChannel.desc}
            </p>
          </div>

          {/* Equalizer animation canvas (fits beautifully on the right of info) */}
          <div style={{
            width: '180px',
            height: '40px',
            position: 'relative'
          }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
        </div>

        {/* Error message alert */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '12px',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Playback Controls & Volume row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          borderTop: theme.id === 'line' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '16px'
        }}>
          {/* Play, Pause, Stop Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePlayPause}
              disabled={isLoading && !isPlaying}
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: theme.accent,
                color: theme.accentText,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: isPlaying ? `0 0 20px ${theme.accent}50` : 'none',
                transition: 'transform 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isLoading ? (
                <Loader2 size={24} className="spin-animation" style={{ color: theme.accentText }} />
              ) : isPlaying ? (
                <Pause size={24} fill="currentColor" />
              ) : (
                <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }} />
              )}
            </button>

            <button
              onClick={handleStop}
              disabled={!isPlaying}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
                color: isPlaying ? theme.text : 'rgba(255,255,255,0.15)',
                border: theme.id === 'line' ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isPlaying ? 'pointer' : 'default',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (isPlaying) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            >
              <Square size={18} fill="currentColor" />
            </button>
          </div>

          {/* Volume Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '220px' }}>
            <button
              onClick={toggleMute}
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              style={{
                flex: 1,
                height: '4px',
                accentColor: theme.accent,
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '2px',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <span style={{ fontSize: '12px', fontFamily: 'Outfit', fontWeight: '700', width: '30px', textAlign: 'right', color: theme.textSecondary }}>
              {isMuted ? 0 : volume}%
            </span>
          </div>
        </div>
      </div>

      {/* Splash Info Modal */}
      {showSplash && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.92)' }}>
          <div className="glass modal-content" style={{
            maxWidth: '520px',
            border: theme.id === 'line' ? '1.5px solid #ffffff' : `1px solid ${theme.border}`,
            background: theme.cardBg,
            color: theme.text,
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.accent }}>
                <RadioIcon size={24} />
                <span style={{ fontWeight: '800', fontSize: '20px', letterSpacing: '-0.5px' }}>라디오 플레이어 안내</span>
              </div>
              <button
                onClick={closeSplash}
                style={{ background: 'transparent', border: 'none', color: theme.textSecondary, cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', lineHeight: '1.6' }}>
              <p>
                <strong>'시월의 마지막 밤' 실시간 라디오 플레이어</strong>에 오신 것을 환영합니다! 본 서비스는 국내외 주요 방송국의 온에어 스트림을 하나로 모아 고음질로 재생합니다.
              </p>

              <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: theme.accent }}>•</span>
                  <span><strong>지원 방송사:</strong> KBS(1FM, Cool, 1라디오), MBC Gwangju, SBS(Power, Love), EBS, CBS, TBS</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: theme.accent }}>•</span>
                  <span><strong>7가지 다이내믹 테마:</strong> Classic Radio, Deep Navy, Mono, Forest Mint 등 우측 상단에서 디자인 감성을 마음껏 골라 보세요.</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: theme.accent }}>•</span>
                  <span><strong>기술 스택:</strong> React 19, Hls.js (M3U8 스트림 복호화 재생), Web Audio API Simulation (애니메이션 비주얼라이저), Dual CORS-Proxy (KBS/SBS 전송 오류 우회 기술)</span>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: theme.textSecondary }}>
                ※ 모바일 웹 환경에서도 완벽히 작동합니다. 방송사 네트워크 혼잡이나 환경에 따라 재생 시작까지 약 3~5초의 지연(버퍼링)이 발생할 수 있습니다.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <label className="checkbox-group" style={{ fontSize: '13px', color: theme.textSecondary }}>
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={dontShowSplashToday}
                  onChange={(e) => setDontShowSplashToday(e.target.checked)}
                />
                오늘 하루 동안 안내 보지 않기
              </label>

              <button
                onClick={closeSplash}
                className="btn btn-primary"
                style={{
                  padding: '8px 20px',
                  minHeight: '38px',
                  background: theme.accent,
                  color: theme.accentText,
                  fontSize: '14px',
                  fontWeight: '700'
                }}
              >
                라디오 켜기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled inline keyframes animations for loading / pulses */}
      <style>{`
        .spin-animation {
          animation: spin 1.2s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .rotate-animation {
          animation: rotate-slow 15s linear infinite;
        }
        @keyframes rotate-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.2); }
          70% { box-shadow: 0 0 0 8px rgba(34, 211, 238, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
