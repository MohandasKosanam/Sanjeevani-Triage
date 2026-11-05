import React, { useState, useEffect } from 'react';
import {
  Hospital,
  AlertOctagon,
  ShieldAlert,
  Clock,
  PhoneCall,
  MapPin,
  CheckCircle,
  Play,
  RotateCw,
  Search,
  Filter,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Volume2,
  Activity,
  Layers,
  ArrowUpDown,
  Building2
} from 'lucide-react';
import { QueueItem, Hospital as HospitalType } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export const HospitalAdminView: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [hospitals, setHospitals] = useState<HospitalType[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('HOSP-VZG-001');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>(new Date().toISOString());
  const [callbackModalPatient, setCallbackModalPatient] = useState<any | null>(null);

  useEffect(() => {
    loadHospitalData();

    // Connect to real-time Server-Sent Events (SSE)
    const unsubscribe = api.connectEvents((event) => {
      console.log('[Admin SSE] Live event received:', event.type);
      loadQueueAndStats();
    });

    return () => unsubscribe();
  }, [selectedHospitalId]);

  const loadHospitalData = async () => {
    setLoading(true);
    try {
      const hList = await api.getHospitals();
      setHospitals(hList);
      await loadQueueAndStats();
    } catch (e) {
      console.error('Failed to load admin dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadQueueAndStats = async () => {
    try {
      const [s, q] = await Promise.all([
        api.getDashboardStats(selectedHospitalId),
        api.getAdminQueue(selectedHospitalId),
      ]);
      setStats(s);
      setQueue(q);
      setLastSync(new Date().toISOString());
    } catch (e) {
      console.error('Failed to refresh queue:', e);
    }
  };

  const handleStatusChange = async (itemId: string, newStatus: string, type: 'sos' | 'token') => {
    try {
      await api.updateQueueStatus(itemId, newStatus, type);
      await loadQueueAndStats();
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const handleCallbackClick = async (patientId: string) => {
    try {
      const res = await api.triggerPatientCallback(patientId);
      setCallbackModalPatient(res.patient);
    } catch (e) {
      console.error('Callback trigger error:', e);
    }
  };

  // Filter queue by department if selected
  const filteredQueue = queue.filter((item) => {
    if (selectedDepartment === 'all') return true;
    if (item.type === 'sos') return true; // Always show SOS regardless of dept
    const dept = item.token_data?.department || item.triage_data?.clinical_department;
    return dept?.toLowerCase() === selectedDepartment.toLowerCase();
  });

  const selectedHospital = hospitals.find((h) => h.hospital_id === selectedHospitalId) || hospitals[0];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-slate-800">
      {/* Top Hospital Command Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {selectedHospital ? selectedHospital.hospital_name : t.adminCommandCenter}
              </h1>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {t.liveQueueBadge}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.adminSubtitle} • {new Date().toDateString()}
            </p>
          </div>
        </div>

        {/* Hospital selector & Live refresh button */}
        <div className="flex items-center gap-3">
          <select
            value={selectedHospitalId}
            onChange={(e) => setSelectedHospitalId(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-teal-600"
          >
            {hospitals.map((h) => (
              <option key={h.hospital_id} value={h.hospital_id}>
                {h.hospital_name}
              </option>
            ))}
          </select>

          <button
            onClick={loadQueueAndStats}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
            title="Refresh queue"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real-time Hospital Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="text-xs font-medium text-slate-500">{t.totalPatientsToday}</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.total_patients_today}</div>
            <div className="text-[10px] text-teal-600 font-semibold mt-1">Registrations & OPD</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="text-xs font-medium text-slate-500">{t.activeQueueCount}</div>
            <div className="text-2xl font-black text-teal-700 mt-1">{stats.active_queue_count}</div>
            <div className="text-[10px] text-slate-400 mt-1">Severity-ranked patients</div>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-xs">
            <div className="text-xs font-bold text-rose-800 flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> {t.emergencyCasesCount}
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1">{stats.emergency_cases}</div>
            <div className="text-[10px] text-rose-700 font-semibold mt-1">Top priority attention</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="text-xs font-medium text-slate-500">{t.waitingOpdCount}</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{stats.waiting_patients}</div>
            <div className="text-[10px] text-slate-400 mt-1">Triaged & token issued</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="text-xs font-medium text-slate-500">{t.inConsultationCount}</div>
            <div className="text-2xl font-black text-indigo-600 mt-1">{stats.in_consultation}</div>
            <div className="text-[10px] text-slate-400 mt-1">Currently with physician</div>
          </div>
        </div>
      )}

      {/* Main Queue Management Table / Feed */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        {/* Controls: Department Filter & Priority Sorting Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-teal-600" /> {t.queueTableHeader}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.queueTableSubheader}
            </p>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">{t.departmentFilterLabel}</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-teal-600"
            >
              <option value="all">{t.allDepartments}</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Gastroenterology">Gastroenterology</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Neurology">Neurology</option>
              <option value="Orthopaedics">Orthopaedics</option>
              <option value="Critical Care">Critical Care</option>
            </select>
          </div>
        </div>

        {/* Queue Items List */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading live patient queue...</div>
        ) : filteredQueue.length === 0 ? (
          <div className="py-16 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-700">{t.queueClearTitle}</div>
            <p className="text-xs text-slate-500 mt-1">{t.queueClearDesc}</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredQueue.map((item) => {
              // 1. PRIORITY 0 SOS CARDS (Always at top!)
              if (item.type === 'sos' && item.sos_data) {
                const sos = item.sos_data;
                return (
                  <div
                    key={item.id}
                    className="bg-rose-50 border-2 border-rose-500 rounded-2xl p-4 sm:p-5 shadow-md relative overflow-hidden transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black bg-rose-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <AlertOctagon className="w-3.5 h-3.5" /> {t.p0SosEventBadge}
                          </span>
                          <span className="font-mono text-xs font-bold text-rose-900 bg-rose-100 px-2 py-0.5 rounded-md">
                            {sos.id}
                          </span>
                          <span className="text-xs font-bold text-rose-700 uppercase">
                            Status: {sos.status}
                          </span>
                        </div>

                        <div className="text-base font-extrabold text-slate-900">
                          {sos.patient_name} • <span className="font-mono text-sm font-semibold">{sos.patient_phone}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                          <span className="flex items-center gap-1 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-rose-600" /> GPS: {sos.latitude}° N, {sos.longitude}° E
                          </span>
                          <a
                            href={`https://maps.google.com/?q=${sos.latitude},${sos.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-700 font-semibold hover:underline flex items-center gap-0.5"
                          >
                            {t.openLocationLink} <ExternalLink className="w-3 h-3" />
                          </a>
                          <span className="text-slate-400 font-mono text-[11px]">
                            Triggered: {new Date(sos.created_at).toLocaleTimeString()}
                          </span>
                        </div>

                        {/* Ambient Audio Player if available */}
                        {sos.ambient_audio_url && (
                          <div className="mt-2 bg-white/90 border border-rose-200 rounded-xl p-2.5 flex items-center gap-3">
                            <Volume2 className="w-4 h-4 text-rose-600 shrink-0" />
                            <div className="text-xs font-semibold text-rose-950">Ambient 20s Audio Recording:</div>
                            <audio
                              controls
                              src={sos.ambient_audio_url}
                              className="h-8 max-w-xs"
                            />
                          </div>
                        )}
                      </div>

                      {/* Prominent Action: CALLBACK PATIENT */}
                      <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                        <button
                          onClick={() => handleCallbackClick(sos.patient_id)}
                          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5"
                        >
                          <PhoneCall className="w-4 h-4" /> {t.callbackPatientBtn}
                        </button>

                        <button
                          onClick={() => handleStatusChange(sos.id, 'resolved', 'sos')}
                          className="px-3 py-2.5 bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 font-semibold text-xs rounded-xl transition"
                        >
                          {t.markResolvedBtn}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // 2. TIER 3 EMERGENCY CARDS
              if (item.type === 'emergency' && item.triage_data) {
                const trg = item.triage_data;
                return (
                  <div
                    key={item.id}
                    className="bg-rose-50/70 border border-rose-300 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2 text-left"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold bg-rose-600 text-white px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> {t.tier3EmergencyBadge}
                        </span>
                        <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
                          Severity: 10/10
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {trg.clinical_department}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-slate-400">
                        Received: {new Date(trg.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-900">
                      {trg.patient_name} • <span className="font-mono font-medium">{trg.patient_phone}</span>
                    </div>

                    <div className="text-xs text-slate-700 bg-white/80 border border-rose-100 p-2.5 rounded-xl">
                      <span className="font-bold text-rose-900">Reported Symptoms (English):</span> {trg.translated_symptoms}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-rose-700 font-medium">
                        Immediate medical team notified.
                      </span>
                      <button
                        onClick={() => handleCallbackClick(trg.patient_id)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> {t.callbackPatientBtn}
                      </button>
                    </div>
                  </div>
                );
              }

              // 3. TIER 2 OPD CARDS (Sorted by severity score 4-8)
              if (item.type === 'opd' && item.token_data) {
                const token = item.token_data;
                const triage = item.triage_data;
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 hover:border-teal-400 rounded-2xl p-4 sm:p-5 shadow-xs transition space-y-2.5 text-left"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black font-mono text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg">
                          {token.token_number}
                        </span>
                        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                          {token.department}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            token.severity_score >= 8
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Severity: {token.severity_score}/10 ({token.priority.toUpperCase()})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">
                          Wait: ~{token.estimated_wait_minutes}m • {new Date(token.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <select
                          value={token.status}
                          onChange={(e) => handleStatusChange(token.id, e.target.value, 'token')}
                          className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-800 focus:outline-teal-600"
                        >
                          <option value="waiting">Waiting</option>
                          <option value="in_consultation">In Consultation</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-sm font-bold text-slate-900">
                      {token.patient_name} • <span className="font-mono text-xs font-normal text-slate-500">{token.patient_phone}</span>
                    </div>

                    {triage && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="font-semibold text-slate-800">Symptoms (AI Translated):</span> {triage.translated_symptoms}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span>Hospital Allocation: {token.hospital_name} ({token.distance_km} km)</span>
                      <button
                        onClick={() => handleCallbackClick(token.patient_id)}
                        className="text-teal-700 hover:underline font-semibold flex items-center gap-1"
                      >
                        <PhoneCall className="w-3 h-3" /> {t.contactPatientBtn}
                      </button>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>

      {/* Patient Callback Confirmation Modal */}
      {callbackModalPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-700 mx-auto flex items-center justify-center">
              <PhoneCall className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">{t.directCallbackTitle}</h3>
              <p className="text-xs text-slate-500 mt-1">{t.directCallbackSubtitle}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-1.5 text-xs">
              <div>
                <span className="text-slate-400">Patient:</span>{' '}
                <span className="font-bold text-slate-900">{callbackModalPatient.name}</span>
              </div>
              <div>
                <span className="text-slate-400">Phone:</span>{' '}
                <span className="font-mono font-bold text-teal-800">{callbackModalPatient.phone}</span>
              </div>
              {callbackModalPatient.emergency_contact && (
                <div className="pt-1 border-t border-slate-200">
                  <span className="text-slate-400">Next of Kin:</span>{' '}
                  <span className="text-slate-700">
                    {callbackModalPatient.emergency_contact.name} ({callbackModalPatient.emergency_contact.relationship}) -{' '}
                    {callbackModalPatient.emergency_contact.phone}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCallbackModalPatient(null)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50"
              >
                {t.closeBtn}
              </button>
              <a
                href={`tel:${callbackModalPatient.phone.replace(/\s+/g, '')}`}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-sm"
              >
                <PhoneCall className="w-3.5 h-3.5" /> {t.dialNowBtn}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
