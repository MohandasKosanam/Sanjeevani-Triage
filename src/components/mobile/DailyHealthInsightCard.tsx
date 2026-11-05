import React from 'react';
import { Activity, Moon, Heart, CloudSun, Info } from 'lucide-react';
import { DailyHealthInsight } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  insight: DailyHealthInsight | null;
}

export const DailyHealthInsightCard: React.FC<Props> = ({ insight }) => {
  const { language, t } = useLanguage();
  if (!insight) return null;

  return (
    <div className="bg-gradient-to-br from-teal-900/10 via-slate-900/5 to-teal-800/10 border border-teal-500/20 rounded-2xl p-3.5 shadow-xs">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-600/20 text-teal-600 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-slate-800 tracking-wide uppercase">{t.dailyHealthInsight}</h3>
            <p className="text-[9px] text-slate-500 flex items-center gap-1">
              <CloudSun className="w-2.5 h-2.5 text-amber-500" /> {insight.context.weather} • {insight.context.location}
            </p>
          </div>
        </div>
        <span className="text-[8px] font-semibold tracking-wider text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded-full bg-slate-50">
          {t.simulatedHealthConnect}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2.5">
        <div className="bg-white/80 border border-slate-100 rounded-xl p-2 text-center">
          <div className="text-[9px] text-slate-500 font-medium">{t.steps}</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            {insight.metrics.steps.toLocaleString()}
          </div>
          <div className="text-[8px] text-teal-600 font-semibold">{t.stepsGoal}</div>
        </div>

        <div className="bg-white/80 border border-slate-100 rounded-xl p-2 text-center">
          <div className="text-[9px] text-slate-500 font-medium flex items-center justify-center gap-0.5">
            <Moon className="w-2.5 h-2.5 text-indigo-500" /> {t.sleep}
          </div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            {insight.metrics.sleep_duration_hours} <span className="text-[10px] font-normal">hrs</span>
          </div>
          <div className="text-[8px] text-amber-600 font-semibold">{t.sleepLow}</div>
        </div>

        <div className="bg-white/80 border border-slate-100 rounded-xl p-2 text-center">
          <div className="text-[9px] text-slate-500 font-medium flex items-center justify-center gap-0.5">
            <Heart className="w-2.5 h-2.5 text-rose-500" /> {t.avgHeartRate}
          </div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            {insight.metrics.avg_hr_bpm} <span className="text-[10px] font-normal">bpm</span>
          </div>
          <div className="text-[8px] text-emerald-600 font-semibold">{t.restingNormal}</div>
        </div>
      </div>

      <div className="flex items-start gap-1.5 bg-teal-50/80 border border-teal-100 rounded-xl p-2 text-xs text-slate-700 leading-relaxed">
        <Info className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
        <p className="text-[10px]">
          {language === 'en' ? insight.observation : t.insightTip}
        </p>
      </div>
    </div>
  );
};
