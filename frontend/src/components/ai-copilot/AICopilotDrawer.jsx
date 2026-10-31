import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  X,
  Send,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const AICopilotDrawer = ({ isOpen, onClose, infrastructures = [] }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Hello, I am the **STRUCTURA AI Engineering Copilot**. I analyze structural defects, IoT vibration telemetry, and Remaining Useful Life (RUL) forecasting models across your infrastructure portfolio. How can I assist your inspection triage today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickQuestions = [
    'Which asset has the highest detected risk?',
    'What defects were identified in Bridge A?',
    'Which infrastructure requires priority inspection?',
    'Explain the latest vibration anomaly.',
    'What factors influenced the RUL estimate?',
  ];

  const handleSend = (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      const lower = query.toLowerCase();

      if (lower.includes('highest') || lower.includes('worst') || lower.includes('critical')) {
        reply = `**Highway Overpass B – Interstate 90 Concrete Span** currently exhibits the highest critical risk:
- **Health Score**: 52.0 / 100 (CRITICAL)
- **Priority**: IMMEDIATE_ACTION
- **Primary Issue**: Deep shear cracking located along the main concrete supporting deck.
- **Action**: Immediate structural closure of affected lanes and on-site non-destructive evaluation (NDE) recommended.`;
      } else if (lower.includes('bridge a') || lower.includes('corrosion')) {
        reply = `**Bridge A – Bay Cable-Stayed Viaduct** Inspection Summary:
- **Defects Identified**: Surface and crevice corrosion on anchor pier 03 with **93% AI confidence**.
- **Severity**: HIGH
- **Vibration Status**: Baseline dynamic RMS at 1.85 mm/s (Within normal operational parameters).
- **Projected RUL**: 18.4 Years remaining under current coastal salinity conditions.`;
      } else if (lower.includes('priority') || lower.includes('inspection')) {
        reply = `Current Portfolio Inspection Triage Order:
1. **Highway Overpass B** — *IMMEDIATE_ACTION* (Crack integrity compromise)
2. **Dam C – Cascade Hydroelectric Dam** — *URGENT* (Abnormal spillway resonance & surface cracking)
3. **Bridge A – Bay Viaduct** — *MONITOR* (Routine salt air corrosion mitigation)`;
      } else if (lower.includes('vibration') || lower.includes('anomaly')) {
        reply = `**Latest Vibration Telemetry Anomaly Detected on Dam C**:
- **Sensor**: VIB-DAM-01 (Crest Monitoring Station)
- **Peak Velocity**: 11.4 mm/s (Threshold: 6.5 mm/s)
- **Dominant Frequency**: 38.5 Hz
- **Isolation Forest Confidence**: 92.4% abnormal tag
- **Diagnosis**: High-amplitude resonant shock recorded during high-flow discharge operations.`;
      } else if (lower.includes('rul') || lower.includes('factors') || lower.includes('life')) {
        reply = `**Remaining Useful Life (RUL) Governing Factors**:
Our gradient boosting degradation regressor weights the following inputs:
1. **Defect Severity Impact** (-18.5% lifespan penalty)
2. **Dynamic Vibration Fatigue** (-8.0% cyclic stress penalty)
3. **Environmental Harshness Multiplier** (1.35x coastal / 1.5x industrial exposure)
4. **Structural Age & Cyclic Traffic Volume** (Daily design volume of 35,000 heavy axle equivalents).`;
      } else {
        reply = `Based on current telemetry for **${infrastructures.length} monitored assets**:
- Overall Portfolio Health: **74.2 / 100**
- Active Critical Alerts: **1 Urgent (Overpass B)**
- Sensor Anomaly Status: **Dam C Crest Sensor Triggered**

You can drill down into the **AI Defect Detection Studio**, **Interactive 3D Digital Twin**, or **Risk Assessment Center** for component-level breakdowns.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] shadow-2xl flex flex-col bg-navy-900 border-l border-cyan/30 backdrop-blur-xl">
        {/* Header */}
        <div className="p-4 border-b border-navy-700/80 bg-navy-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan to-blue-600 flex items-center justify-center text-navy-950 shadow-cyan-glow">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-soft-white font-mono">STRUCTURA COPILOT</h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan/15 text-cyan border border-cyan/30 uppercase font-mono">
                  AI ASSISTANT
                </span>
              </div>
              <p className="text-[11px] text-soft-muted">Multi-modal structural intelligence assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-soft-muted hover:text-soft-white hover:bg-navy-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Disclaimer banner */}
        <div className="px-4 py-2 bg-navy-800/40 border-b border-navy-700/50 flex items-center gap-2 text-[10px] text-soft-subtle">
          <ShieldAlert className="w-3.5 h-3.5 text-warning flex-shrink-0" />
          <span>Prototype AI Assistant: Synthesizes real-time API metrics for triage aid.</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-cyan text-navy-950 font-medium rounded-tr-none shadow-cyan-glow'
                    : 'bg-navy-800/90 text-soft-white border border-navy-700 rounded-tl-none shadow-md'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[9px] text-soft-subtle mt-1 px-1 font-mono">{m.timestamp}</span>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-navy-800/60 border border-navy-700 w-24">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 border-t border-navy-800 bg-navy-950/30">
          <p className="text-[10px] font-mono text-soft-subtle uppercase mb-2">Recommended Inquiries</p>
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-700 hover:border-cyan/40 text-soft-muted hover:text-soft-white text-left transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-3 border-t border-navy-700/80 bg-navy-950/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot about risk, cracks, or sensors..."
              className="flex-1 px-3 py-2 rounded-xl bg-navy-900 border border-navy-600/70 text-xs text-soft-white placeholder-soft-subtle focus:outline-none focus:border-cyan"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 rounded-xl bg-cyan text-navy-950 hover:bg-cyan-400 disabled:opacity-40 transition-colors shadow-cyan-glow"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </AnimatePresence>
  );
};
