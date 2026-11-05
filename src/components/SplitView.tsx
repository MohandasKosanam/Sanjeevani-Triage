import React from 'react';
import { MobileAppView } from './mobile/MobileAppView';
import { HospitalAdminView } from './admin/HospitalAdminView';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  onRefreshTrigger?: () => void;
}

export const SplitView: React.FC<Props> = ({ onRefreshTrigger }) => {
  const { language } = useLanguage();

  const title =
    language === 'te'
      ? 'ఇంటరాక్టివ్ ఎండ్-టు-ఎండ్ సిమ్యులేషన్ మోడ్'
      : language === 'hi'
      ? 'इंटरैक्टिव एंड-टू-एंड सिमुलेशन मोड'
      : 'Interactive End-to-End Simulation Mode';

  const desc =
    language === 'te'
      ? 'రోగి మొబైల్ యాప్‌లో (ఎడమవైపు) వాయిస్ ట్రయాజ్ లేదా 2.5s ఎమర్జెన్సీ SOS ప్రారంభించండి మరియు ఆసుపత్రి అడ్మిన్ డ్యాష్‌బోర్డ్‌లో (కుడివైపు) రియల్-టైమ్ ప్రాధాన్యత సార్టింగ్‌ను గమనించండి.'
      : language === 'hi'
      ? 'मरीज़ मोबाइल ऐप (बाएं) पर वॉयस ट्राइएज या 2.5s इमरजेंसी SOS शुरू करें और अस्पताल व्यवस्थापक डैशबोर्ड (दाएं) पर रीयल-टाइम गंभीरता प्राथमिकता देखें।'
      : 'Trigger a Voice Triage or 2.5s Emergency SOS on the Patient Mobile App (Left) and observe instant real-time severity sorting on the Hospital Admin Dashboard (Right).';

  return (
    <div className="w-full max-w-[1700px] mx-auto p-2 sm:p-4">
      {/* Informational banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-4 sm:p-5 mb-6 shadow-md border border-teal-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-xs text-slate-300">
              {desc}
            </p>
          </div>
        </div>
        <div className="text-xs text-teal-300 font-mono flex items-center gap-2">
          <span>Real-time SSE Gateway Active</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Side-by-Side Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Mobile App */}
        <div className="lg:col-span-5 flex justify-center">
          <MobileAppView
            onSOSCreated={onRefreshTrigger}
            onTriageCreated={onRefreshTrigger}
          />
        </div>

        {/* Right Column: Hospital Command Center */}
        <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-[36px] p-2 sm:p-4 shadow-sm">
          <HospitalAdminView />
        </div>
      </div>
    </div>
  );
};
