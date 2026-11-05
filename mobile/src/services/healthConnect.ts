import { Platform } from 'react-native';
import { HealthConnectData } from '../types';

let HealthConnect: any = null;

if (Platform.OS === 'android') {
  try {
    HealthConnect = require('react-native-health-connect');
  } catch (e) {
    console.warn('react-native-health-connect not available in this environment:', e);
  }
}

export const HEALTH_CONNECT_PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'TotalCaloriesBurned' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'RestingHeartRate' },
];

export const healthConnectService = {
  /**
   * Check if Health Connect is available on the Android device.
   */
  async checkAvailability(): Promise<{
    available: boolean;
    providerPackageNames?: string[];
    status: string;
  }> {
    if (Platform.OS !== 'android' || !HealthConnect) {
      return { available: false, status: 'NOT_ANDROID' };
    }

    try {
      const status = await HealthConnect.getSdkStatus();
      if (status === HealthConnect.SdkAvailabilityStatus.SDK_AVAILABLE) {
        return { available: true, status: 'SDK_AVAILABLE' };
      } else if (
        status === HealthConnect.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
      ) {
        return { available: false, status: 'UPDATE_REQUIRED' };
      }
      return { available: false, status: 'UNAVAILABLE' };
    } catch (e: any) {
      console.warn('Error checking Health Connect availability:', e);
      return { available: false, status: 'ERROR' };
    }
  },

  /**
   * Open Google Play Store to install or update Health Connect app if required.
   */
  async openHealthConnectPlayStore(): Promise<void> {
    if (Platform.OS === 'android' && HealthConnect) {
      try {
        await HealthConnect.openHealthConnectSettings();
      } catch (e) {
        console.warn('Could not open Health Connect settings:', e);
      }
    }
  },

  /**
   * Request official Android Health Connect user consent permissions.
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android' || !HealthConnect) {
      return false;
    }

    try {
      await HealthConnect.initialize();
      const granted = await HealthConnect.requestPermission(HEALTH_CONNECT_PERMISSIONS);
      return granted && granted.length > 0;
    } catch (e) {
      console.error('Error requesting Health Connect permissions:', e);
      return false;
    }
  },

  /**
   * Check if permissions have already been granted.
   */
  async checkPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android' || !HealthConnect) {
      return false;
    }

    try {
      await HealthConnect.initialize();
      const granted = await HealthConnect.getGrantedPermissions();
      const hasSteps = granted.some((p: any) => p.recordType === 'Steps');
      return hasSteps;
    } catch (e) {
      return false;
    }
  },

  /**
   * Fetch today's real health metrics from Health Connect.
   * If records do not exist, returns zero and an honest empty state.
   */
  async getTodayHealthData(): Promise<HealthConnectData> {
    const defaultData: HealthConnectData = {
      stepsToday: 0,
      heartRateAvg: 0,
      sleepHours: 0,
      activeCalories: 0,
      distanceMeters: 0,
      restingHeartRate: 0,
      lastSyncTimestamp: new Date().toISOString(),
      isAvailable: false,
      hasPermissions: false,
    };

    if (Platform.OS !== 'android' || !HealthConnect) {
      return defaultData;
    }

    try {
      const { available } = await this.checkAvailability();
      if (!available) return defaultData;

      const hasPerms = await this.checkPermissions();
      if (!hasPerms) {
        return { ...defaultData, isAvailable: true, hasPermissions: false };
      }

      await HealthConnect.initialize();

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

      const timeRangeFilter = {
        operator: 'between' as const,
        startTime: startOfDay.toISOString(),
        endTime: now.toISOString(),
      };

      // 1. Read Steps
      let stepsToday = 0;
      try {
        const stepsRes = await HealthConnect.readRecords('Steps', { timeRangeFilter });
        stepsToday = (stepsRes.records || []).reduce(
          (acc: number, r: any) => acc + (r.count || 0),
          0
        );
      } catch (e) {}

      // 2. Read Heart Rate
      let heartRateAvg = 0;
      try {
        const hrRes = await HealthConnect.readRecords('HeartRate', { timeRangeFilter });
        const hrSamples = (hrRes.records || []).flatMap((r: any) => r.samples || []);
        if (hrSamples.length > 0) {
          const totalBpm = hrSamples.reduce((sum: number, s: any) => sum + (s.beatsPerMinute || 0), 0);
          heartRateAvg = Math.round(totalBpm / hrSamples.length);
        }
      } catch (e) {}

      // 3. Read Sleep Sessions (last 24 hours)
      let sleepHours = 0;
      try {
        const sleepStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sleepRes = await HealthConnect.readRecords('SleepSession', {
          timeRangeFilter: {
            operator: 'between' as const,
            startTime: sleepStart.toISOString(),
            endTime: now.toISOString(),
          },
        });
        const totalDurationMs = (sleepRes.records || []).reduce((sum: number, r: any) => {
          const start = new Date(r.startTime).getTime();
          const end = new Date(r.endTime).getTime();
          return sum + Math.max(0, end - start);
        }, 0);
        sleepHours = parseFloat((totalDurationMs / (1000 * 60 * 60)).toFixed(1));
      } catch (e) {}

      // 4. Read Active Calories
      let activeCalories = 0;
      try {
        const calRes = await HealthConnect.readRecords('TotalCaloriesBurned', { timeRangeFilter });
        activeCalories = Math.round(
          (calRes.records || []).reduce(
            (sum: number, r: any) => sum + (r.energy?.inKilocalories || 0),
            0
          )
        );
      } catch (e) {}

      // 5. Read Distance
      let distanceMeters = 0;
      try {
        const distRes = await HealthConnect.readRecords('Distance', { timeRangeFilter });
        distanceMeters = Math.round(
          (distRes.records || []).reduce((sum: number, r: any) => sum + (r.distance?.inMeters || 0), 0)
        );
      } catch (e) {}

      // 6. Read Resting Heart Rate
      let restingHeartRate = 0;
      try {
        const rhrRes = await HealthConnect.readRecords('RestingHeartRate', { timeRangeFilter });
        if (rhrRes.records && rhrRes.records.length > 0) {
          restingHeartRate = rhrRes.records[rhrRes.records.length - 1].beatsPerMinute || 0;
        }
      } catch (e) {}

      return {
        stepsToday,
        heartRateAvg,
        sleepHours,
        activeCalories,
        distanceMeters,
        restingHeartRate,
        lastSyncTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAvailable: true,
        hasPermissions: true,
      };
    } catch (e) {
      console.warn('Error reading from Health Connect:', e);
      return defaultData;
    }
  },
};
