import React, { useState, useRef, useEffect } from 'react'

function App() {
  const [guide, setGuide] = useState(null)
  const [currentLang, setCurrentLang] = useState('zh')
  const [location, setLocation] = useState("正在取得位置 (Fetching location)...")
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false)
  const metroInterval = useRef(null)
  const audioCtx = useRef(null)

  // 1. 介面文字對照表 (i18n)
  const uiText = {
    zh: { title: "🚨 移工母語急救指引", call: "📞 撥打 119 求救 (Taiwan)", locLabel: "📍 我的目前位置：", locRetry: "🔄 重新整理位置", metro: "💓 CPR 按壓節奏器", metroStart: "開始", metroStop: "停止", metroDesc: "請跟著「嗶」聲規律按壓胸部" },
    en: { title: "🚨 Migrant First Aid Guide", call: "📞 Call 119 (Emergency)", locLabel: "📍 My Current Location:", locRetry: "🔄 Refresh Location", metro: "💓 CPR Metronome", metroStart: "Start", metroStop: "Stop", metroDesc: "Follow the 'beep' to press the chest" },
    vi: { title: "🚨 Hướng dẫn sơ cứu", call: "📞 Gọi 119 (Cấp cứu)", locLabel: "📍 Vị trí của tôi:", locRetry: "🔄 Cập nhật vị trí", metro: "💓 Máy đếm nhịp CPR", metroStart: "Bắt đầu", metroStop: "Dừng", metroDesc: "Ấn ngực theo tiếng 'bíp'" },
    id: { title: "🚨 Panduan Pertolongan Pertama", call: "📞 Panggil 119 (Darurat)", locLabel: "📍 Lokasi Saya:", locRetry: "🔄 Perbarui Lokasi", metro: "💓 Metronom CPR", metroStart: "Mulai", metroStop: "Berhenti", metroDesc: "Tekan dada sesuai bunyi 'beep'" },
    th: { title: "🚨 คู่มือปฐมพยาบาล", call: "📞 โทร 119 (ฉุกเฉิน)", locLabel: "📍 ตำแหน่งของฉัน:", locRetry: "🔄 รีเฟรชตำแหน่ง", metro: "💓 เครื่องให้จังหวะ CPR", metroStart: "เริ่ม", metroStop: "หยุด", metroDesc: "กดหน้าอกตามเสียง 'บี๊บ'" }
  };

  // 2. 定位功能：獲取經緯度並轉換為地址
  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setLocation("您的瀏覽器不支持定位服務");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // 使用 OpenStreetMap 免費逆向地理編碼 API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${currentLang}`
          );
          const data = await response.json();
          // 顯示完整地址，若無地址則顯示經緯度
          setLocation(data.display_name || `Lat: ${latitude}, Lon: ${longitude}`);
        } catch (error) {
          setLocation(`經緯度: ${latitude}, ${longitude} (暫時無法轉換地址)`);
        }
      },
      (error) => {
        console.error("定位失敗:", error);
        setLocation("無法取得定位，請確保已開啟 GPS 並授權位置權限。");
      },
      { enableHighAccuracy: true } // 開啟高精準度
    );
  };

  // 3. 在組件載入時立即要求定位權限
  useEffect(() => {
    fetchLocation();
    // 預載入中文指南作為首頁內容
    loadGuide('zh');
  }, []);

  const loadGuide = async (lang) => {
    setCurrentLang(lang);
    try {
      const response = await fetch(`https://migrant-first-aid.onrender.com/guide/${lang}`);
      const data = await response.json();
      setGuide(data);
      // 切換語言時重新更新地址語言
      fetchLocation();
    } catch (error) {
      console.error("載入指南失敗:", error);
    }
  };

  const speakText = () => {
    if (!guide || !guide.steps) return;
    window.speechSynthesis.cancel();

    const langMap = { 'zh': 'zh-TW', 'vi': 'vi-VN', 'id': 'id-ID', 'th': 'th-TH', 'en': 'en-US' };
    const targetLang = langMap[currentLang] || 'zh-TW';

    let text = `${guide.title}。 ${guide.steps[0].text}。 ${guide.steps[1].text}`;
    if (currentLang === 'zh') {
      text = text.replace(/CPR/gi, "西皮阿").replace(/119/g, "一一九");
    }

    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = targetLang;
    msg.volume = 1.0;
    msg.rate = 1.2; // 加快語速

    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(v => v.lang.replace('_', '-').includes(targetLang));
    
    if (currentLang === 'th' && !targetVoice) {
      alert("您的裝置尚未安裝泰語語音包，請至系統設定下載。");
    }

    if (targetVoice) msg.voice = targetVoice;
    window.speechSynthesis.speak(msg);
  };

  const playBeep = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.current.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.current.destination);
    gain.gain.setValueAtTime(0.8, audioCtx.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 0.15);
    osc.start();
    osc.stop(audioCtx.current.currentTime + 0.15);
  };

  const toggleMetronome = () => {
    if (isMetronomePlaying) {
      clearInterval(metroInterval.current);
      setIsMetronomePlaying(false);
    } else {
      const bpm = 110;
      const ms = 60000 / bpm;
      metroInterval.current = setInterval(playBeep, ms);
      setIsMetronomePlaying(true);
    }
  };

  return (
    <div style={{ padding: '15px', textAlign: 'center', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto', backgroundColor: '#fff' }}>
      <h1 style={{ color: '#ff4444', fontSize: '24px', marginBottom: '15px' }}>{uiText[currentLang].title}</h1>

      {/* 緊急撥號區域 */}
      <div style={{ marginBottom: '20px' }}>
        <a href="tel:119" style={{ 
          display: 'block', backgroundColor: '#d32f2f', color: 'white', padding: '18px', 
          borderRadius: '12px', fontSize: '22px', fontWeight: 'bold', textDecoration: 'none',
          boxShadow: '0 6px 12px rgba(211, 47, 47, 0.4)', marginBottom: '10px'
        }}>
          {uiText[currentLang].call}
        </a>
        
        {/* 地址顯示區域 */}
        <div style={{ padding: '12px', backgroundColor: '#fdf2f2', border: '1px solid #ffcccc', borderRadius: '10px' }}>
          <p style={{ fontSize: '13px', color: '#666', margin: '0 0 5px 0' }}>{uiText[currentLang].locLabel}</p>
          <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#b71c1c', margin: '0 0 8px 0', lineHeight: '1.4' }}>{location}</p>
          <button onClick={fetchLocation} style={{ color: '#007bff', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
            {uiText[currentLang].locRetry}
          </button>
        </div>
      </div>
      
      {/* 語言切換 */}
      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
        {['zh', 'vi', 'id', 'th', 'en'].map(l => (
          <button 
            key={l} 
            onClick={() => loadGuide(l)} 
            style={{ 
              padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd',
              backgroundColor: currentLang === l ? '#ff4444' : '#fff',
              color: currentLang === l ? '#fff' : '#333', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            {l === 'zh' ? '中文' : l === 'vi' ? 'Việt' : l === 'id' ? 'Indo' : l === 'th' ? 'ไทย' : 'English'}
          </button>
        ))}
      </div>

      {/* 指引內容 */}
      {guide && (
        <div style={{ border: '2px solid #ff4444', borderRadius: '15px', padding: '20px', background: 'white', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginBottom: '15px', fontSize: '20px' }}>{guide.title}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ width: '140px' }}>
              <img src={`https://migrant-first-aid.onrender.com${guide.steps[0].img}`} width="100%" style={{ borderRadius: '10px' }} alt="Step 1" />
              <p style={{ fontSize: '14px', marginTop: '8px', fontWeight: 'bold' }}>{guide.steps[0].text}</p>
            </div>
            <div style={{ width: '140px' }}>
              <img src={`https://migrant-first-aid.onrender.com${guide.steps[1].img}`} width="100%" style={{ borderRadius: '10px' }} alt="Step 2" />
              <p style={{ fontSize: '14px', marginTop: '8px', fontWeight: 'bold' }}>{guide.steps[1].text}</p>
            </div>
          </div>
          <button onClick={speakText} style={{ marginTop: '15px', padding: '12px 30px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
            🔊 語音朗讀
          </button>
        </div>
      )}

      {/* 底部節奏器 */}
      <div style={{ marginTop: '20px', padding: '20px', borderTop: '2px dashed #ccc' }}>
        <h3 style={{ marginBottom: '15px' }}>{uiText[currentLang].metro}</h3>
        <button 
          onClick={toggleMetronome}
          style={{ 
            width: '100px', height: '100px', borderRadius: '50%', border: 'none',
            backgroundColor: isMetronomePlaying ? '#333' : '#ff4444',
            color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '18px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}
        >
          {isMetronomePlaying ? uiText[currentLang].metroStop : uiText[currentLang].metroStart}<br/><small>110 BPM</small>
        </button>
        <p style={{ color: '#666', marginTop: '10px', fontSize: '13px' }}>{uiText[currentLang].metroDesc}</p>
      </div>
    </div>
  )
}

export default App