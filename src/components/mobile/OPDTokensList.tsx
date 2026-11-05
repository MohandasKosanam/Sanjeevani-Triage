import React from 'react';
import { Ticket, Clock, MapPin, CheckCircle, QrCode, ArrowUpRight } from 'lucide-react';
import { OPDToken } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  tokens: OPDToken[];
}

export const OPDTokensList: React.FC<Props> = ({ tokens }) => {
  const { t } = useLanguage();

  if (tokens.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
          <Ticket className="w-6 h-6" />
        </div>
        <div className="text-xs font-bold text-slate-700">{t.noActiveTokens}</div>
        <p className="text-[11px] text-slate-500 mt-1">
          {t.noActiveTokensDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tokens.map((token) => (
        <div
          key={token.id}
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-teal-400 transition text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {token.token_number}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  token.status === 'in_consultation'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : token.status === 'completed'
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-teal-100 text-teal-800 border border-teal-300'
                }`}
              >
                {token.status.replace('_', ' ')}
              </span>
            </div>

            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
              <QrCode className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 text-xs font-bold text-teal-900">
            {token.hospital_name}
          </div>

          <div className="mt-1 text-[11px] text-slate-600 flex items-center justify-between">
            <span className="font-semibold text-slate-800">{token.department}</span>
            <span className="text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-teal-600" /> {token.distance_km} km ({t.straightLineDist})
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3 h-3 text-slate-400" /> {t.estWait}: ~{token.estimated_wait_minutes} mins
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {t.issuedAt} {new Date(token.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
