export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date; 
  updatedAt: Date;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}