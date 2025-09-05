import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, password } = body;

    // Validation basique
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email et mot de passe requis' 
        },
        { status: 400 }
      );
    }

    // Normaliser l'email
    const normalizedEmail = email.toLowerCase().trim();

    // Recherche utilisateur avec password
    const user = await User.findOne({ 
      email: normalizedEmail,
      isActive: true 
    }).select('+password +refreshToken');
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email ou mot de passe incorrect' 
        },
        { status: 401 }
      );
    }

    // Vérification mot de passe
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email ou mot de passe incorrect' 
        },
        { status: 401 }
      );
    }

    // Vérification statut compte CLIENT
    if (user.role === 'CLIENT') {
      const accountStatus = user.clientProfile?.accountStatus;
      
      if (accountStatus === 'PENDING') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Compte client en attente de validation par un commercial',
            statusCode: 'ACCOUNT_PENDING'
          },
          { status: 403 }
        );
      }
      
      if (accountStatus === 'SUSPENDED') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Compte client suspendu. Contactez un commercial',
            statusCode: 'ACCOUNT_SUSPENDED'
          },
          { status: 403 }
        );
      }
    }

    // Génération des tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const { accessToken, refreshToken } = AuthService.generateTokens(tokenPayload);

    // Sauvegarde refresh token et dernière connexion
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // Réponse avec données utilisateur (sans password)
    const userResponse = user.toJSON();

    // Headers de réponse sécurisés
    const response = NextResponse.json(
      {
        success: true,
        message: 'Connexion réussie',
        user: userResponse,
        accessToken,
        // refreshToken envoyé en cookie httpOnly pour sécurité
      },
      { status: 200 }
    );

    // Cookie httpOnly pour refresh token
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 jours
      path: '/',
    });

    // Cookie pour access token (optionnel, peut rester côté client)
    response.cookies.set('accessToken', accessToken, {
      httpOnly: false, // Accessible côté client pour headers
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Erreur login:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur serveur. Veuillez réessayer.' 
      },
      { status: 500 }
    );
  }
}

// Route GET pour vérifier le statut d'authentification
export async function GET(request: NextRequest) {
  try {
    const authResult = await AuthService.authenticateToken(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: authResult.error,
          authenticated: false 
        },
        { status: authResult.statusCode || 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        authenticated: true,
        user: authResult.user?.toJSON(),
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur vérification auth:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur serveur',
        authenticated: false 
      },
      { status: 500 }
    );
  }
}