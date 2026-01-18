export interface AdminPayload {
  id: string;
  email: string;
  permissions: string[];
}

export interface CustomerPayload {
  id: string;
  email: string;
}