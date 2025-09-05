// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await AuthService.authenticateToken(request);
    
    if (authResult.success && authResult.user) {
      // Révoquer le refresh token en base
      await AuthService.logout(authResult.user._id.toString());
    }

    // Supprimer les cookies
    const response = NextResponse.json(
      {
        success: true,
        message: 'Déconnexion réussie',
      },
      { status: 200 }
    );

    // Supprimer les cookies d'authentification
    response.cookies.set('accessToken', '', {
      httpOnly: false,
      expires: new Date(0),
      path: '/',
    });

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Erreur logout:', error);
    
    // Même en cas d'erreur, supprimer les cookies côté client
    const response = NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la déconnexion',
      },
      { status: 500 }
    );

    response.cookies.set('accessToken', '', {
      httpOnly: false,
      expires: new Date(0),
      path: '/',
    });

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });

    return response;
  }
}

// src/app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Récupérer refresh token depuis cookie
    const refreshToken = request.cookies.get('refreshToken')?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Refresh token manquant',
        },
        { status: 401 }
      );
    }

    // Générer nouveau access token
    const result = await AuthService.refreshAccessToken(refreshToken);
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 401 }
      );
    }

    // Définir nouveau cookie access token
    const response = NextResponse.json(
      {
        success: true,
        accessToken: result.accessToken,
      },
      { status: 200 }
    );

    response.cookies.set('accessToken', result.accessToken!, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Erreur refresh token:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}

// src/app/api/create-first-admin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// Route spéciale pour créer le premier administrateur
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Vérifier qu'aucun superviseur n'existe déjà
    const existingSupervisor = await User.findOne({ role: 'SUPERVISEUR' });
    
    if (existingSupervisor) {
      return NextResponse.json(
        {
          success: false,
          error: 'Un superviseur existe déjà. Utilisez la connexion normale.',
        },
        { status: 409 }
      );
    }

    const { email, password, name, phone } = await request.json();

    // Validation basique
    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tous les champs sont requis',
        },
        { status: 400 }
      );
    }

    // Créer le premier superviseur
    const supervisor = new User({
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
      phone: phone.trim(),
      role: 'SUPERVISEUR',
      wallet: {
        balance: 0,
        pendingAmount: 0,
        updatedAt: new Date(),
      },
      isActive: true,
    });

    await supervisor.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Premier superviseur créé avec succès !',
        data: {
          id: supervisor._id,
          email: supervisor.email,
          name: supervisor.name,
          role: supervisor.role,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erreur création premier admin:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Un utilisateur avec cet email existe déjà',
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}