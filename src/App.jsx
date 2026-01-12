import React, { useState, useRef } from 'react'

function App() {
  const [guide, setGuide] = useState(null)
  const [currentLang, setCurrentLang] = useState('zh')
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false)
  const metroInterval = useRef(null)
  const audioCtx = useRef(null)

  // 1. 從後端載入指南數據
  const loadGuide = async (lang) => {
    setCurrentLang(lang)
    try {
      // 請確保這是你部署在 Render 的後端網址
      const response = await fetch(`https://migrant-first-aid.onrender.com/guide/${lang}`)
      const data = await response.json()
      setGuide(data)
    } catch (error) {
      console.error("載入指南失敗:", error)
    }
  }

  // 2. 語音朗讀功能 (優化高音量與多國語系匹配)
  const speakText = () => {
    if (!guide || !guide.steps) return
    window.speechSynthesis.cancel() // 停止之前的聲音

    const langMap = { 
      'zh': 'zh-TW', 
      'vi': 'vi-VN', 
      'id': 'id-ID', 
      'th': 'th-TH',
      'en': 'en-US' 
    }
    const targetLang = langMap[currentLang] || 'zh-TW'

    // 組合要朗讀的文字內容
    let text = `${guide.title}。 ${guide.steps[0].text}。 ${guide.steps[1].text}`
    
    // 中文發音校正
    if (currentLang === 'zh') {
      text = text.replace(/CPR/gi, "西皮阿").replace(/119/g, "一一九")
    }

    const msg = new SpeechSynthesisUtterance(text)
    msg.lang = targetLang
    msg.volume = 1.0; // 設定最大音量
    msg.rate = 0.8;   // 語速稍慢以利辨識

    // 強制手動尋找系統中的語音引擎
    const voices = window.speechSynthesis.getVoices()
    const targetVoice = voices.find(v => 
      v.lang.replace('_', '-').includes(targetLang)
    )
    if (targetVoice) msg.voice = targetVoice

    window.speechSynthesis.speak(msg)
  }

  // 3. CPR 節奏器功能 (高穿透力音效)
  const playBeep = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    const osc = audioCtx.current.createOscillator()
    const gain = audioCtx.current.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, audioCtx.current.currentTime) // 提高頻率增加穿透力
    
    osc.connect(gain)
    gain.connect(audioCtx.current.destination)
    
    gain.gain.setValueAtTime(0.8, audioCtx.current.currentTime) // 調高節奏音量
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 0.15)
    
    osc.start()
    osc.stop(audioCtx.current.currentTime + 0.15)
  }

  const toggleMetronome = () => {
    if (isMetronomePlaying) {
      clearInterval(metroInterval.current)
      setIsMetronomePlaying(false)
    } else {
      const bpm = 110 // 標準 CPR 按壓頻率
      const ms = 60000 / bpm
      metroInterval.current = setInterval(playBeep, ms)
      setIsMetronomePlaying(true)
    }
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ color: '#ff4444' }}>🚨 移工母語急救指引</h1>
      
      {/* 語系切換按鈕 */}
      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
        {['zh', 'vi', 'id', 'th', 'en'].map(l => (
          <button 
            key={l} 
            onClick={() => loadGuide(l)} 
            style={{ 
              padding: '10px 15px', 
              borderRadius: '8px', 
              border: '1px solid #ddd',
              backgroundColor: currentLang === l ? '#ff4444' : '#fff',
              color: currentLang === l ? '#fff' : '#333',
              cursor: 'pointer'
            }}
          >
            {l === 'zh' ? '中文' : l === 'vi' ? 'Việt' : l === 'id' ? 'Indo' : l === 'th' ? 'ไทย' : 'English'}
          </button>
        ))}
      </div>

      {/* 指引內容顯示區 */}
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
          <button 
            onClick={speakText} 
            style={{ 
              marginTop: '15px', padding: '12px 25px', backgroundColor: '#4CAF50', 
              color: 'white', border: 'none', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold',
              cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            🔊 語音朗讀
          </button>
        </div>
      )}

      {/* 底部節奏器 */}
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