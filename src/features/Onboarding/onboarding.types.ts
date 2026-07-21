export interface ValidateTokenResponse {
  valid: boolean;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface OnboardingUserData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
}
