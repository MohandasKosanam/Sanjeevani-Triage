import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  X,
  AlertTriangle,
  Pill,
  CheckCircle2,
  FileQuestion,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Language, PrescriptionRecord } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preferredLanguage: Language;
}

export const PrescriptionScannerSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  preferredLanguage,
}) => {
  const { language, t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<PrescriptionRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // High quality sample prescription images encoded as SVG data URIs
  // 1. Clearly printed / legible prescription
  const sampleClearPrescription = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" style="background:%23fff; font-family:sans-serif;">
    <rect width="600" height="750" fill="%23fff" stroke="%23cbd5e1" stroke-width="2"/>
    <text x="40" y="50" font-size="20" font-weight="bold" fill="%230f766e">APOLLO HOSPITALS CLINICAL RX</text>
    <text x="40" y="75" font-size="12" fill="%2364748b">Dr. K. Srinivas, MD (General Medicine) | Reg: AP-48291</text>
    <line x1="40" y1="90" x2="560" y2="90" stroke="%23e2e8f0" stroke-width="2"/>
    <text x="40" y="120" font-size="14" fill="%23334155">Patient: Ramesh Varma (48M) | Date: Today</text>
    <text x="40" y="160" font-size="28" font-family="serif" font-weight="bold" fill="%230f766e">Rx</text>
    <rect x="40" y="180" width="520" height="80" rx="8" fill="%23f8fafc" stroke="%23e2e8f0"/>
    <text x="60" y="210" font-size="16" font-weight="bold" fill="%230f172a">1. Tab. Paracetamol 650 mg (Dolo 650)</text>
    <text x="60" y="235" font-size="13" fill="%23475569">Dosage: 1 Tablet - Thrice a day after food (1-0-1) - Duration: 3 Days</text>
    <rect x="40" y="275" width="520" height="80" rx="8" fill="%23f8fafc" stroke="%23e2e8f0"/>
    <text x="60" y="305" font-size="16" font-weight="bold" fill="%230f172a">2. Cap. Pantoprazole 40 mg (Pan 40)</text>
    <text x="60" y="330" font-size="13" fill="%23475569">Dosage: 1 Capsule - Once daily in morning before food (1-0-0) - Duration: 5 Days</text>
    <rect x="40" y="370" width="520" height="80" rx="8" fill="%23f8fafc" stroke="%23e2e8f0"/>
    <text x="60" y="400" font-size="16" font-weight="bold" fill="%230f172a">3. Oral Rehydration Solution (ORS)</text>
    <text x="60" y="425" font-size="13" fill="%23475569">Dosage: 1 sachet in 1 Litre boiled cooled water sip frequently</text>
    <text x="40" y="490" font-size="12" fill="%2364748b">Instructions: Drink plenty of warm fluids. Avoid oily & spicy diet.</text>
    <text x="400" y="550" font-size="14" font-weight="bold" fill="%23334155">Dr. K. Srinivas</text>
    <text x="400" y="570" font-size="11" fill="%2364748b">[Digital Signature Verified]</text>
  </svg>`;

  // 2. Messy / Smudged illegible handwriting sample designed to test the strict safety protocol
  const sampleIllegiblePrescription = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" style="background:%23fef3c7; font-family:cursive;">
    <rect width="600" height="750" fill="%23fffbeb" stroke="%23f59e0b" stroke-width="2"/>
    <text x="40" y="60" font-size="18" fill="%2378350f">Clinic Rx - Handwritten Slip</text>
    <line x1="40" y1="80" x2="560" y2="80" stroke="%23fde68a" stroke-width="2"/>
    <path d="M 50 180 Q 90 140, 150 190 T 250 170 T 350 200 T 450 160" fill="none" stroke="%231e293b" stroke-width="4" opacity="0.6"/>
    <path d="M 50 240 Q 120 280, 220 220 T 320 260 T 420 230" fill="none" stroke="%231e293b" stroke-width="4" opacity="0.7"/>
    <path d="M 60 310 Q 100 340, 180 300 T 300 330 T 400 310" fill="none" stroke="%231e293b" stroke-width="4" opacity="0.5"/>
    <text x="40" y="450" font-size="16" fill="%2392400e">[Smudged ink and non-standard cursive abbreviations]</text>
  </svg>`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        processPrescription(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const processPrescription = async (image: string) => {
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const res = await api.scanPrescription(image, preferredLanguage || language);
      setScanResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Prescription scan failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setScanResult(null);
    setErrorMsg('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{t.rxModalTitle}</h2>
              <p className="text-xs text-slate-500">{t.rxModalSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {scanResult ? (
            /* Results View */
            <div className="space-y-4">
              {scanResult.extraction_status === 'unclear' ? (
                /* Strict Safety Protocol Triggered */
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 text-left space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>{t.safetyGuardrailTriggered}</span>
                  </div>
                  <div className="bg-white border border-amber-200 rounded-xl p-3 text-xs text-amber-950 font-semibold leading-relaxed">
                    ⚠️ {scanResult.safety_warning}
                  </div>
                  <p className="text-[11px] text-amber-800 leading-normal">
                    {t.safetyPolicyDesc}
                  </p>
                </div>
              ) : (
                /* Legible Medicines Extracted */
                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-600" /> {t.extractedMedicines} ({scanResult.medicines.length})
                    </span>
                    <span className="text-[10px] text-teal-700 bg-teal-50 font-semibold px-2 py-0.5 rounded-full border border-teal-200">
                      Verified
                    </span>
                  </div>

                  {scanResult.medicines.map((med, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 hover:border-teal-300 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                            <Pill className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{med.name}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{t.dosage}: {med.dosage}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                          {med.frequency}
                        </span>
                      </div>

                      <div className="bg-white border border-slate-100 rounded-xl p-2.5 text-xs text-slate-700">
                        <div className="text-[10px] text-teal-700 font-semibold uppercase mb-0.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-teal-500" /> Instructions ({(preferredLanguage || language).toUpperCase()}):
                        </div>
                        <p className="text-[11px] leading-relaxed">{med.instructions_native}</p>
                      </div>

                      <div className="text-[10px] text-slate-400 font-medium">
                        {t.duration}: {med.duration}
                      </div>
                    </div>
                  ))}

                  <div className="text-[11px] text-slate-500 bg-slate-100/80 p-2.5 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{t.pharmacistVerifyNotice}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> {t.scanAnother}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-teal-600 text-white font-semibold text-xs rounded-xl hover:bg-teal-700 transition shadow-sm"
                >
                  {t.doneBtn}
                </button>
              </div>
            </div>
          ) : isProcessing ? (
            /* Scanning / AI Processing Animation */
            <div className="py-12 flex flex-col items-center text-center space-y-4">
              <div className="relative w-24 h-24 rounded-2xl bg-teal-50 border-2 border-teal-500/30 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-x-0 h-1 bg-teal-500 animate-pulse shadow-md top-1/2 -translate-y-1/2" />
                <Camera className="w-8 h-8 text-teal-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">{t.decodingPrescription}</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Analyzing handwriting, verifying medicine names, and applying safety protocols with Gemini Vision.
                </p>
              </div>
            </div>
          ) : (
            /* Upload / Camera Prompt & Preset Prescriptions */
            <div className="space-y-4">
              {/* Camera Frame placeholder */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-teal-400 transition bg-slate-50/50">
                <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-600 mx-auto flex items-center justify-center mb-3">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">{t.snapOrUpload}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  {t.snapDesc}
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Camera className="w-4 h-4" /> {t.takePhoto}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 transition flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" /> {t.uploadFile}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl text-left">
                  {errorMsg}
                </div>
              )}

              {/* Fast Test Prescriptions for Demonstration */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-left">
                  {t.testSamples}
                </div>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <button
                    onClick={() => {
                      setSelectedImage(sampleClearPrescription);
                      processPrescription(sampleClearPrescription);
                    }}
                    className="p-3 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/60 transition group"
                  >
                    <div className="text-xs font-bold text-teal-900 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> {t.legibleSample}
                    </div>
                    <div className="text-[10px] text-teal-700 mt-1">
                      Paracetamol, Pan 40, ORS
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedImage(sampleIllegiblePrescription);
                      processPrescription(sampleIllegiblePrescription);
                    }}
                    className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 transition group"
                  >
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1">
                      <FileQuestion className="w-3.5 h-3.5 text-amber-600" /> {t.illegibleSample}
                    </div>
                    <div className="text-[10px] text-amber-700 mt-1">
                      Safety Protocol Test
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
