import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import User, { IUser } from '@/models/User';
import dbConnect from '@/lib/mongodb';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'CLIENT' | 'LIVREUR' | 'COMMERCIAL' | 'SUPERVISEUR';
  name: string;
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  success: boolean;
  user?: IUser;
  error?: string;
  statusCode?: number;
}

export class AuthService {
  // Génération des tokens JWT
  static generateTokens(payload: Omit<TokenPayload, 'iat' | 'exp'>) {
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'amena-delivery',
      audience: 'amena-delivery-users',
    });

    const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'amena-delivery',
      audience: 'amena-delivery-users',
    });

    return { accessToken, refreshToken };
  }

  // Vérification access token
  static verifyAccessToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.verify(token, ACCESS_TOKEN_SECRET, {
        issuer: 'amena-delivery',
        audience: 'amena-delivery-users',
      }) as TokenPayload;
      
      return payload;
    } catch (error) {
      console.error('Access token invalide:', error);
      return null;
    }
  }

  // Vérification refresh token
  static verifyRefreshToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.verify(token, REFRESH_TOKEN_SECRET, {
        issuer: 'amena-delivery',
        audience: 'amena-delivery-users',
      }) as TokenPayload;
      
      return payload;
    } catch (error) {
      console.error('Refresh token invalide:', error);
      return null;
    }
  }

  // Extraction token depuis headers
  static extractTokenFromRequest(request: NextRequest): string | null {
    const authorization = request.headers.get('authorization');
    
    if (authorization && authorization.startsWith('Bearer ')) {
      return authorization.substring(7);
    }
    
    // Fallback: cookie
    const tokenFromCookie = request.cookies.get('accessToken')?.value;
    return tokenFromCookie || null;
  }

  // Middleware authentification
  static async authenticateToken(request: NextRequest): Promise<AuthResult> {
    try {
      await dbConnect();
      
      const token = this.extractTokenFromRequest(request);
      
      if (!token) {
        return {
          success: false,
          error: 'Token d\'authentification manquant',
          statusCode: 401,
        };
      }
      
      const payload = this.verifyAccessToken(token);
      
      if (!payload) {
        return {
          success: false,
          error: 'Token d\'authentification invalide',
          statusCode: 401,
        };
      }
      
      // Vérifier que l'utilisateur existe toujours
      const user = await User.findById(payload.userId).select('+refreshToken');
      
      if (!user || !user.isActive) {
        return {
          success: false,
          error: 'Utilisateur introuvable ou désactivé',
          statusCode: 401,
        };
      }
      
      return {
        success: true,
        user,
      };
      
    } catch (error) {
      console.error('Erreur authentification:', error);
      return {
        success: false,
        error: 'Erreur serveur',
        statusCode: 500,
      };
    }
  }

  // Validation des rôles
  static hasRole(user: IUser, allowedRoles: string[]): boolean {
    return allowedRoles.includes(user.role);
  }

  // Vérification permissions spécifiques
  static canCreateClients(user: IUser): boolean {
    return ['COMMERCIAL', 'SUPERVISEUR'].includes(user.role);
  }

  static canModifyCOD(user: IUser): boolean {
    return ['COMMERCIAL', 'SUPERVISEUR'].includes(user.role);
  }

  static canManageWallets(user: IUser): boolean {
    return ['COMMERCIAL', 'SUPERVISEUR'].includes(user.role);
  }

  static canAccessDelivererLists(user: IUser): boolean {
    return ['LIVREUR', 'COMMERCIAL', 'SUPERVISEUR'].includes(user.role);
  }

  // Génération d'un refresh token sécurisé
  static async refreshAccessToken(refreshToken: string): Promise<{
    success: boolean;
    accessToken?: string;
    error?: string;
  }> {
    try {
      await dbConnect();
      
      const payload = this.verifyRefreshToken(refreshToken);
      
      if (!payload) {
        return {
          success: false,
          error: 'Refresh token invalide',
        };
      }
      
      // Vérifier que le refresh token correspond en DB
      const user = await User.findById(payload.userId).select('+refreshToken');
      
      if (!user || user.refreshToken !== refreshToken || !user.isActive) {
        return {
          success: false,
          error: 'Refresh token révoqué ou utilisateur désactivé',
        };
      }
      
      // Générer nouveau access token
      const newTokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
      };
      
      const { accessToken } = this.generateTokens(newTokenPayload);
      
      return {
        success: true,
        accessToken,
      };
      
    } catch (error) {
      console.error('Erreur refresh token:', error);
      return {
        success: false,
        error: 'Erreur serveur',
      };
    }
  }

  // Logout (révocation refresh token)
  static async logout(userId: string): Promise<void> {
    try {
      await dbConnect();
      await User.findByIdAndUpdate(userId, { 
        $unset: { refreshToken: 1 } 
      });
    } catch (error) {
      console.error('Erreur logout:', error);
    }
  }
}

// Utilitaires de validation
export const validateRegistrationData = {
  client: (data: any) => {
    const errors: string[] = [];
    
    if (!data.email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.email)) {
      errors.push('Email invalide');
    }
    
    if (!data.password || data.password.length < 6) {
      errors.push('Mot de passe minimum 6 caractères');
    }
    
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Nom requis (minimum 2 caractères)');
    }
    
    if (!data.phone || !/^[0-9+\-\s()]{8,20}$/.test(data.phone)) {
      errors.push('Numéro de téléphone invalide');
    }
    
    // Validations spécifiques client
    if (!data.shopName || data.shopName.trim().length < 2) {
      errors.push('Nom de boutique requis');
    }
    
    if (!data.fiscalNumber || data.fiscalNumber.trim().length < 5) {
      errors.push('Numéro fiscal requis');
    }
    
    if (!data.address || data.address.trim().length < 10) {
      errors.push('Adresse complète requise');
    }
    
    return errors;
  },
  
  employee: (data: any) => {
    const errors: string[] = [];
    
    if (!data.email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.email)) {
      errors.push('Email invalide');
    }
    
    if (!data.password || data.password.length < 6) {
      errors.push('Mot de passe minimum 6 caractères');
    }
    
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Nom requis (minimum 2 caractères)');
    }
    
    if (!data.phone || !/^[0-9+\-\s()]{8,20}$/.test(data.phone)) {
      errors.push('Numéro de téléphone invalide');
    }
    
    if (!['LIVREUR', 'COMMERCIAL', 'SUPERVISEUR'].includes(data.role)) {
      errors.push('Rôle invalide');
    }
    
    return errors;
  },
};