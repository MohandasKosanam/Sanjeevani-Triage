import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';
import { PrescriptionRecord } from '../../src/types';

export default function RxScannerModal() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<PrescriptionRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const pickImage = async (useCamera: boolean) => {
    setErrorMsg('');
    setResult(null);

    let permissionResult;
    if (useCamera) {
      permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    } else {
      permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (!permissionResult.granted) {
      setErrorMsg('Camera and media permissions are required to scan prescriptions.');
      return;
    }

    const pickerResult = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
        });

    if (!pickerResult.canceled && pickerResult.assets.length > 0) {
      const uri = pickerResult.assets[0].uri;
      setImageUri(uri);
      await processPrescription(uri);
    }
  };

  const processPrescription = async (uri: string) => {
    setIsScanning(true);
    try {
      const rx = await api.scanPrescription(uri, language);
      setResult(rx);
    } catch (e: any) {
      setErrorMsg(e.message || 'Prescription interpretation failed');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.rxIconBadge}>
            <Ionicons name="camera" size={16} color="#0d9488" />
          </View>
          <View>
            <Text style={styles.headerTitle}>{t.rxModalTitle || 'Smart Rx Decoder'}</Text>
            <Text style={styles.headerSubtitle}>{t.rxModalSubtitle || 'Gemini Vision AI Safety Guardrail'}</Text>
          </View>
        </View>

        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color="#64748b" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Camera Actions */}
        {!imageUri ? (
          <View style={styles.uploadBox}>
            <Ionicons name="document-text-outline" size={56} color="#94a3b8" />
            <Text style={styles.uploadTitle}>{t.snapOrUpload || 'Photograph Doctor Prescription'}</Text>
            <Text style={styles.uploadDesc}>
              {t.snapDesc || 'Ensure doctor handwriting, medication names, and dosage lines are well lit and in focus.'}
            </Text>

            <View style={styles.actionRow}>
              <Pressable
                onPress={() => pickImage(true)}
                style={styles.actionBtnPrimary}
              >
                <Ionicons name="camera" size={16} color="#ffffff" />
                <Text style={styles.actionBtnText}>{t.takePhoto || 'Take Photo'}</Text>
              </Pressable>

              <Pressable
                onPress={() => pickImage(false)}
                style={styles.actionBtnSecondary}
              >
                <Ionicons name="images" size={16} color="#0d9488" />
                <Text style={styles.actionBtnSecText}>{t.uploadFile || 'Choose Gallery'}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />

            <Pressable
              onPress={() => {
                setImageUri(null);
                setResult(null);
              }}
              style={styles.repickBtn}
            >
              <Ionicons name="refresh" size={14} color="#ffffff" />
              <Text style={styles.repickText}>{t.scanAnother || 'Scan Another'}</Text>
            </Pressable>
          </View>
        )}

        {isScanning && (
          <View style={styles.scanningBox}>
            <ActivityIndicator size="large" color="#0d9488" />
            <Text style={styles.scanningText}>{t.decodingPrescription || 'Gemini AI is decoding prescription safely...'}</Text>
          </View>
        )}

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#e11d48" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Results View */}
        {result && (
          <View style={styles.resultContainer}>
            {/* Strict Safety Guardrail Notice if Unclear */}
            {result.safety_warning ? (
              <View style={styles.guardrailBox}>
                <Ionicons name="shield-checkmark" size={20} color="#e11d48" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.guardrailTitle}>
                    {t.safetyGuardrailTriggered || 'Prescription Safety Guardrail Active'}
                  </Text>
                  <Text style={styles.guardrailText}>{result.safety_warning}</Text>
                </View>
              </View>
            ) : null}

            {/* Extracted Medicines */}
            {result.medicines && result.medicines.length > 0 && (
              <View style={styles.medsCard}>
                <Text style={styles.medsTitle}>{t.extractedMedicines || 'Extracted Medications'}</Text>
                {result.medicines.map((med, idx) => (
                  <View key={idx} style={styles.medItem}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <View style={styles.medDetails}>
                      <Text style={styles.medDetail}>{t.dosage || 'Dosage'}: {med.dosage}</Text>
                      <Text style={styles.medDetail}>{t.frequency || 'Freq'}: {med.frequency}</Text>
                      <Text style={styles.medDetail}>{t.duration || 'Duration'}: {med.duration}</Text>
                    </View>
                    {med.instructions_native ? (
                      <Text style={styles.medInstructions}>{med.instructions_native}</Text>
                    ) : null}
                  </View>
                ))}

                <View style={styles.pharmacistNotice}>
                  <Ionicons name="information-circle" size={14} color="#0d9488" />
                  <Text style={styles.pharmacistNoticeText}>
                    {t.pharmacistVerifyNotice || 'Always verify with a licensed physical pharmacist before ingestion.'}
                  </Text>
                </View>
              </View>
            )}

            <Pressable
              onPress={() => router.back()}
              style={styles.doneBtn}
            >
              <Text style={styles.doneBtnText}>{t.doneBtn || 'Done & Return'}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rxIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#64748b',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    marginTop: 10,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 12,
  },
  uploadDesc: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 6,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0d9488',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#5eead4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnSecText: {
    color: '#0d9488',
    fontSize: 12,
    fontWeight: '800',
  },
  previewContainer: {
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  previewImage: {
    width: '100%',
    height: 240,
  },
  repickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  repickText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  scanningBox: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 10,
  },
  scanningText: {
    fontSize: 12,
    color: '#0d9488',
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    padding: 12,
    borderRadius: 14,
    marginTop: 12,
  },
  errorText: {
    color: '#e11d48',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  resultContainer: {
    marginTop: 16,
  },
  guardrailBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  guardrailTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9f1239',
  },
  guardrailText: {
    fontSize: 11,
    color: '#be123c',
    marginTop: 2,
    lineHeight: 16,
  },
  medsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  medsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  medItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  medName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  medDetails: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  medDetail: {
    fontSize: 10,
    color: '#64748b',
  },
  medInstructions: {
    fontSize: 11,
    color: '#0d9488',
    marginTop: 4,
  },
  pharmacistNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  pharmacistNoticeText: {
    fontSize: 10,
    color: '#0d9488',
    flex: 1,
  },
  doneBtn: {
    backgroundColor: '#0d9488',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
