import React, { useState, useRef } from 'react'

function App() {
  const [guide, setGuide] = useState(null)
  const [currentLang, setCurrentLang] = useState('zh')
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false)
  const metroInterval = useRef(null)
  const audioCtx = useRef(null)

  const loadGuide = async (lang) => {
    setCurrentLang(lang)
    try {
      const response = await fetch(`https://migrant-first-aid.onrender.com/guide/${lang}`)
      const data = await response.json()
      setGuide(data)
    } catch (error) {
      console.error("載入指南失敗:", error)
    }
  }

const speakText = () => {
    if (!guide || !guide.steps) return
    window.speechSynthesis.cancel()

    const langMap = { 
      'zh': 'zh-TW', 'vi': 'vi-VN', 'id': 'id-ID', 'th': 'th-TH', 'en': 'en-US' 
    }
    const targetLang = langMap[currentLang] || 'zh-TW'

    let text = `${guide.title}。 ${guide.steps[0].text}。 ${guide.steps[1].text}`
    if (currentLang === 'zh') {
      text = text.replace(/CPR/gi, "西皮阿").replace(/119/g, "一一九")
    }

    const msg = new SpeechSynthesisUtterance(text)
    msg.lang = targetLang
    msg.volume = 1.0;
    msg.rate = 1.5;

    // --- 修正後的檢查邏輯 ---
    const getTargetVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      return voices.find(v => v.lang.replace('_', '-').includes(targetLang));
    };

    let targetVoice = getTargetVoice();

    // 如果第一次找不到，且當前是泰文，彈出提醒
    if (currentLang === 'th' && !targetVoice) {
      alert("您的裝置尚未安裝泰語語音包，請至系統設定下載，否則將無法正常朗讀泰文。");
    }

    if (targetVoice) msg.voice = targetVoice
    // ----------------------

    window.speechSynthesis.speak(msg)
  }

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
    gain.gain.setValueAtTime(0.8, audioCtx.current.currentTime)
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
      <h1 style={{ color: '#ff4444', marginBottom: '10px' }}>🚨 移工母語急救指引</h1>

      {/* --- 新增：緊急撥號按鈕 --- */}
      <div style={{ marginBottom: '25px' }}>
        <a href="tel:119" style={{ 
          display: 'block',
          backgroundColor: '#d32f2f', 
          color: 'white', 
          padding: '18px', 
          borderRadius: '12px', 
          fontSize: '22px', 
          fontWeight: 'bold', 
          textDecoration: 'none',
          boxShadow: '0 6px 12px rgba(211, 47, 47, 0.4)',
          border: '2px solid #b71c1c'
        }}>
          📞 撥打 119 求救 (Taiwan)
        </a>
      </div>
      {/* ---------------------- */}
      
      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
        {['zh', 'vi', 'id', 'th', 'en'].map(l => (
          <button 
            key={l} 
            onClick={() => loadGuide(l)} 
            style={{ 
              padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd',
              backgroundColor: currentLang === l ? '#ff4444' : '#fff',
              color: currentLang === l ? '#fff' : '#333', cursor: 'pointer'
            }}
          >
            {l === 'zh' ? '中文' : l === 'vi' ? 'Việt' : l === 'id' ? 'Indo' : l === 'th' ? 'ไทย' : 'English'}
          </button>
        ))}
      </div>

      {guide && (
        <div style={{ border: '2px solid #ff4444', borderRadius: '15px', padding: '20px', background: 'white', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '15px' }}>{guide.title}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ width: '150px' }}>
              <img src={`https://migrant-first-aid.onrender.com${guide.steps[0].img}`} width="100%" style={{ borderRadius: '10px' }} alt="Step 1" />
              <p style={{ fontSize: '14px', marginTop: '8px', fontWeight: 'bold' }}>{guide.steps[0].text}</p>
            </div>
            <div style={{ width: '150px' }}>
              <img src={`https://migrant-first-aid.onrender.com${guide.steps[1].img}`} width="100%" style={{ borderRadius: '10px' }} alt="Step 2" />
              <p style={{ fontSize: '14px', marginTop: '8px', fontWeight: 'bold' }}>{guide.steps[1].text}</p>
            </div>
          </div>
          <button onClick={speakText} style={{ marginTop: '15px', padding: '12px 25px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            🔊 語音朗讀
          </button>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '20px', borderTop: '2px dashed #ccc' }}>
        <h3>💓 CPR 按壓節奏器</h3>
        <button 
          onClick={toggleMetronome}
          style={{ 
            width: '110px', height: '110px', borderRadius: '50%', border: 'none',
            backgroundColor: isMetronomePlaying ? '#333' : '#ff4444',
            color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '18px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)', marginBottom: '10px'
          }}
        >
          {isMetronomePlaying ? '停止' : '開始'}<br/>(110 BPM)
        </button>
        <p style={{ color: '#666' }}>請跟著「嗶」聲規律按壓胸部</p>
      </div>
    </div>
  )
}

export default App