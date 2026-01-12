import React, { useState, useRef } from 'react'

function App() {
  React.useEffect(() => {
  // 頁面載入時先「空跑」一次，喚醒語音引擎
  window.speechSynthesis.getVoices();
}, []);
  const [guide, setGuide] = useState(null)
  const [currentLang, setCurrentLang] = useState('zh')
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false)
  const metroInterval = useRef(null)
  const audioCtx = useRef(null)

  // 1. 載入指南數據
  const loadGuide = async (lang) => {
    setCurrentLang(lang)
    try {
      const response = await fetch(`https://migrant-first-aid.onrender.com/guide/${lang}`)
      const data = await response.json()
      setGuide(data)
    } catch (error) {
      console.error("載入失敗:", error)
    }
  }

  // 2. 語音功能
const speakText = () => {
    if (!guide || !guide.steps) return;
    
    // 1. 強制停止當前所有語音，避免重疊
    window.speechSynthesis.cancel();

    const langMap = { 'zh': 'zh-TW', 'vi': 'vi-VN', 'id': 'id-ID', 'th': 'th-TH' };
    const targetLang = langMap[currentLang] || 'zh-TW';

    // 2. 組合完整文字
    let finalText = `${guide.title}。 ${guide.steps[0].text}。 ${guide.steps[1].text}`;
    
    // 中文特殊發音校正
    if (currentLang === 'zh') {
      finalText = finalText.replace(/CPR/gi, "西皮阿").replace(/119/g, "一一九");
    }

    // 3. 建立語音物件
    const msg = new SpeechSynthesisUtterance(finalText);
    msg.lang = targetLang;
    msg.volume = 1.0; // 確保音量最大
    msg.rate = 0.8;   // 語速稍慢，確保清晰度

    // 4. 重要：手動尋找系統中的語音引擎（針對泰文與中文優化）
    const voices = window.speechSynthesis.getVoices();
    
    // 尋找對應語系的語音包
    const targetVoice = voices.find(v => 
      v.lang.replace('_', '-').includes(targetLang)
    );
    
    if (targetVoice) {
      msg.voice = targetVoice;
    } else {
      // 如果是泰文且找不到，提醒使用者安裝
      if (currentLang === 'th') {
        alert("您的裝置尚未安裝泰語語音包，請至系統設定下載。");
      }
      // 如果是中文且找不到，在 Console 記錄 Debug 資訊
      if (currentLang === 'zh') {
        console.warn("找不到中文(台灣)語音包，將使用系統預設語音");
      }
    }

    // 5. 執行朗讀
    window.speechSynthesis.speak(msg);
  };

  // 3. CPR 節奏器功能
  const playBeep = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    const osc = audioCtx.current.createOscillator()
    const gain = audioCtx.current.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, audioCtx.current.currentTime)
    osc.connect(gain)
    gain.connect(audioCtx.current.destination)
    gain.gain.setValueAtTime(1.0, audioCtx.current.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 0.15)
    osc.start()
    osc.stop(audioCtx.current.currentTime + 0.15)
  }

  const toggleMetronome = () => {
    if (isMetronomePlaying) {
      clearInterval(metroInterval.current)
      setIsMetronomePlaying(false)
    } else {
      const bpm = 110
      const ms = 60000 / bpm
      metroInterval.current = setInterval(playBeep, ms)
      setIsMetronomePlaying(true)
    }
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ color: '#ff4444' }}>🚨 移工母語急救指引</h1>
      
      <div style={{ marginBottom: '20px' }}>
        {['zh', 'vi', 'id', 'th'].map(l => (
          <button key={l} onClick={() => loadGuide(l)} style={{ margin: '5px', padding: '8px 15px' }}>
            {l === 'zh' ? '中文' : l === 'vi' ? 'Việt' : l === 'id' ? 'Indo' : 'ไทย'}
          </button>
        ))}
      </div>

      {guide && (
        <div style={{ border: '2px solid #ff4444', borderRadius: '15px', padding: '20px', background: 'white', marginBottom: '20px' }}>
          <h2>{guide.title}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ width: '140px' }}>
              <img src={`https://migrant-first-aid.onrender.com${guide.steps[0].img}`} width="100%" style={{ borderRadius: '10px' }} />
              <p style={{ fontSize: '14px' }}>{guide.steps[0].text}</p>
            </div>
            <div style={{ width: '140px' }}>
              <img src={`https://migrant-first-aid.onrender.com${guide.steps[1].img}`} width="100%" style={{ borderRadius: '10px' }} />
              <p style={{ fontSize: '14px' }}>{guide.steps[1].text}</p>
            </div>
          </div>
          <button onClick={speakText} style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>
            🔊 語音朗讀
          </button>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '20px', borderTop: '2px dashed #ccc' }}>
        <h3>💓 CPR 按壓節奏器</h3>
        <button 
          onClick={toggleMetronome}
          style={{ 
            width: '100px', height: '100px', borderRadius: '50%', border: 'none',
            backgroundColor: isMetronomePlaying ? '#333' : '#ff4444',
            color: 'white', fontWeight: 'bold', cursor: 'pointer'
          }}
        >
          {isMetronomePlaying ? '停止' : '開始'}<br/>(110 BPM)
        </button>
        <p>請跟著「嗶」聲按壓</p>
      </div>
    </div>
  )
}

export default App