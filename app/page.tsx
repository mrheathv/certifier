'use client'

import { useState, useRef } from 'react'

type Stage = 'landing' | 'loading-questions' | 'quiz' | 'loading-certificate' | 'certificate'

interface QAPair {
  question: string
  answer: string
}

export default function Home() {
  const [stage, setStage] = useState<Stage>('landing')
  const [name, setName] = useState('')
  const [topic, setTopic] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [answers, setAnswers] = useState<QAPair[]>([])
  const [statement, setStatement] = useState('')
  const [error, setError] = useState('')
  const certificateRef = useRef<HTMLDivElement>(null)

  const startQuiz = async () => {
    if (!name.trim() || !topic.trim()) return
    setError('')
    setStage('loading-questions')
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuestions(data.questions)
      setCurrentQ(0)
      setCurrentAnswer('')
      setAnswers([])
      setStage('quiz')
    } catch (e) {
      setError('Failed to generate questions. Please try again.')
      setStage('landing')
    }
  }

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return
    const newAnswers = [...answers, { question: questions[currentQ], answer: currentAnswer }]
    setAnswers(newAnswers)
    setCurrentAnswer('')

    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1)
    } else {
      setStage('loading-certificate')
      try {
        const res = await fetch('/api/certificate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, topic, answers: newAnswers }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setStatement(data.statement)
        setStage('certificate')
      } catch (e) {
        setError('Failed to generate certificate. Please try again.')
        setStage('landing')
      }
    }
  }

  const downloadPDF = async () => {
    if (!certificateRef.current) return
    const { default: html2canvas } = await import('html2canvas')
    const { default: jsPDF } = await import('jspdf')
    const canvas = await html2canvas(certificateRef.current, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
    pdf.save(`${name.replace(/\s+/g, '_')}_${topic.replace(/\s+/g, '_')}_Certificate.pdf`)
  }

  const restart = () => {
    setStage('landing')
    setName('')
    setTopic('')
    setQuestions([])
    setAnswers([])
    setStatement('')
    setError('')
  }

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <main className="min-h-screen flex items-center justify-center p-6">

      {/* LANDING */}
      {stage === 'landing' && (
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="text-6xl mb-4">🎓</div>
            <h1 className="text-4xl font-bold text-white mb-2">Certifier</h1>
            <p className="text-slate-300 text-lg">Get certified in literally anything.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && startQuiz()}
                  placeholder="Jane Smith"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Topic to Get Certified In</label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && startQuiz()}
                  placeholder="e.g. Bread-making, Ancient Rome, Jazz..."
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={startQuiz}
                disabled={!name.trim() || !topic.trim()}
                className="w-full py-3 px-6 rounded-xl font-semibold text-navy-900 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-lg"
                style={{ color: '#0f2340' }}
              >
                Start Quiz →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOADING QUESTIONS */}
      {stage === 'loading-questions' && (
        <div className="text-center text-white">
          <div className="text-5xl mb-6 animate-spin">⚙️</div>
          <p className="text-xl font-medium">Generating your {topic} quiz...</p>
          <p className="text-slate-400 mt-2">Hang tight!</p>
        </div>
      )}

      {/* QUIZ */}
      {stage === 'quiz' && questions.length > 0 && (
        <div className="w-full max-w-xl">
          <div className="mb-6">
            <div className="flex justify-between text-sm text-slate-300 mb-2">
              <span>Question {currentQ + 1} of {questions.length}</span>
              <span className="font-medium text-amber-400">{topic}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
            <p className="text-white text-xl font-medium mb-6 leading-relaxed">{questions[currentQ]}</p>
            <textarea
              value={currentAnswer}
              onChange={e => setCurrentAnswer(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) submitAnswer() }}
              placeholder="Type your answer here..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-slate-400 text-xs">⌘+Enter to submit</span>
              <button
                onClick={submitAnswer}
                disabled={!currentAnswer.trim()}
                className="py-2 px-6 rounded-xl font-semibold bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                style={{ color: '#0f2340' }}
              >
                {currentQ + 1 === questions.length ? 'Finish →' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOADING CERTIFICATE */}
      {stage === 'loading-certificate' && (
        <div className="text-center text-white">
          <div className="text-5xl mb-6">✨</div>
          <p className="text-xl font-medium">Generating your certificate...</p>
          <p className="text-slate-400 mt-2">Almost there!</p>
        </div>
      )}

      {/* CERTIFICATE */}
      {stage === 'certificate' && (
        <div className="w-full max-w-3xl">
          <div ref={certificateRef} className="certificate-wrapper" style={{
            background: 'linear-gradient(145deg, #fefdf4 0%, #fffef8 100%)',
            border: '12px solid #1e3a5f',
            borderRadius: '4px',
            padding: '48px 64px',
            position: 'relative',
            fontFamily: 'Georgia, serif',
            boxShadow: 'inset 0 0 0 6px #c9a227, inset 0 0 0 8px #1e3a5f',
          }}>
            {/* Corner ornaments */}
            {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
              <div key={i} className={`absolute ${pos} text-2xl`} style={{ color: '#c9a227' }}>✦</div>
            ))}

            <div className="text-center">
              <p style={{ color: '#c9a227', fontSize: '13px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>
                ✦ &nbsp; Certificate of Achievement &nbsp; ✦
              </p>
              <div style={{ width: '120px', height: '2px', background: '#c9a227', margin: '0 auto 24px' }} />

              <p style={{ color: '#64748b', fontSize: '15px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                This certifies that
              </p>
              <h2 style={{ color: '#0f2340', fontSize: '44px', fontWeight: 'bold', margin: '8px 0', fontStyle: 'italic', lineHeight: 1.1 }}>
                {name}
              </h2>
              <p style={{ color: '#64748b', fontSize: '15px', letterSpacing: '2px', textTransform: 'uppercase', margin: '12px 0 4px' }}>
                is hereby certified in
              </p>
              <h3 style={{ color: '#1e3a5f', fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', textTransform: 'capitalize' }}>
                {topic}
              </h3>

              <div style={{ width: '200px', height: '1px', background: '#c9a22780', margin: '0 auto 24px' }} />

              <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.8', maxWidth: '520px', margin: '0 auto 32px', fontStyle: 'italic' }}>
                {statement}
              </p>

              {/* Seal */}
              <div style={{
                width: '90px', height: '90px', borderRadius: '50%',
                border: '4px solid #c9a227', background: '#1e3a5f',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 32px', boxShadow: '0 0 0 3px #c9a227, 0 0 0 6px #1e3a5f'
              }}>
                <div style={{ color: '#c9a227', fontSize: '24px', lineHeight: 1 }}>🎓</div>
                <div style={{ color: '#c9a227', fontSize: '8px', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px' }}>Certified</div>
              </div>

              <div style={{ width: '200px', height: '1px', background: '#c9a22780', margin: '0 auto 16px' }} />
              <p style={{ color: '#94a3b8', fontSize: '12px', letterSpacing: '2px' }}>
                Issued {today}
              </p>
            </div>
          </div>

          <div className="flex gap-4 mt-6 justify-center">
            <button
              onClick={downloadPDF}
              className="py-3 px-8 rounded-xl font-semibold text-lg bg-amber-400 hover:bg-amber-300 transition-all duration-200"
              style={{ color: '#0f2340' }}
            >
              📄 Download as PDF
            </button>
            <button
              onClick={restart}
              className="py-3 px-8 rounded-xl font-semibold text-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all duration-200"
            >
              ↩ Start Over
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
