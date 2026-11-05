import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../types';
import { translations, TranslationDictionary } from '../utils/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: TranslationDictionary;
}

const STORAGE_KEY = '@sanjeevani_user_language';

const LanguageContext = createContext<LanguageContextType>({
  language: 'te',
  setLanguage: async () => {},
  t: translations.te,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('te');

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'te' || saved === 'hi' || saved === 'en')) {
        setLanguageState(saved as Language);
      }
    } catch (e) {
      console.warn('Failed to load language from AsyncStorage:', e);
    }
  };

  const setLanguage = async (newLang: Language) => {
    try {
      setLanguageState(newLang);
      await AsyncStorage.setItem(STORAGE_KEY, newLang);
    } catch (e) {
      console.warn('Failed to save language to AsyncStorage:', e);
    }
  };

  const t = translations[language] || translations.te;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
