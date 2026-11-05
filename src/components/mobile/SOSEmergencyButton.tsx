import React, { useState, useRef, useEffect } from 'react';
import {
  AlertOctagon,
  Volume2,
  Mic,
  CheckCircle,
  Radio,
  PhoneCall,
  MapPin,
  X,
  ShieldAlert
} from 'lucide-react';
import { alertManager } from '../../utils/audioAlert';
import { api } from '../../services/api';
import { SOSEvent } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  onSOSCreated?: (event: SOSEvent) => void;
}

type SOSState =
  | 'IDLE'
  | 'HOLDING'
  | 'SIREN'
  | 'RECORDING'
  | 'UPLOADING'
  | 'DISPATCHED'
  | 'FAILED';

export const SOSEmergencyButton: React.FC<Props> = ({ onSOSCreated }) => {
  const { t } = useLanguage();
  const [state, setState] = useState<SOSState>('IDLE');
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100
  const [sirenSecondsLeft, setSirenSecondsLeft] = useState(10);
  const [recordSecondsLeft, setRecordSecondsLeft] = useState(20);
  const [sosTicket, setSosTicket] = useState<{ id: string; status: string } | null>(null);
  const [activeOverlayOpen, setActiveOverlayOpen] = useState(false);

  const holdTimerRef = useRef<any>(null);
  const holdStartRef = useRef<number>(0);
  const sirenIntervalRef = useRef<any>(null);
  const recordIntervalRef = useRef<any>(null);
  const stopSirenCallbackRef = useRef<(() => void) | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const HOLD_DURATION_MS = 2500; // Exact 2.5 seconds hold requirement

  const startHold = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (state !== 'IDLE') return;

    setState('HOLDING');
    setHoldProgress(0);
    holdStartRef.current = Date.now();

    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      setHoldProgress(progress);

      if (elapsed >= HOLD_DURATION_MS) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
        triggerSOSActivation();
      }
    }, 40);
  };

  const cancelHold = () => {
    if (state === 'HOLDING') {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      setState('IDLE');
      setHoldProgress(0);
    }
  };

  // SOS Activated at 2.5 seconds
  const triggerSOSActivation = async () => {
    alertManager.triggerHaptic([200, 100, 200, 100, 400]);
    setActiveOverlayOpen(true);
    setState('SIREN');
    setSirenSecondsLeft(10);

    let createdId = '';
    try {
      // 1. Immediately dispatch Priority 0 event to backend
      const res = await api.dispatchSOS(17.7124, 83.3156);
      createdId = res.sos_id;
      setSosTicket({ id: res.sos_id, status: res.status });
      if (onSOSCreated) {
        onSOSCreated({
          id: res.sos_id,
          patient_id: 'USR-PAT-001',
          patient_name: 'Ramesh Varma',
          patient_phone: '+91 98480 22338',
          latitude: 17.7124,
          longitude: 83.3156,
          priority: 0,
          status: 'received',
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed to dispatch SOS immediately:', err);
    }

    // 2. Play 10-second local siren
    stopSirenCallbackRef.current = alertManager.startSiren(10, () => {
      startAmbientRecording(createdId);
    });

    sirenIntervalRef.current = setInterval(() => {
      setSirenSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(sirenIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start 20-second ambient recording after siren
  const startAmbientRecording = async (sosId: string) => {
    setState('RECORDING');
    setRecordSecondsLeft(20);

    let audioChunks: Blob[] = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      mediaRecorderRef.current = rec;

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        if (sosId) {
          setState('UPLOADING');
          try {
            await api.uploadSOSAudio(sosId, blob, 20);
          } catch (e) {
            console.error('Ambient audio upload error:', e);
          }
        }
        setState('DISPATCHED');
      };

      rec.start();
    } catch (e) {
      console.warn('Microphone unavailable for ambient recording, continuing dispatch:', e);
    }

    recordIntervalRef.current = setInterval(() => {
      setRecordSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(recordIntervalRef.current);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          } else {
            setState('DISPATCHED');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const closeOverlay = () => {
    if (stopSirenCallbackRef.current) stopSirenCallbackRef.current();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    setActiveOverlayOpen(false);
    setState('IDLE');
    setHoldProgress(0);
  };

  return (
    <>
      {/* Central Navigation SOS Button */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Hold progress ring SVG */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-16 h-16 -rotate-90 pointer-events-none absolute inset-0">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="#fee2e2"
              strokeWidth="4"
              fill="transparent"
            />
            {holdProgress > 0 && (
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#dc2626"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="175.9"
                strokeDashoffset={175.9 - (175.9 * holdProgress) / 100}
                strokeLinecap="round"
                className="transition-all duration-75"
              />
            )}
          </svg>

          <button
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            className={`w-13 h-13 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition select-none ${
              state === 'HOLDING' ? 'scale-105 shadow-rose-500/50' : 'hover:shadow-rose-400/40'
            }`}
            title="Press and hold 2.5 seconds for Emergency SOS"
          >
            <AlertOctagon className="w-7 h-7" />
          </button>
        </div>
        <span className="text-[10px] font-bold text-rose-600 mt-0.5 tracking-wider uppercase">
          {state === 'HOLDING' ? `${Math.round(holdProgress)}%` : t.holdSosBtn}
        </span>
      </div>

      {/* Fullscreen SOS Emergency Overlay Modal */}
      {activeOverlayOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 w-full max-w-sm rounded-3xl p-6 text-white text-center shadow-2xl relative overflow-hidden">
            {/* Top Close / Dismiss button */}
            <button
              onClick={closeOverlay}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Glowing SOS Header */}
            <div className="w-20 h-20 rounded-full bg-rose-600/20 border-2 border-rose-500 text-rose-500 mx-auto flex items-center justify-center mb-4 sos-active-pulse">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <div className="inline-block px-3 py-1 bg-rose-600 text-white font-extrabold text-[11px] rounded-full uppercase tracking-wider mb-2">
              {t.priority0Activated}
            </div>

            <h2 className="text-xl font-black text-white">{t.emergencyDispatchLive}</h2>
            <p className="text-xs text-rose-200/80 mt-1">
              {t.sosTicketLabel}: <span className="font-mono font-bold text-white">{sosTicket?.id || 'SOS-001'}</span>
            </p>

            {/* Status Pipeline */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 my-5 text-left space-y-3">
              {/* Stage 1: Priority 0 Dispatch */}
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-rose-400 font-semibold">
                  <Radio className="w-4 h-4 animate-pulse" /> {t.hospitalAlertStage}:
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                  <CheckCircle className="w-3.5 h-3.5" /> Dispatched
                </span>
              </div>

              {/* Stage 2: 10-Second Local Siren */}
              <div className="flex items-center justify-between text-xs border-t border-slate-700/60 pt-2">
                <span className="flex items-center gap-2 text-slate-300 font-medium">
                  <Volume2 className="w-4 h-4 text-amber-400" /> {t.localSirenStage}:
                </span>
                <span className="font-mono text-xs font-bold text-amber-400">
                  {state === 'SIREN' ? `${sirenSecondsLeft}s Playing` : 'Completed'}
                </span>
              </div>

              {/* Stage 3: 20-Second Ambient Recording */}
              <div className="flex items-center justify-between text-xs border-t border-slate-700/60 pt-2">
                <span className="flex items-center gap-2 text-slate-300 font-medium">
                  <Mic className="w-4 h-4 text-indigo-400" /> {t.ambientAudioStage}:
                </span>
                <span className="font-mono text-xs font-bold text-indigo-300">
                  {state === 'RECORDING'
                    ? `${recordSecondsLeft}s Recording`
                    : state === 'SIREN'
                    ? 'Pending Siren'
                    : 'Uploaded'}
                </span>
              </div>

              {/* GPS Coordinates */}
              <div className="flex items-center justify-between text-xs border-t border-slate-700/60 pt-2 text-slate-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" /> {t.gpsCoordinates}:
                </span>
                <span className="font-mono text-[11px] text-teal-300">17.7124° N, 83.3156° E</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50 mb-4">
              Your location and emergency ticket have been elevated to the top of the nearest tertiary emergency dashboard. Stay in a safe area.
            </div>

            <button
              onClick={closeOverlay}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition border border-slate-700"
            >
              {t.acknowledgeBtn}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
