// =============================================================================
// CONTEXTO DE AUTENTICACIÓN & GESTIÓN DE SOLICITUDES B2B — VISONS S.A.C.
// =============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  UserProfile, 
  UserRole, 
  CompanyInfo, 
  ClientRegistrationRequest, 
  ClientStatus 
} from '../types/auth';
import type { GoogleUserData } from '../services/googleAuth';
import { BASE_URL } from '../api/axiosConfig';

export interface AuthResult {
  ok: boolean;
  status?: ClientStatus | 'INVALID_CREDENTIALS' | 'NOT_REGISTERED' | 'SERVER_ERROR';
  message?: string;
  user?: UserProfile;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requests: ClientRegistrationRequest[];
  pendingRequestsCount: number;
  tempRegistrationUser: { name: string; email: string; avatar?: string } | null;
  setTempRegistrationUser: (data: { name: string; email: string; avatar?: string } | null) => void;
  login: (email: string, password?: string) => Promise<AuthResult>;
  loginWithGoogle: (googleData: GoogleUserData) => Promise<AuthResult>;
  registerClient: (data: {
    name: string;
    email: string;
    avatar?: string;
    company: CompanyInfo;
    authProvider: 'GOOGLE' | 'EMAIL';
  }) => Promise<ClientRegistrationRequest>;
  approveClientRequest: (requestId: string) => void;
  rejectClientRequest: (requestId: string, reason?: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  hasRole: (allowedRoles: UserRole[]) => boolean;
  updateUser: (data: Partial<UserProfile>) => void;
}

const DEFAULT_USERS: Record<UserRole, UserProfile> = {
  ADMIN: {
    id: 'usr-admin-01',
    name: 'Diego Centeno (Administrador)',
    email: 'diego@visons.com',
    role: 'ADMIN',
    status: 'APROBADO',
    department: 'Dirección General & Operaciones',
    isCompanyComplete: true,
  },
  TRABAJADOR: {
    id: 'usr-worker-01',
    name: 'Carlos Ramírez (Operario Planta)',
    email: 'carlos.planta@visons.com',
    role: 'TRABAJADOR',
    status: 'APROBADO',
    department: 'Control de Calidad & Packing',
    isCompanyComplete: true,
  },
  CLIENTE: {
    id: 'usr-client-01',
    name: 'Global Fresh Imports Inc.',
    email: 'compras@globalfresh.us',
    role: 'CLIENTE',
    status: 'APROBADO',
    department: 'Importación & Retail (EE.UU.)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    isCompanyComplete: true,
    company: {
      companyName: 'Global Fresh Imports Inc.',
      documentType: 'EIN',
      documentNumber: '82-1940291',
      country: 'Estados Unidos',
      address: '2400 Harbor Blvd, Long Beach, CA 90802',
      phone: '+1 (562) 555-0199',
      preferredIncoterm: 'CIF',
      preferredCurrency: 'USD',
    },
  },
};

const INITIAL_REQUESTS: ClientRegistrationRequest[] = [
  {
    id: 'req-initial-01',
    email: 'compras@globalfresh.us',
    name: 'Global Fresh Imports Inc.',
    role: 'CLIENTE',
    status: 'APROBADO',
    authProvider: 'EMAIL',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    reviewedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    reviewedBy: 'Diego Centeno',
    company: {
      companyName: 'Global Fresh Imports Inc.',
      documentType: 'EIN',
      documentNumber: '82-1940291',
      country: 'Estados Unidos',
      address: '2400 Harbor Blvd, Long Beach, CA 90802',
      phone: '+1 (562) 555-0199',
      preferredIncoterm: 'CIF',
      preferredCurrency: 'USD',
    },
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('visons_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('visons_jwt');
  });

  const [requests, setRequests] = useState<ClientRegistrationRequest[]>(() => {
    const saved = localStorage.getItem('visons_client_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_REQUESTS;
      }
    }
    return INITIAL_REQUESTS;
  });

  const [tempRegistrationUser, setTempRegistrationUser] = useState<{
    name: string;
    email: string;
    avatar?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('visons_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('visons_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('visons_jwt', token);
    } else {
      localStorage.removeItem('visons_jwt');
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem('visons_client_requests', JSON.stringify(requests));
  }, [requests]);

  const pendingRequestsCount = requests.filter((r) => r.status === 'PENDIENTE').length;

  /**
   * Inicio de Sesión Estándar (Email + Password)
   */
  const login = async (email: string, password: string = 'password123'): Promise<AuthResult> => {
    setIsLoading(true);
    const emailLower = email.trim().toLowerCase();

    // 1. RESTRICCIÓN DE CLIENTES: Verificar si el correo pertenece a una solicitud de cliente
    const clientReq = requests.find((r) => r.email.toLowerCase() === emailLower);
    if (clientReq) {
      if (clientReq.status === 'PENDIENTE') {
        setIsLoading(false);
        return {
          ok: false,
          status: 'PENDIENTE',
          message: `La solicitud de tu empresa "${clientReq.company.companyName}" está en proceso de revisión por la administración de Visons S.A.C.`,
        };
      }
      if (clientReq.status === 'RECHAZADO') {
        setIsLoading(false);
        return {
          ok: false,
          status: 'RECHAZADO',
          message: clientReq.rejectionReason
            ? `Tu solicitud no fue admitida. Motivo: ${clientReq.rejectionReason}`
            : 'Tu solicitud de acceso fue rechazada por la administración de Visons S.A.C.',
        };
      }
    }

    // 2. Intentar autenticar contra el backend Spring Boot
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: emailLower,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const role = (data.role?.toUpperCase() || 'ADMIN') as UserRole;
        const profile: UserProfile = {
          id: `usr-${data.username.split('@')[0]}`,
          name: DEFAULT_USERS[role]?.name || data.username,
          email: data.username,
          role: role,
          status: 'APROBADO',
          department: DEFAULT_USERS[role]?.department,
          avatar: DEFAULT_USERS[role]?.avatar,
          company: clientReq?.company || DEFAULT_USERS[role]?.company,
          isCompanyComplete: true,
        };
        setUser(profile);
        setToken(data.token);
        setIsLoading(false);
        return { ok: true, status: 'APROBADO', user: profile };
      }
    } catch (err) {
      console.warn('API de autenticación no respondió, evaluando perfiles locales:', err);
    }

    // 3. Autenticación Local para Admin / Trabajador o Cliente Aprobado
    if (emailLower.includes('admin') || emailLower === 'diego@visons.com') {
      const profile = { ...DEFAULT_USERS.ADMIN, email: emailLower };
      setUser(profile);
      setToken(`jwt-admin-${Date.now()}`);
      setIsLoading(false);
      return { ok: true, status: 'APROBADO', user: profile };
    }

    if (
      emailLower.includes('planta') ||
      emailLower.includes('operario') ||
      emailLower.includes('trabajador') ||
      emailLower === 'carlos.planta@visons.com'
    ) {
      const profile = { ...DEFAULT_USERS.TRABAJADOR, email: emailLower };
      setUser(profile);
      setToken(`jwt-worker-${Date.now()}`);
      setIsLoading(false);
      return { ok: true, status: 'APROBADO', user: profile };
    }

    if (clientReq && clientReq.status === 'APROBADO') {
      const profile: UserProfile = {
        id: `usr-${clientReq.id}`,
        name: clientReq.name,
        email: clientReq.email,
        role: 'CLIENTE',
        status: 'APROBADO',
        avatar: clientReq.avatar,
        company: clientReq.company,
        isCompanyComplete: true,
      };
      setUser(profile);
      setToken(`jwt-client-${Date.now()}`);
      setIsLoading(false);
      return { ok: true, status: 'APROBADO', user: profile };
    }

    setIsLoading(false);
    return {
      ok: false,
      status: 'INVALID_CREDENTIALS',
      message: 'Correo electrónico o contraseña incorrectos.',
    };
  };

  /**
   * Inicio de Sesión con Google OAuth 2.0 Real
   */
  const loginWithGoogle = async (googleData: GoogleUserData): Promise<AuthResult> => {
    setIsLoading(true);
    const emailLower = googleData.email.trim().toLowerCase();

    // 1. Verificar si es cuenta Admin o Trabajador (acceso directo corporativo)
    if (emailLower.includes('admin') || emailLower === 'diego@visons.com') {
      const profile: UserProfile = {
        ...DEFAULT_USERS.ADMIN,
        email: emailLower,
        name: googleData.name || DEFAULT_USERS.ADMIN.name,
        avatar: googleData.avatar || DEFAULT_USERS.ADMIN.avatar,
      };
      setUser(profile);
      setToken(`jwt-google-admin-${Date.now()}`);
      setIsLoading(false);
      return { ok: true, status: 'APROBADO', user: profile };
    }

    if (emailLower.includes('planta') || emailLower.includes('trabajador')) {
      const profile: UserProfile = {
        ...DEFAULT_USERS.TRABAJADOR,
        email: emailLower,
        name: googleData.name || DEFAULT_USERS.TRABAJADOR.name,
        avatar: googleData.avatar || DEFAULT_USERS.TRABAJADOR.avatar,
      };
      setUser(profile);
      setToken(`jwt-google-worker-${Date.now()}`);
      setIsLoading(false);
      return { ok: true, status: 'APROBADO', user: profile };
    }

    // 2. Verificar Solicitudes de Clientes B2B
    const clientReq = requests.find((r) => r.email.toLowerCase() === emailLower);

    if (!clientReq) {
      setIsLoading(false);
      return {
        ok: false,
        status: 'NOT_REGISTERED',
        message:
          'Tu cuenta de Google no tiene una solicitud B2B registrada. Por favor, selecciona "Registrarse (Cliente B2B)".',
      };
    }

    if (clientReq.status === 'PENDIENTE') {
      setIsLoading(false);
      return {
        ok: false,
        status: 'PENDIENTE',
        message: `La solicitud para tu empresa "${clientReq.company.companyName}" está en proceso de revisión por la administración de Visons S.A.C.`,
      };
    }

    if (clientReq.status === 'RECHAZADO') {
      setIsLoading(false);
      return {
        ok: false,
        status: 'RECHAZADO',
        message: clientReq.rejectionReason
          ? `Tu solicitud no fue admitida. Motivo: ${clientReq.rejectionReason}`
          : 'Tu solicitud de acceso fue rechazada por la administración.',
      };
    }

    // Cliente Aprobado
    const profile: UserProfile = {
      id: `usr-${clientReq.id}`,
      name: googleData.name || clientReq.name,
      email: clientReq.email,
      role: 'CLIENTE',
      status: 'APROBADO',
      avatar: googleData.avatar || clientReq.avatar,
      company: clientReq.company,
      isCompanyComplete: true,
    };
    setUser(profile);
    setToken(`jwt-google-client-${Date.now()}`);
    setIsLoading(false);
    return { ok: true, status: 'APROBADO', user: profile };
  };

  /**
   * Registro de Solicitud de Cliente B2B (con Estado PENDIENTE)
   */
  const registerClient = async (data: {
    name: string;
    email: string;
    avatar?: string;
    company: CompanyInfo;
    authProvider: 'GOOGLE' | 'EMAIL';
  }): Promise<ClientRegistrationRequest> => {
    setIsLoading(true);

    const newRequest: ClientRegistrationRequest = {
      id: `req-${Date.now()}`,
      email: data.email.trim().toLowerCase(),
      name: data.name,
      avatar: data.avatar,
      role: 'CLIENTE',
      company: data.company,
      status: 'PENDIENTE',
      authProvider: data.authProvider,
      createdAt: new Date().toISOString(),
    };

    // 1. Guardar localmente
    setRequests((prev) => [newRequest, ...prev.filter((r) => r.email !== newRequest.email)]);

    // 2. Intentar guardar en backend MongoDB
    try {
      await fetch(`${BASE_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: data.company.companyName,
          documentType: data.company.documentType,
          documentNumber: data.company.documentNumber,
          country: data.company.country,
          address: data.company.address,
          phone: data.company.phone,
          preferredIncoterm: data.company.preferredIncoterm,
          preferredCurrency: data.company.preferredCurrency,
          contactName: data.name,
          email: data.email,
        }),
      });
    } catch (err) {
      console.warn('No se pudo sincronizar la solicitud con el backend:', err);
    }

    setIsLoading(false);
    return newRequest;
  };

  /**
   * Aprobación de Solicitud (Por Administrador o Trabajador)
   */
  const approveClientRequest = (requestId: string) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: 'APROBADO',
              reviewedAt: new Date().toISOString(),
              reviewedBy: user?.name || 'Administración',
            }
          : req
      )
    );
  };

  /**
   * Rechazo de Solicitud (Por Administrador o Trabajador)
   */
  const rejectClientRequest = (requestId: string, reason: string = 'No cumple con los requisitos comerciales') => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: 'RECHAZADO',
              rejectionReason: reason,
              reviewedAt: new Date().toISOString(),
              reviewedBy: user?.name || 'Administración',
            }
          : req
      )
    );
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setTempRegistrationUser(null);
    localStorage.removeItem('visons_user');
    localStorage.removeItem('visons_jwt');
  };

  const switchRole = (role: UserRole) => {
    const newProfile = DEFAULT_USERS[role];
    setUser(newProfile);
    setToken(`jwt-${role.toLowerCase()}-${Date.now()}`);
  };

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const updateUser = (data: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem('visons_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        requests,
        pendingRequestsCount,
        tempRegistrationUser,
        setTempRegistrationUser,
        login,
        loginWithGoogle,
        registerClient,
        approveClientRequest,
        rejectClientRequest,
        logout,
        switchRole,
        hasRole,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
