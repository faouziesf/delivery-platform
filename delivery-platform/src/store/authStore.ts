import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  _id: string;
  email: string;
  name: string;
  phone: string;
  role: 'CLIENT' | 'LIVREUR' | 'COMMERCIAL' | 'SUPERVISEUR';
  wallet: {
    balance: number;
    pendingAmount: number;
    updatedAt: string;
  };
  clientProfile?: {
    shopName?: string;
    fiscalNumber?: string;
    businessSector?: string;
    address?: string;
    offerDeliveryPrice: number;
    offerReturnPrice: number;
    accountStatus: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
    verifiedAt?: string;
  };
  lastLogin?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  // État
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions d'authentification
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<{ success: boolean; message?: string; error?: string }>;
  refreshToken: () => Promise<boolean>;
  checkAuthStatus: () => Promise<void>;
  
  // Actions utilisateur
  updateUser: (userData: Partial<User>) => void;
  updateWallet: (balance: number, pendingAmount?: number) => void;
  
  // Utilitaires
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  
  // Permissions (computed)
  canCreateClients: () => boolean;
  canModifyCOD: () => boolean;
  canManageWallets: () => boolean;
  canAccessDelivererLists: () => boolean;
  
  // Dashboard routes
  getDashboardRoute: () => string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (data.success) {
            set({
              user: data.user,
              accessToken: data.accessToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: data.error || 'Erreur de connexion',
            });
            return false;
          }
        } catch (error) {
          console.error('Erreur login:', error);
          set({
            isLoading: false,
            error: 'Erreur réseau. Vérifiez votre connexion.',
          });
          return false;
        }
      },

      // Logout
      logout: async () => {
        set({ isLoading: true });
        
        try {
          const { accessToken } = get();
          
          // Appel API logout pour révoquer le refresh token
          if (accessToken) {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            });
          }
        } catch (error) {
          console.error('Erreur logout API:', error);
        } finally {
          // Reset complet du store
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          
          // Supprimer les cookies côté client
          document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
      },

      // Register
      register: async (userData: any) => {
        set({ isLoading: true, error: null });
        
        try {
          const { accessToken } = get();
          
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          
          // Ajouter token si authentifié (pour créer des clients)
          if (accessToken) {
            headers.Authorization = `Bearer ${accessToken}`;
          }

          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers,
            body: JSON.stringify(userData),
          });

          const data = await response.json();
          
          set({ isLoading: false });

          if (data.success) {
            // Si c'est la création d'un employé (pas client), connecter automatiquement
            if (data.user && data.accessToken) {
              set({
                user: data.user,
                accessToken: data.accessToken,
                isAuthenticated: true,
              });
            }
            
            return {
              success: true,
              message: data.message,
            };
          } else {
            set({ error: data.error });
            return {
              success: false,
              error: data.error,
            };
          }
        } catch (error) {
          console.error('Erreur register:', error);
          set({
            isLoading: false,
            error: 'Erreur réseau. Vérifiez votre connexion.',
          });
          return {
            success: false,
            error: 'Erreur réseau',
          };
        }
      },

      // Refresh token
      refreshToken: async () => {
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include', // Pour envoyer les cookies
          });

          const data = await response.json();

          if (data.success && data.accessToken) {
            set({
              accessToken: data.accessToken,
              error: null,
            });
            return true;
          } else {
            // Token refresh échoué, déconnecter
            get().logout();
            return false;
          }
        } catch (error) {
          console.error('Erreur refresh token:', error);
          get().logout();
          return false;
        }
      },

      // Vérifier statut authentification
      checkAuthStatus: async () => {
        const { accessToken } = get();
        
        if (!accessToken) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const response = await fetch('/api/auth/login', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.authenticated && data.user) {
              set({
                user: data.user,
                isAuthenticated: true,
                error: null,
              });
            } else {
              get().logout();
            }
          } else {
            // Essayer de refresh le token
            const refreshed = await get().refreshToken();
            if (!refreshed) {
              get().logout();
            }
          }
        } catch (error) {
          console.error('Erreur check auth:', error);
          get().logout();
        }
      },

      // Mise à jour utilisateur
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      // Mise à jour wallet
      updateWallet: (balance: number, pendingAmount = 0) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              wallet: {
                ...currentUser.wallet,
                balance,
                pendingAmount,
                updatedAt: new Date().toISOString(),
              },
            },
          });
        }
      },

      // Utilitaires
      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      // Permissions
      canCreateClients: () => {
        const { user } = get();
        return user ? ['COMMERCIAL', 'SUPERVISEUR'].includes(user.role) : false;
      },

      canModifyCOD: () => {
        const { user } = get();
        return user ? ['COMMERCIAL', 'SUPERVISEUR'].includes(user.role) : false;
      },

      canManageWallets: () => {
        const { user } = get();
        return user ? ['COMMERCIAL', 'SUPERVISEUR'].includes(user.role) : false;
      },

      canAccessDelivererLists: () => {
        const { user } = get();
        return user ? ['LIVREUR', 'COMMERCIAL', 'SUPERVISEUR'].includes(user.role) : false;
      },

      // Dashboard route selon le rôle
      getDashboardRoute: () => {
        const { user } = get();
        if (!user) return '/login';
        
        const routes = {
          CLIENT: '/dashboard/client',
          LIVREUR: '/dashboard/livreur',
          COMMERCIAL: '/dashboard/commercial',
          SUPERVISEUR: '/dashboard/superviseur',
        };
        
        return routes[user.role] || '/dashboard';
      },
    }),
    {
      name: 'auth-storage', // Nom du localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Ne persister que certaines parties du store
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Erreur rehydratation store:', error);
          } else if (state?.isAuthenticated) {
            // Vérifier le statut d'auth au rechargement
            state.checkAuthStatus?.();
          }
        };
      },
    }
  )
);

// Hook pour les permissions rapides
export const usePermissions = () => {
  const canCreateClients = useAuthStore((state) => state.canCreateClients());
  const canModifyCOD = useAuthStore((state) => state.canModifyCOD());
  const canManageWallets = useAuthStore((state) => state.canManageWallets());
  const canAccessDelivererLists = useAuthStore((state) => state.canAccessDelivererLists());
  const user = useAuthStore((state) => state.user);
  
  return {
    canCreateClients,
    canModifyCOD,
    canManageWallets,
    canAccessDelivererLists,
    isClient: user?.role === 'CLIENT',
    isLivreur: user?.role === 'LIVREUR',
    isCommercial: user?.role === 'COMMERCIAL',
    isSuperviseur: user?.role === 'SUPERVISEUR',
    role: user?.role,
  };
};

// Hook pour les actions d'auth
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    clearError,
    getDashboardRoute,
  } = useAuthStore();
  
  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    clearError,
    getDashboardRoute,
  };
};