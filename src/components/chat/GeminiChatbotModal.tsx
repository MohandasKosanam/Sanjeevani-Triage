import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  Zap,
  Brain,
  RotateCcw,
  Copy,
  Check,
  History,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Ticket,
  AlertCircle
} from 'lucide-react';
import { chatStorage, ChatSession, ChatMessage } from '../../services/chatStorage';
import { useLanguage } from '../../context/LanguageContext';

type ModelType = 'gemini-3.1-flash-lite' | 'gemini-3.8-flash' | 'gemini-4-argon';
type RoleType = 'general' | 'specialist' | 'fast_triage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExtractTriage?: (symptomsText: string) => void;
}

export const GeminiChatbotModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onExtractTriage,
}) => {
  const { language, t } = useLanguage();
  const [selectedModel, setSelectedModel] = useState<ModelType>('gemini-3.8-flash');
  const [selectedRole, setSelectedRole] = useState<RoleType>('general');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Chat Sessions & History State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadSessions = async () => {
    const list = await chatStorage.getSessions();
    setSessions(list);

    if (list.length > 0 && !currentSessionId) {
      // Load most recent session
      loadSession(list[0]);
    } else if (list.length === 0) {
      startNewChat();
    }
  };

  const startNewChat = () => {
    const newId = `session-${Date.now()}`;
    const initialWelcome: ChatMessage = {
      id: `welcome-${Date.now()}`,
      sender: 'assistant',
      content:
        language === 'te'
          ? 'నమస్తే! నేను సంజీవని హెల్త్‌కేర్ అసిస్టెంట్‌ని. మీ లక్షణాలు, మందులు లేదా ఆసుపత్రి మార్గదర్శకాల గురించి అడగండి.'
          : language === 'hi'
          ? 'नमस्ते! मैं संजीवनी हेल्थकेयर असिस्टेंट हूँ। अपने लक्षण, दवाइयों या अस्पताल से संबंधित प्रश्न पूछें।'
          : 'Namaste! I am Sanjeevani Healthcare Assistant powered by Gemini. Ask me about symptoms, medicines, or hospital triage.',
      modelUsed: selectedModel,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newSession: ChatSession = {
      id: newId,
      title: language === 'te' ? 'కొత్త సంభాషణ' : language === 'hi' ? 'नया संवाद' : 'New Health Chat',
      model: selectedModel,
      role: selectedRole,
      messages: [initialWelcome],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentSessionId(newId);
    setMessages([initialWelcome]);
    setSessions((prev) => [newSession, ...prev]);
    setShowHistoryDrawer(false);
    chatStorage.saveSession(newSession);
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setSelectedModel(session.model);
    setSelectedRole(session.role);
    setMessages(session.messages);
    setShowHistoryDrawer(false);
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await chatStorage.deleteSession(sessionId);
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);

    if (currentSessionId === sessionId) {
      if (updated.length > 0) {
        loadSession(updated[0]);
      } else {
        startNewChat();
      }
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const chatHistory = updatedMessages.map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        content: m.content,
      }));

      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          model: selectedModel,
          role: selectedRole,
          language,
        }),
      });

      const data = await res.json();
      const botReply = data.success ? data.reply : 'I could not process your query at this moment.';
      const usedModel = data.modelUsed || selectedModel;

      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'assistant',
        content: botReply,
        modelUsed: usedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);

      // Save to active session
      const activeSession = sessions.find((s) => s.id === currentSessionId);
      const sessionTitle =
        activeSession?.title && !activeSession.title.includes('New') && !activeSession.title.includes('కొత్త')
          ? activeSession.title
          : userText.slice(0, 32);

      const savedSession: ChatSession = {
        id: currentSessionId,
        title: sessionTitle,
        model: selectedModel,
        role: selectedRole,
        messages: finalMessages,
        createdAt: activeSession?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSessions((prev) =>
        prev.map((s) => (s.id === currentSessionId ? savedSession : s))
      );
      chatStorage.saveSession(savedSession);
    } catch (err: any) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl h-[92vh] sm:h-[780px] flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistoryDrawer((prev) => !prev)}
              className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold ${
                showHistoryDrawer
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Toggle Chat History Drawer"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">{t.chatHistoryTitle}</span>
              <span className="text-[10px] bg-slate-700 px-1.5 py-0.2 rounded-full">
                {sessions.length}
              </span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
                  {t.chatModalTitle}
                </h2>
                <span className="text-[9px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-1.5 py-0.2 rounded-full">
                  Firestore Synced
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                {t.chatModalSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startNewChat}
              className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
              title="Start New Chat Thread"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.newChatBtn}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Model & Role Controls Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          {/* Model Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold text-[11px]">{t.modelLabel}</span>
            <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
              <button
                onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                  selectedModel === 'gemini-3.1-flash-lite'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-2.5 h-2.5 text-amber-600" /> Fast Lite
              </button>
              <button
                onClick={() => setSelectedModel('gemini-3.8-flash')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                  selectedModel === 'gemini-3.8-flash'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-2.5 h-2.5" /> General 3.8
              </button>
              <button
                onClick={() => setSelectedModel('gemini-4-argon')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                  selectedModel === 'gemini-4-argon'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Brain className="w-2.5 h-2.5" /> Complex 4
              </button>
            </div>
          </div>

          {/* Role Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold text-[11px]">{t.roleLabel}</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as RoleType)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] font-semibold text-slate-800 focus:outline-teal-600"
            >
              <option value="general">{t.roleGeneral}</option>
              <option value="specialist">{t.roleSpecialist}</option>
              <option value="fast_triage">{t.roleFastTriage}</option>
            </select>
          </div>
        </div>

        {/* Main Content Area (Chat Feed + Slide-in History Drawer) */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Slide-out Chat History Drawer */}
          {showHistoryDrawer && (
            <div className="absolute inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white border-r border-slate-800 p-4 flex flex-col shadow-2xl transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> {t.chatHistoryTitle}
                </span>
                <button
                  onClick={() => setShowHistoryDrawer(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={startNewChat}
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold mb-3 flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" /> {t.newChatBtn}
              </button>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    {t.noPastConversations}
                  </div>
                ) : (
                  sessions.map((sess) => (
                    <div
                      key={sess.id}
                      onClick={() => loadSession(sess)}
                      className={`p-2.5 rounded-xl text-xs cursor-pointer transition flex items-center justify-between group ${
                        sess.id === currentSessionId
                          ? 'bg-slate-800 border border-teal-500 text-white'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-semibold truncate">{sess.title}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{new Date(sess.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          <span>•</span>
                          <span>{sess.messages.length} msgs</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => deleteSession(sess.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                        title={t.deleteSession}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-left">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl p-4 text-xs leading-relaxed shadow-xs relative group ${
                    m.sender === 'user'
                      ? 'bg-teal-600 text-white rounded-br-xs'
                      : 'bg-slate-100 text-slate-900 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  <div
                    className={`flex items-center justify-between gap-3 mt-2 pt-1 border-t text-[10px] font-mono ${
                      m.sender === 'user'
                        ? 'border-teal-500 text-teal-200'
                        : 'border-slate-200 text-slate-400'
                    }`}
                  >
                    <span>{m.timestamp}</span>
                    {m.modelUsed && <span>{m.modelUsed}</span>}
                    <button
                      onClick={() => handleCopy(m.content, m.id)}
                      className="opacity-0 group-hover:opacity-100 transition p-0.5 hover:text-white"
                      title="Copy"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* If assistant gave a medical triage recommendation, provide quick action to get OPD token */}
                {m.sender === 'assistant' && onExtractTriage && (
                  <button
                    onClick={() => {
                      onClose();
                      onExtractTriage(m.content);
                    }}
                    className="mt-1 text-[11px] text-teal-700 hover:underline font-semibold flex items-center gap-1 self-start ml-2"
                  >
                    <Ticket className="w-3.5 h-3.5" /> {language === 'te' ? 'దీని నుండి ఓపీడీ టోకెన్ పొందండి' : language === 'hi' ? 'इसके लिए OPD टोकन लें' : 'Generate OPD Token for this'}
                  </button>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  <span>{t.thinkingNotice} ({selectedModel})</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggested Quick Prompts */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px] shrink-0">
          <span className="text-slate-400 font-bold shrink-0">{t.tryPrompt}</span>
          <button
            onClick={() => setInputMessage(
              language === 'te'
                ? 'నాకు గత రెండు రోజుల నుండి జ్వరం మరియు తీవ్రమైన కడుపు నొప్పి ఉంది'
                : language === 'hi'
                ? 'मुझे पिछले दो दिनों से बुखार और पेट में तेज दर्द है'
                : 'I have persistent fever and severe abdominal pain for 2 days'
            )}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-teal-400 shrink-0 text-left"
          >
            {language === 'te' ? 'జ్వరం & కడుపు నొప్పి' : language === 'hi' ? 'बुखार और पेट दर्द' : 'Fever & abdominal pain'}
          </button>
          <button
            onClick={() => setInputMessage(
              language === 'te'
                ? 'పారాసెటమాల్ 650 వేసుకున్న తర్వాత ఎన్ని గంటలకు మళ్లీ వేసుకోవాలి?'
                : language === 'hi'
                ? 'पैरासिटामोल 650 कितने घंटे बाद दोबारा ले सकते हैं?'
                : 'What is the safe interval between Paracetamol 650 dosages?'
            )}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-teal-400 shrink-0 text-left"
          >
            {language === 'te' ? 'మందుల మోతాదు ప్రశ్న' : language === 'hi' ? 'दवा खुराक नियम' : 'Paracetamol dosage check'}
          </button>
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={t.chatInputPlaceholder}
            className="flex-1 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition shadow-xs ${
              !inputMessage.trim() || isLoading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
