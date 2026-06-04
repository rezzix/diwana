export interface UserDto {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  active: boolean;
  companyId: number | null;
  companyName: string | null;
  customsOfficeId: number | null;
  customsOfficeName: string | null;
}

export type UserRole = 'ADMIN' | 'DECLARANT' | 'CONTROLLER';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface DevUserDto {
  username: string;
  displayName: string;
  role: string;
  company: string | null;
}
