import React, { useState, useRef } from 'react'

function App() {
  const [guide, setGuide] = useState(null)
  const [currentLang, setCurrentLang] = useState('zh')
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false)
  const metroInterval = useRef(null)
  const audioCtx = useRef(null)

  // 介面文字對照表 (i18n)
  const uiText = {
    zh: { title: "🚨 移工母語急救指引", call: "📞 撥打 119 求救 (Taiwan)", metro: "💓 CPR 按壓節奏器", metroStart: "開始", metroStop: "停止", metroDesc: "請跟著「嗶」聲規律按壓胸部" },
    en: { title: "🚨 Migrant First Aid Guide", call: "📞 Call 119 (Emergency)", metro: "💓 CPR Metronome", metroStart: "Start", metroStop: "Stop", metroDesc: "Follow the 'beep' to press the chest" },
    vi: { title: "🚨 Hướng dẫn sơ cứu", call: "📞 Gọi 119 (Cấp cứu)", metro: "💓 Máy đếm nhịp CPR", metroStart: "Bắt đầu", metroStop: "Dừng", metroDesc: "Ấn ngực theo tiếng 'bíp'" },
    id: { title: "🚨 Panduan Pertolongan Pertama", call: "📞 Panggil 119 (Darurat)", metro: "💓 Metronom CPR", metroStart: "Mulai", metroStop: "Berhenti", metroDesc: "Tekan dada sesuai bunyi 'beep'" },
    th: { title: "🚨 คู่มือปฐมพยาบาล", call: "📞 โทร 119 (ฉุกเฉิน)", metro: "💓 เครื่องให้จังหวะ CPR", metroStart: "เริ่ม", metroStop: "หยุด", metroDesc: "กดหน้าอกตามเสียง 'บี๊บ'" }
  };

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

    const langMap = { 'zh': 'zh-TW', 'vi': 'vi-VN', 'id': 'id-ID', 'th': 'th-TH', 'en': 'en-US' }
    const targetLang = langMap[currentLang] || 'zh-TW'

    let text = `${guide.title}。 ${guide.steps[0].text}。 ${guide.steps[1].text}`
    if (currentLang === 'zh') {
      text = text.replace(/CPR/gi, "西皮阿").replace(/119/g, "一一九")
    }

    const msg = new SpeechSynthesisUtterance(text)
    msg.lang = targetLang
    msg.volume = 1.0
    msg.rate = 1.2 // 依照您的要求加快語速

    const voices = window.speechSynthesis.getVoices()
    const targetVoice = voices.find(v => v.lang.replace('_', '-').includes(targetLang))

    // 泰文語音包檢查
    if (currentLang === 'th' && !targetVoice) {
      alert("您的裝置尚未安裝泰語語音包，請至系統設定下載。")
    }

    if (targetVoice) msg.voice = targetVoice
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
      <h1 style={{ color: '#ff4444', marginBottom: '10px' }}>{uiText[currentLang].title}</h1>

      <div style={{ marginBottom: '25px' }}>
        <a href="tel:119" style={{ 
          display: 'block', backgroundColor: '#d32f2f', color: 'white', padding: '18px', 
          borderRadius: '12px', fontSize: '22px', fontWeight: 'bold', textDecoration: 'none',
          boxShadow: '0 6px 12px rgba(211, 47, 47, 0.4)'
        }}>
          {uiText[currentLang].call}
        </a>
      </div>
      
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
        <div style={{ border: '2px solid #ff4444', borderRadius: '15px', padding: '20px', background: 'white', marginBottom: '20px' }}>
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
          <button onClick={speakText} style={{ marginTop: '15px', padding: '12px 25px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold' }}>
            🔊 語音朗讀
          </button>
        </div>
      )}

      {/* 底部節奏器 (支援多國語言) */}
      <div style={{ marginTop: '30px', padding: '20px', borderTop: '2px dashed #ccc' }}>
        <h3>{uiText[currentLang].metro}</h3>
        <button 
          onClick={toggleMetronome}
          style={{ 
            width: '110px', height: '110px', borderRadius: '50%', border: 'none',
            backgroundColor: isMetronomePlaying ? '#333' : '#ff4444',
            color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '18px'
          }}
        >
          {isMetronomePlaying ? uiText[currentLang].metroStop : uiText[currentLang].metroStart}<br/>(110 BPM)
        </button>
        <p style={{ color: '#666', marginTop: '10px' }}>{uiText[currentLang].metroDesc}</p>
      </div>
    </div>
  )
}

export default App