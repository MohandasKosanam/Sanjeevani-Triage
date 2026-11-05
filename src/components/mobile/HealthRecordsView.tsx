import React, { useState, useEffect } from 'react';
import {
  FileText,
  Pill,
  ShieldAlert,
  Clock,
  ChevronRight,
  Activity,
  AlertTriangle,
  Hospital
} from 'lucide-react';
import { TriageRecord, PrescriptionRecord, SOSEvent } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export const HealthRecordsView: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'triage' | 'prescriptions' | 'sos'>('triage');
  const [triageHistory, setTriageHistory] = useState<TriageRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [sosHistory, setSosHistory] = useState<SOSEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tr, pr, sr] = await Promise.all([
        api.getTriageHistory(),
        api.getPrescriptions(),
        api.getSOSHistory(),
      ]);
      setTriageHistory(tr);
      setPrescriptions(pr);
      setSosHistory(sr);
    } catch (e) {
      console.error('Failed to load health records:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Sub-Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('triage')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
            activeTab === 'triage'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t.triageRecordsTab} ({triageHistory.length})
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
            activeTab === 'prescriptions'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t.prescriptionsTab} ({prescriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('sos')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
            activeTab === 'sos'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t.sosLogsTab} ({sosHistory.length})
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading medical records...</div>
      ) : activeTab === 'triage' ? (
        <div className="space-y-3">
          {triageHistory.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">{t.noTriageRecords}</div>
          ) : (
            triageHistory.map((rec) => (
              <div
                key={rec.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2 hover:border-teal-400 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        rec.tier === 3
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : rec.tier === 2
                          ? 'bg-teal-100 text-teal-800 border border-teal-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      Tier {rec.tier}: {rec.clinical_department}
                    </span>
                    {rec.opd_token && (
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {rec.opd_token}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(rec.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div className="text-xs text-slate-800 font-medium">
                  "{rec.translated_symptoms}"
                </div>

                {rec.original_transcript && (
                  <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-xl">
                    Original ({rec.detected_language.toUpperCase()}): "{rec.original_transcript}"
                  </div>
                )}

                {rec.assigned_hospital && (
                  <div className="text-[11px] text-teal-800 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="font-semibold flex items-center gap-1">
                      <Hospital className="w-3.5 h-3.5" /> {rec.assigned_hospital.name}
                    </span>
                    <span className="text-slate-500">{rec.assigned_hospital.distance_km} km</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'prescriptions' ? (
        <div className="space-y-3">
          {prescriptions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">{t.noPrescriptions}</div>
          ) : (
            prescriptions.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2 hover:border-teal-400 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-900">{p.id}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      p.extraction_status === 'success'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {p.extraction_status}
                  </span>
                </div>

                {p.extraction_status === 'unclear' ? (
                  <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    ⚠️ {p.safety_warning}
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    {p.medicines.map((m, i) => (
                      <div key={i} className="text-xs bg-slate-50 p-2 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">{m.name}</div>
                          <div className="text-[10px] text-slate-500">{m.dosage} • {m.frequency}</div>
                        </div>
                        <span className="text-[10px] text-slate-400">{m.duration}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sosHistory.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">{t.noSosLogs}</div>
          ) : (
            sosHistory.map((s) => (
              <div
                key={s.id}
                className="bg-rose-50/50 border border-rose-200 rounded-2xl p-4 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-rose-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> {s.id} (Priority 0)
                  </span>
                  <span className="text-[10px] font-bold uppercase bg-rose-600 text-white px-2 py-0.5 rounded-full">
                    {s.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 flex items-center justify-between">
                  <span>GPS: {s.latitude}° N, {s.longitude}° E</span>
                  <span className="font-mono text-slate-400">
                    {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
