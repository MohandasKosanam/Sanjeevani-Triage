import { Hospital } from '../types';

export const HOSPITAL_REGISTRY: Hospital[] = [
  {
    hospital_id: 'HOSP-VZG-001',
    hospital_name: 'Apollo Hospitals, Ramnagar',
    coordinates: {
      lat: 17.7124,
      lng: 83.3156,
    },
    specialties: [
      'Cardiology',
      'Oncology',
      'Neurosciences',
      'Gastroenterology',
      'Orthopaedics',
      'General Medicine',
      'Critical Care',
      'Emergency'
    ],
    address: 'Waltair Main Road, Ramnagar, Visakhapatnam, AP 530002',
    phone: '+91 891 272 7272',
    capacity_status: 'normal',
  },
  {
    hospital_id: 'HOSP-VZG-002',
    hospital_name: 'CARE Hospitals, Ramnagar',
    coordinates: {
      lat: 17.7138,
      lng: 83.3142,
    },
    specialties: [
      'Cardiology',
      'Neurology',
      'Pulmonology',
      'Critical Care',
      'General Surgery',
      'Internal Medicine'
    ],
    address: 'AS Raja Complex, Ramnagar, Visakhapatnam, AP 530002',
    phone: '+91 891 304 1444',
    capacity_status: 'normal',
  },
  {
    hospital_id: 'HOSP-VZG-003',
    hospital_name: 'Medicover Hospital, Maharani Peta',
    coordinates: {
      lat: 17.7085,
      lng: 83.3005,
    },
    specialties: [
      'Internal Medicine',
      'Gynecology',
      'Pediatrics',
      'General Medicine',
      'Dermatology',
      'ENT'
    ],
    address: 'Nowroji Road, Maharani Peta, Visakhapatnam, AP 530002',
    phone: '+91 891 681 0000',
    capacity_status: 'normal',
  },
  {
    hospital_id: 'HOSP-VZG-004',
    hospital_name: 'Icon Krishi Hospitals (KIMS), Sheela Nagar',
    coordinates: {
      lat: 17.6973,
      lng: 83.1979,
    },
    specialties: [
      'Trauma',
      'Orthopaedics',
      'Urology',
      'Critical Care',
      'Emergency',
      'General Surgery'
    ],
    address: 'BHPV Post, Sheela Nagar, Visakhapatnam, AP 530012',
    phone: '+91 891 285 5555',
    capacity_status: 'normal',
  },
];

/**
 * Calculates geographical straight-line distance in kilometers using the Haversine formula.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export interface HospitalMatchResult {
  hospital: Hospital;
  distance_km: number;
  matched_specialty: boolean;
}

/**
 * Matches clinical department with registered hospital specialties and allocates the nearest suitable hospital.
 */
export function allocateHospital(
  patientLat: number,
  patientLng: number,
  clinicalDepartment: string
): HospitalMatchResult {
  const deptNormalized = clinicalDepartment.toLowerCase().trim();

  // Find hospitals that support this specialty or general care
  const eligibleHospitals = HOSPITAL_REGISTRY.map((h) => {
    const hasSpecialty = h.specialties.some((s) => {
      const sNorm = s.toLowerCase();
      return (
        sNorm.includes(deptNormalized) ||
        deptNormalized.includes(sNorm) ||
        (deptNormalized.includes('heart') && sNorm.includes('cardio')) ||
        (deptNormalized.includes('stomach') && sNorm.includes('gastro')) ||
        (deptNormalized.includes('bone') && sNorm.includes('ortho')) ||
        (deptNormalized.includes('brain') && sNorm.includes('neuro')) ||
        (deptNormalized.includes('lung') && sNorm.includes('pulmo')) ||
        (deptNormalized.includes('child') && sNorm.includes('pediatric'))
      );
    });

    const dist = calculateDistance(
      patientLat,
      patientLng,
      h.coordinates.lat,
      h.coordinates.lng
    );

    return {
      hospital: h,
      distance_km: dist,
      matched_specialty: hasSpecialty,
    };
  });

  // Sort by specialty match first, then by shortest distance
  const sorted = [...eligibleHospitals].sort((a, b) => {
    if (a.matched_specialty !== b.matched_specialty) {
      return a.matched_specialty ? -1 : 1;
    }
    return a.distance_km - b.distance_km;
  });

  return (
    sorted[0] || {
      hospital: HOSPITAL_REGISTRY[0],
      distance_km: calculateDistance(
        patientLat,
        patientLng,
        HOSPITAL_REGISTRY[0].coordinates.lat,
        HOSPITAL_REGISTRY[0].coordinates.lng
      ),
      matched_specialty: false,
    }
  );
}
