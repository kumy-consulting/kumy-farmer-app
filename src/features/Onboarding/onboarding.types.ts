export interface ValidateTokenResponse {
  valid: boolean;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  dateOfBirth?: string | null;
  gender?: string | null;
}

export interface OnboardingUserData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  dateOfBirth?: string | null;
  gender?: string | null;
}

export interface OnboardingProfile {
  birthDate: string | null; // ISO 'YYYY-MM-DD'
  regionId: string | null;
  regionName: string | null;
  prefectureId: string | null;
  prefectureName: string | null;
  addressDetail: string | null;
}
