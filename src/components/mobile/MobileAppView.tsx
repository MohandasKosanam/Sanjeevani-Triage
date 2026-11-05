import React, { useState, useEffect } from 'react';
import {
  Home,
  FileText,
  Ticket,
  User,
  Mic,
  Camera,
  MapPin,
  ChevronRight,
  Globe,
  Phone,
  Sparkles,
  HeartPulse,
  ArrowRight,
  Radio,
  MessageSquare,
  Bot,
  Send,
  Plus,
  History,
  Trash2,
  Brain,
  Zap
} from 'lucide-react';
import { DailyHealthInsightCard } from './DailyHealthInsightCard';
import { VoiceTriageSheet } from './VoiceTriageSheet';
import { PrescriptionScannerSheet } from './PrescriptionScannerSheet';
import { GeminiLiveVoiceModal } from '../live/GeminiLiveVoiceModal';
import { GeminiChatbotModal } from '../chat/GeminiChatbotModal';
import { SOSEmergencyButton } from './SOSEmergencyButton';
import { OPDTokensList } from './OPDTokensList';
import { HealthRecordsView } from './HealthRecordsView';
import { api } from '../../services/api';
import { UserProfile, OPDToken, DailyHealthInsight, Language } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { chatStorage, ChatSession, ChatMessage } from '../../services/chatStorage';

interface Props {
  onSOSCreated?: () => void;
  onTriageCreated?: () => void;
}

export const MobileAppView: React.FC<Props> = ({ onSOSCreated, onTriageCreated }) => {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'records' | 'tokens' | 'profile'>('home');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [healthInsight, setHealthInsight] = useState<DailyHealthInsight | null>(null);
  const [tokens, setTokens] = useState<OPDToken[]>([]);
  const [voiceSheetOpen, setVoiceSheetOpen] = useState(false);
  const [rxSheetOpen, setRxSheetOpen] = useState(false);
  const [liveVoiceOpen, setLiveVoiceOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  // Embedded In-App Chat State for seamless native experience
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatModel, setChatModel] = useState<'gemini-3.1-flash-lite' | 'gemini-3.8-flash' | 'gemini-4-argon'>('gemini-3.8-flash');
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);

  useEffect(() => {
    loadInitialData();
    loadChatSessions();
  }, []);

  const loadInitialData = async () => {
    try {
      const [u, h, tok] = await Promise.all([
        api.getProfile(),
        api.getHealthInsights(),
        api.getTokens(),
      ]);
      setProfile(u);
      setHealthInsight(h);
      setTokens(tok);
    } catch (e) {
      console.error('Error loading mobile data:', e);
    }
  };

  const loadChatSessions = async () => {
    const list = await chatStorage.getSessions();
    setChatSessions(list);
    if (list.length > 0) {
      setCurrentSessionId(list[0].id);
      setChatMessages(list[0].messages);
      setChatModel(list[0].model);
    } else {
      initNewChatSession();
    }
  };

  const initNewChatSession = () => {
    const newId = `session-${Date.now()}`;
    const initialWelcome: ChatMessage = {
      id: `welcome-${Date.now()}`,
      sender: 'assistant',
      content:
        language === 'te'
          ? 'నమస్తే! నేను సంజీవని AI హెల్త్ అసిస్టెంట్‌ని. మీ లక్షణాలు, మందులు లేదా ఆసుపత్రి మార్గదర్శకాల గురించి నన్ను అడగండి.'
          : language === 'hi'
          ? 'नमस्ते! मैं संजीवनी AI हेल्थ असिस्टेंट हूँ। अपने लक्षण, दवाइयों या अस्पताल से संबंधित प्रश्न पूछें।'
          : 'Namaste! I am Sanjeevani AI Healthcare Assistant. Ask me about symptoms, medicines, or hospital OPD triage.',
      modelUsed: chatModel,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newSession: ChatSession = {
      id: newId,
      title: language === 'te' ? 'కొత్త సంభాషణ' : language === 'hi' ? 'नया संवाद' : 'New Health Chat',
      model: chatModel,
      role: 'general',
      messages: [initialWelcome],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentSessionId(newId);
    setChatMessages([initialWelcome]);
    setChatSessions((prev) => [newSession, ...prev]);
    setShowHistoryDropdown(false);
    chatStorage.saveSession(newSession);
  };

  const handleSelectSession = (sess: ChatSession) => {
    setCurrentSessionId(sess.id);
    setChatMessages(sess.messages);
    setChatModel(sess.model);
    setShowHistoryDropdown(false);
  };

  const handleDeleteSession = async (sessId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await chatStorage.deleteSession(sessId);
    const updated = chatSessions.filter((s) => s.id !== sessId);
    setChatSessions(updated);
    if (currentSessionId === sessId) {
      if (updated.length > 0) {
        handleSelectSession(updated[0]);
      } else {
        initNewChatSession();
      }
    }
  };

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput.trim();
    setChatInput('');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setIsChatLoading(true);

    try {
      const history = updated.map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        content: m.content,
      }));

      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          model: chatModel,
          role: 'general',
          language,
        }),
      });

      const data = await res.json();
      const botText = data.success ? data.reply : 'Could not process query.';
      const usedModel = data.modelUsed || chatModel;

      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'assistant',
        content: botText,
        modelUsed: usedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalMessages = [...updated, botMsg];
      setChatMessages(finalMessages);

      const active = chatSessions.find((s) => s.id === currentSessionId);
      const title =
        active?.title && !active.title.includes('New') && !active.title.includes('కొత్త')
          ? active.title
          : userText.slice(0, 28);

      const saved: ChatSession = {
        id: currentSessionId,
        title,
        model: chatModel,
        role: 'general',
        messages: finalMessages,
        createdAt: active?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setChatSessions((prev) =>
        prev.map((s) => (s.id === currentSessionId ? saved : s))
      );
      chatStorage.saveSession(saved);
    } catch (err) {
      console.error('In-app chat error:', err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const handleTokenGenerated = (newToken: OPDToken) => {
    setTokens((prev) => [newToken, ...prev]);
    if (onTriageCreated) onTriageCreated();
  };

  const handleSOSDispatched = () => {
    if (onSOSCreated) onSOSCreated();
  };

  return (
    <div className="w-full flex justify-center py-2 sm:py-6">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-[390px] h-[810px] bg-white rounded-[40px] shadow-2xl border-8 border-slate-900 flex flex-col overflow-hidden relative select-none">
        {/* Device Top Status Bar */}
        <div className="bg-white pt-2.5 px-6 pb-2 flex items-center justify-between text-[11px] font-semibold text-slate-800 shrink-0 z-20 border-b border-slate-100">
          <span>9:41</span>
          {/* Dynamic Island / Speaker notch */}
          <div className="w-20 h-4 bg-slate-900 rounded-full" />
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="text-[10px]">5G</span>
            <div className="w-5 h-2.5 border border-slate-700 rounded-xs p-0.5 flex items-center">
              <div className="w-full h-full bg-slate-800 rounded-xs" />
            </div>
          </div>
        </div>

        {/* App Top Bar */}
        <div className="bg-white px-4 py-2.5 flex items-center justify-between border-b border-slate-100 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              सं
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
                {t.appTitle} <span className="text-[9px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">OPD</span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-teal-600" /> {t.medicalHubLocation}
              </div>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {(['te', 'hi', 'en'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase transition ${
                  language === lang
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'te' ? 'తెలుగు' : lang === 'hi' ? 'हिंदी' : 'EN'}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Main Screen Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5">
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <>
              {/* Patient Greeting */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-base font-extrabold text-slate-900">
                    {t.greeting(profile?.name || (language === 'te' ? 'రమేష్ వర్మ' : language === 'hi' ? 'रमेश वर्मा' : 'Ramesh Varma'))}
                  </h1>
                  <p className="text-[11px] text-slate-500">{t.greetingSubtitle}</p>
                </div>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="w-9 h-9 rounded-full bg-teal-100 border border-teal-300 text-teal-800 flex items-center justify-center font-bold text-xs shadow-xs hover:bg-teal-200 transition"
                  title="View Profile"
                >
                  {profile?.name ? profile.name.charAt(0) : 'R'}
                </button>
              </div>

              {/* Daily Health Insight Card */}
              <DailyHealthInsightCard insight={healthInsight} />

              {/* PRIMARY ZERO-UI HERO CTA: Speak Symptoms */}
              <div
                onClick={() => setVoiceSheetOpen(true)}
                className="relative bg-gradient-to-br from-teal-600 to-teal-800 text-white rounded-3xl p-4 sm:p-5 shadow-lg shadow-teal-700/20 cursor-pointer hover:shadow-teal-700/30 transition group overflow-hidden"
              >
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition duration-500" />

                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                    <Mic className="w-5 h-5 animate-pulse" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 text-teal-50 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    Multimodal AI
                  </span>
                </div>

                <div className="text-sm font-black tracking-tight">
                  {t.speakSymptomsTitle}
                </div>
                <p className="text-[11px] text-teal-100 mt-1 leading-relaxed">
                  {t.speakSymptomsDesc}
                </p>

                <div className="mt-3 pt-2.5 border-t border-teal-500/40 flex items-center justify-between text-xs font-semibold text-teal-100 group-hover:text-white">
                  <span>{t.holdToSpeak}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>

              {/* SECONDARY ACTION: Smart Rx Decoder */}
              <div
                onClick={() => setRxSheetOpen(true)}
                className="bg-slate-50 border border-slate-200 hover:border-teal-400 rounded-3xl p-3.5 cursor-pointer transition shadow-xs flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700">
                      {t.smartRxTitle}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {t.smartRxDesc}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0" />
              </div>

              {/* GEMINI 3.8 LIVE & MULTI-TURN CHAT CARDS */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Live API Voice Call */}
                <div
                  onClick={() => setLiveVoiceOpen(true)}
                  className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-3.5 cursor-pointer hover:border-teal-400 border border-slate-800 transition shadow-xs flex flex-col justify-between group text-left"
                >
                  <div>
                    <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center mb-1.5">
                      <Radio className="w-3.5 h-3.5 animate-pulse text-teal-400" />
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-teal-300">
                      {t.liveVoiceTitle}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                      {t.liveVoiceDesc}
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-teal-300 font-semibold flex items-center justify-between">
                    <span>{t.talkLive}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Multi-turn Chatbot Quick Launch */}
                <div
                  onClick={() => setActiveTab('chat')}
                  className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-3xl p-3.5 cursor-pointer hover:border-teal-400 border border-slate-800 transition shadow-xs flex flex-col justify-between group text-left"
                >
                  <div>
                    <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-1.5">
                      <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-teal-300">
                      {t.aiChatTitle}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                      {t.aiChatDesc}
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-teal-300 font-semibold flex items-center justify-between">
                    <span>{t.openChat}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Latest OPD Token Preview */}
              {tokens.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                      {t.activeOpdTokensTitle}
                    </span>
                    <button
                      onClick={() => setActiveTab('tokens')}
                      className="text-[10px] text-teal-600 font-semibold hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <OPDTokensList tokens={[tokens[0]]} />
                </div>
              )}

              {/* Emergency Assistance Direct Helpline Bar */}
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-rose-600" />
                  <div>
                    <div className="text-xs font-bold text-rose-900">{t.ambulanceHelpline}</div>
                    <div className="text-[9px] text-rose-700">Toll-free emergency dialer</div>
                  </div>
                </div>
                <a
                  href="tel:108"
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-xl transition shadow-xs"
                >
                  {t.dial108}
                </a>
              </div>
            </>
          )}

          {/* DEDICATED IN-APP CHAT TAB WITH HISTORY */}
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col -mx-4 -my-3 bg-slate-50">
              {/* Chat Sub-header with History Drawer Trigger & Model Picker */}
              <div className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between shrink-0 shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHistoryDropdown((prev) => !prev)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs flex items-center gap-1 font-semibold"
                    title={t.chatHistoryTitle}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span className="text-[10px] bg-slate-700 px-1 rounded-full">{chatSessions.length}</span>
                  </button>
                  <div className="leading-tight">
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      {t.chatModalTitle}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate max-w-[150px]">
                      {chatSessions.find((s) => s.id === currentSessionId)?.title || t.newChatBtn}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Model Toggle */}
                  <select
                    value={chatModel}
                    onChange={(e) => setChatModel(e.target.value as any)}
                    className="bg-slate-800 border border-slate-700 text-[10px] font-semibold text-teal-300 rounded-lg px-1.5 py-1 focus:outline-none"
                  >
                    <option value="gemini-3.1-flash-lite">Fast Lite</option>
                    <option value="gemini-3.8-flash">General 3.8</option>
                    <option value="gemini-4-argon">Argon 4</option>
                  </select>

                  <button
                    onClick={initNewChatSession}
                    className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
                    title={t.newChatBtn}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Slide-down History Session Selector */}
              {showHistoryDropdown && (
                <div className="bg-slate-800 text-white p-3 border-b border-slate-700 text-xs shadow-lg space-y-2 max-h-56 overflow-y-auto">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-teal-400 flex items-center gap-1">
                      <History className="w-3 h-3" /> {t.chatHistoryTitle}
                    </span>
                    <button
                      onClick={() => setShowHistoryDropdown(false)}
                      className="text-slate-400 hover:text-white text-[10px]"
                    >
                      Close
                    </button>
                  </div>

                  {chatSessions.length === 0 ? (
                    <div className="text-slate-400 text-[11px] py-2 text-center">{t.noPastConversations}</div>
                  ) : (
                    chatSessions.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectSession(s)}
                        className={`p-2 rounded-xl text-left cursor-pointer transition flex items-center justify-between ${
                          s.id === currentSessionId
                            ? 'bg-teal-900/60 border border-teal-500 text-white'
                            : 'hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="text-[11px] font-semibold truncate">{s.title}</div>
                          <div className="text-[9px] text-slate-400">
                            {new Date(s.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {s.messages.length} msgs
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition"
                          title={t.deleteSession}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Chat Feed Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {chatMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                        m.sender === 'user'
                          ? 'bg-teal-600 text-white rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.content}</div>
                      <div
                        className={`flex items-center justify-between gap-2 mt-1.5 pt-1 border-t text-[9px] font-mono ${
                          m.sender === 'user' ? 'border-teal-500 text-teal-200' : 'border-slate-100 text-slate-400'
                        }`}
                      >
                        <span>{m.timestamp}</span>
                        {m.modelUsed && <span>{m.modelUsed}</span>}
                      </div>
                    </div>

                    {/* Quick Action to trigger Voice Triage / OPD Token if bot recommends */}
                    {m.sender === 'assistant' && (
                      <button
                        onClick={() => setVoiceSheetOpen(true)}
                        className="mt-1 text-[10px] text-teal-700 hover:underline font-semibold flex items-center gap-1 self-start ml-1"
                      >
                        <Ticket className="w-3 h-3" />
                        <span>{language === 'te' ? 'దీని కోసం ఓపీడీ టోకెన్ పొందండి' : language === 'hi' ? 'इसके लिए OPD टोकन लें' : 'Get OPD Token for this'}</span>
                      </button>
                    )}
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex items-start gap-2">
                    <div className="bg-white border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-500 flex items-center gap-2 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                      <span>{t.thinkingNotice} ({chatModel})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Prompts */}
              <div className="px-3 py-1.5 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[10px] shrink-0">
                <button
                  onClick={() => setChatInput(
                    language === 'te'
                      ? 'నాకు గత రెండు రోజుల నుండి జ్వరం మరియు దగ్గు ఉంది'
                      : language === 'hi'
                      ? 'मुझे दो दिनों से बुखार और खांसी है'
                      : 'I have had fever and persistent cough for 2 days'
                  )}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-teal-50 border border-slate-200 rounded-md text-slate-700 shrink-0 text-left"
                >
                  {language === 'te' ? 'జ్వరం & దగ్గు' : language === 'hi' ? 'बुखार और खांसी' : 'Fever & cough'}
                </button>
                <button
                  onClick={() => setChatInput(
                    language === 'te'
                      ? 'పారాసెటమాల్ 650 రోజుకు ఎన్ని సార్లు వేసుకోవచ్చు?'
                      : language === 'hi'
                      ? 'पैरासिटामोल 650 दिन में कितनी बार ले सकते हैं?'
                      : 'How many times a day can Paracetamol 650 be taken?'
                  )}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-teal-50 border border-slate-200 rounded-md text-slate-700 shrink-0 text-left"
                >
                  {language === 'te' ? 'పారాసెటమాల్ మోతాదు' : language === 'hi' ? 'दवा खुराक' : 'Paracetamol dosage'}
                </button>
              </div>

              {/* Chat Input Field */}
              <form onSubmit={handleSendChatMessage} className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5 shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={t.chatInputPlaceholder}
                  className="flex-1 bg-slate-100 border border-slate-200 focus:border-teal-600 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition shadow-2xs ${
                    !chatInput.trim() || isChatLoading
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* RECORDS TAB */}
          {activeTab === 'records' && (
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 mb-2.5">{t.healthRecordsTitle}</h2>
              <HealthRecordsView />
            </div>
          )}

          {/* TOKENS TAB */}
          {activeTab === 'tokens' && (
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 mb-2.5">{t.digitalOpdToken}</h2>
              <OPDTokensList tokens={tokens} />
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && profile && (
            <div className="space-y-3 text-left">
              <h2 className="text-sm font-extrabold text-slate-900">{t.profileTitle}</h2>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-slate-900">{profile.name}</div>
                <div className="text-[11px] text-slate-600">Phone: {profile.phone}</div>
                <div className="text-[11px] text-slate-600">Age: {profile.age} • Gender: {profile.gender}</div>
                <div className="text-[11px] text-slate-600">Language: {language.toUpperCase()}</div>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-1">
                <div className="text-[11px] font-bold text-rose-900 uppercase">{t.emergencyContact}</div>
                <div className="text-xs font-semibold text-slate-800">
                  {profile.emergency_contact.name} ({profile.emergency_contact.relationship})
                </div>
                <div className="text-[11px] text-slate-600">{profile.emergency_contact.phone}</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                <div className="text-[11px] font-bold text-slate-700 uppercase">{t.medicalFlags}</div>
                <div className="text-[11px] text-slate-600">
                  {t.knownConditions}: {profile.known_conditions?.join(', ') || t.noneRecorded}
                </div>
                <div className="text-[11px] text-slate-600">
                  {t.allergies}: {profile.allergies?.join(', ') || t.noneRecorded}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Device Bottom Native Navigation Bar */}
        <div className="bg-white border-t border-slate-200 px-3 py-1.5 flex items-center justify-between shrink-0 z-20">
          {/* Home Tab */}
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-0.5 flex-1 transition ${
              activeTab === 'home' ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[9px]">{t.navHome}</span>
          </button>

          {/* Chat Tab - DEDICATED FIRST-CLASS CHAT TAB */}
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center gap-0.5 flex-1 transition ${
              activeTab === 'chat' ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span className="text-[9px]">{t.navChat}</span>
          </button>

          {/* CENTRAL 2.5-SECOND SOS BUTTON */}
          <div className="flex-1 flex justify-center -mt-5">
            <SOSEmergencyButton onSOSCreated={handleSOSDispatched} />
          </div>

          {/* Records Tab */}
          <button
            onClick={() => setActiveTab('records')}
            className={`flex flex-col items-center gap-0.5 flex-1 transition ${
              activeTab === 'records' ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-[9px]">{t.navRecords}</span>
          </button>

          {/* Tokens Tab */}
          <button
            onClick={() => setActiveTab('tokens')}
            className={`flex flex-col items-center gap-0.5 flex-1 transition ${
              activeTab === 'tokens' ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span className="text-[9px]">{t.navTokens}</span>
          </button>
        </div>

        {/* Modal Sheets */}
        <VoiceTriageSheet
          isOpen={voiceSheetOpen}
          onClose={() => setVoiceSheetOpen(false)}
          preferredLanguage={language}
          onTokenGenerated={handleTokenGenerated}
        />

        <PrescriptionScannerSheet
          isOpen={rxSheetOpen}
          onClose={() => setRxSheetOpen(false)}
          preferredLanguage={language}
        />

        <GeminiLiveVoiceModal
          isOpen={liveVoiceOpen}
          onClose={() => setLiveVoiceOpen(false)}
          preferredLanguage={language}
        />

        <GeminiChatbotModal
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
        />
      </div>
    </div>
  );
};
