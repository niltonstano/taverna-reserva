export interface AdminPayload {
  id: string;
  email: string;
  role: "admin";
  permissions: string[];
}

export interface CustomerPayload {
  id: string;
  email: string;
  role: "customer";
}

export type JWTPayload = AdminPayload | CustomerPayload;
