import React, { useState } from 'react';
import {
  Smartphone,
  Building2,
  Split,
  FolderTree,
  AlertOctagon,
  Activity,
  HeartPulse,
  Radio,
  ExternalLink,
  Bot,
  Globe
} from 'lucide-react';
import { MobileAppView } from './components/mobile/MobileAppView';
import { HospitalAdminView } from './components/admin/HospitalAdminView';
import { SplitView } from './components/SplitView';
import { MonorepoExplorer } from './components/MonorepoExplorer';
import { GeminiLiveVoiceModal } from './components/live/GeminiLiveVoiceModal';
import { GeminiChatbotModal } from './components/chat/GeminiChatbotModal';
import { useLanguage } from './context/LanguageContext';
import { Language } from './types';

type ActiveView = 'mobile' | 'admin' | 'split' | 'monorepo';

export function App() {
  const { language, setLanguage, t } = useLanguage();
  const [activeView, setActiveView] = useState<ActiveView>('split');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  const triggerUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
              सं
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white">{t.appTitle}</span>
                <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full">
                  AI Healthcare
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Navigation View Switcher */}
          <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700/80 self-start md:self-center">
            <button
              onClick={() => setActiveView('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeView === 'split'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>{t.dualScreenView}</span>
            </button>

            <button
              onClick={() => setActiveView('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeView === 'mobile'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{t.patientAppView}</span>
            </button>

            <button
              onClick={() => setActiveView('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeView === 'admin'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{t.adminQueueView}</span>
            </button>

            <button
              onClick={() => setActiveView('monorepo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeView === 'monorepo'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>{t.monorepoView}</span>
            </button>
          </div>

          {/* Global Language Selector & AI Launchers */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            {/* Global Language Switcher */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
              {(['te', 'hi', 'en'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    language === lang
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={`Switch language to ${lang === 'te' ? 'Telugu' : lang === 'hi' ? 'Hindi' : 'English'}`}
                >
                  {lang === 'te' ? 'తెలుగు' : lang === 'hi' ? 'हिंदी' : 'English'}
                </button>
              ))}
            </div>

            {/* Quick AI Launchers */}
            <button
              onClick={() => setIsLiveModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-sm hover:from-teal-500 hover:to-indigo-500 transition"
              title="Real-time Live Audio with gemini-3.8-live"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-teal-200" />
              <span>{t.liveVoiceBtn}</span>
            </button>

            <button
              onClick={() => setIsChatModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition"
              title="Multi-turn Chatbot (gemini-4-argon / 3.8-flash / 3.1-flash-lite)"
            >
              <Bot className="w-3.5 h-3.5 text-teal-400" />
              <span>{t.aiChatBtn}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-2 sm:p-6 flex flex-col items-center">
        {activeView === 'split' && <SplitView onRefreshTrigger={triggerUpdate} />}
        {activeView === 'mobile' && (
          <div className="w-full flex justify-center py-4">
            <MobileAppView onSOSCreated={triggerUpdate} onTriageCreated={triggerUpdate} />
          </div>
        )}
        {activeView === 'admin' && (
          <div className="w-full">
            <HospitalAdminView />
          </div>
        )}
        {activeView === 'monorepo' && <MonorepoExplorer />}
      </main>

      {/* Modals */}
      <GeminiLiveVoiceModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        preferredLanguage={language}
      />

      <GeminiChatbotModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
      />

      {/* Bottom Architectural Verification Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <div>
            <span className="font-bold text-slate-300">{t.appTitle}</span> • Powered by Google Gemini Multimodal AI (3.8 Flash, 3.8 Live, 4 Argon & 3.1 Flash Lite).
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>{t.medicalHubLocation}</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t.servicesOperational}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
