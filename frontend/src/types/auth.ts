export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
}

export interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
  isLogged: boolean;
}

export interface SignInCredentials {
  email: string;
  password?: string;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}
