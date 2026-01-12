import React, { useState } from 'react'

function App() {
  const [guide, setGuide] = useState(null)
  const [currentLang, setCurrentLang] = useState('zh')

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
    if (!guide) return
    window.speechSynthesis.cancel()
    let text = `${guide.title}。 ${guide.steps[0].text}。 ${guide.steps[1].text}`
    if (currentLang === 'zh') {
      text = text.replace(/CPR/gi, "西皮阿").replace(/119/g, "一一九")
    }
    const msg = new SpeechSynthesisUtterance(text)
    msg.lang = { 'zh': 'zh-TW', 'vi': 'vi-VN', 'id': 'id-ID' }[currentLang] || 'zh-TW'
    window.speechSynthesis.speak(msg)
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>🚨 移工母語急救指引</h1>
      
      {/* 語言選擇 */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => loadGuide('zh')}>中文</button>
        <button onClick={() => loadGuide('vi')}>Việt</button>
        <button onClick={() => loadGuide('id')}>Indo</button>
        <button onClick={() => loadGuide('th')}>ไทย</button>
      </div>

      {/* 指引內容 */}
      {guide && (
        <div style={{ border: '2px solid #ff4444', borderRadius: '15px', padding: '20px', background: 'white' }}>
          <h2>{guide.title}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <img src={`https://migrant-first-aid.onrender.com${guide.steps[0].img}`} width="150" style={{ borderRadius: '10px' }} />
              <p>{guide.steps[0].text}</p>
            </div>
            <div>
              <img src={`https://migrant-first-aid.onrender.com${guide.steps[1].img}`} width="150" style={{ borderRadius: '10px' }} />
              <p>{guide.steps[1].text}</p>
            </div>
          </div>
          <button 
            onClick={speakText} 
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            🔊 語音朗讀
          </button>
        </div>
      )}
    </div>
  )
}

export default App