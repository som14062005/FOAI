export interface UserProfile {
  userId: string;
  travelerType: string;
  confidence: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveProfileResponse {
  success: boolean;
  message: string;
  profile: UserProfile;
}

export interface DeleteProfileResponse {
  success: boolean;
  message: string;
}

export interface GetAllProfilesResponse {
  success: boolean;
  count: number;
  profiles: UserProfile[];
}
