import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { AuthService, validateRegistrationData } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { 
      email, 
      password, 
      name, 
      phone, 
      role,
      // Données client spécifiques
      shopName,
      fiscalNumber,
      businessSector,
      identityDocument,
      address,
      offerDeliveryPrice,
      offerReturnPrice,
    } = body;

    // 🔒 VÉRIFICATION PERMISSIONS CRÉATION COMPTE
    
    // Pour créer un CLIENT, il faut être authentifié comme COMMERCIAL ou SUPERVISEUR
    if (role === 'CLIENT') {
      const authResult = await AuthService.authenticateToken(request);
      
      if (!authResult.success) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Authentification requise pour créer un compte client',
            requireAuth: true
          },
          { status: 401 }
        );
      }

      if (!AuthService.canCreateClients(authResult.user!)) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Seuls les commerciaux et superviseurs peuvent créer des comptes clients',
            insufficientPermissions: true
          },
          { status: 403 }
        );
      }
    }

    // Pour créer COMMERCIAL ou SUPERVISEUR, il faut être SUPERVISEUR
    if (['COMMERCIAL', 'SUPERVISEUR'].includes(role)) {
      const authResult = await AuthService.authenticateToken(request);
      
      if (!authResult.success || authResult.user!.role !== 'SUPERVISEUR') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Seul un superviseur peut créer des comptes commercial/superviseur',
            requireSupervisorAuth: true
          },
          { status: 403 }
        );
      }
    }

    // LIVREUR peut être créé par COMMERCIAL ou SUPERVISEUR
    if (role === 'LIVREUR') {
      const authResult = await AuthService.authenticateToken(request);
      
      if (!authResult.success) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Authentification requise pour créer un compte livreur'
          },
          { status: 401 }
        );
      }

      if (!['COMMERCIAL', 'SUPERVISEUR'].includes(authResult.user!.role)) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Seuls les commerciaux et superviseurs peuvent créer des comptes livreurs'
          },
          { status: 403 }
        );
      }
    }

    // 📝 VALIDATION DES DONNÉES
    
    let validationErrors: string[] = [];
    
    if (role === 'CLIENT') {
      validationErrors = validateRegistrationData.client({
        email, password, name, phone, shopName, fiscalNumber, address
      });
    } else {
      validationErrors = validateRegistrationData.employee({
        email, password, name, phone, role
      });
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Données invalides',
          validationErrors
        },
        { status: 400 }
      );
    }

    // 🔍 VÉRIFICATION UNICITÉ EMAIL
    
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Un compte avec cet email existe déjà'
        },
        { status: 409 }
      );
    }

    // 👤 CRÉATION DU COMPTE
    
    const userData: any = {
      email: normalizedEmail,
      password,
      name: name.trim(),
      phone: phone.trim(),
      role,
      wallet: {
        balance: 0,
        pendingAmount: 0,
        updatedAt: new Date(),
      },
    };

    // Données spécifiques CLIENT
    if (role === 'CLIENT') {
      userData.clientProfile = {
        shopName: shopName?.trim(),
        fiscalNumber: fiscalNumber?.trim(),
        businessSector: businessSector?.trim(),
        identityDocument: identityDocument?.trim(),
        address: address?.trim(),
        offerDeliveryPrice: parseFloat(offerDeliveryPrice) || 0,
        offerReturnPrice: parseFloat(offerReturnPrice) || 0,
        accountStatus: 'PENDING', // Toujours en attente de validation
      };

      // Qui a créé le compte client
      const authResult = await AuthService.authenticateToken(request);
      if (authResult.success) {
        userData.createdBy = authResult.user!._id;
      }
    }

    // Création en base
    const newUser = new User(userData);
    await newUser.save();

    // 🎯 RÉPONSE SELON LE TYPE DE COMPTE
    
    if (role === 'CLIENT') {
      return NextResponse.json(
        {
          success: true,
          message: 'Compte client créé avec succès',
          data: {
            userId: newUser._id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            accountStatus: newUser.clientProfile?.accountStatus,
            shopName: newUser.clientProfile?.shopName,
          },
          nextSteps: [
            'Le client recevra ses identifiants par email',
            'Validation du compte requise avant activation',
            'Documents à vérifier: CIN, registre commerce, matricule fiscal'
          ]
        },
        { status: 201 }
      );
    }

    // Pour LIVREUR, COMMERCIAL, SUPERVISEUR - compte actif immédiatement
    const tokenPayload = {
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    };

    const { accessToken, refreshToken } = AuthService.generateTokens(tokenPayload);

    // Sauvegarde refresh token
    newUser.refreshToken = refreshToken;
    newUser.lastLogin = new Date();
    await newUser.save();

    const response = NextResponse.json(
      {
        success: true,
        message: `Compte ${role.toLowerCase()} créé avec succès`,
        user: newUser.toJSON(),
        accessToken,
      },
      { status: 201 }
    );

    // Cookies sécurisés
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set('accessToken', accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Erreur création compte:', error);
    
    // Erreur de validation Mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Données invalides',
          validationErrors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur serveur. Veuillez réessayer.' 
      },
      { status: 500 }
    );
  }
}

// Route GET pour obtenir les options de création selon le rôle connecté
export async function GET(request: NextRequest) {
  try {
    const authResult = await AuthService.authenticateToken(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentification requise'
        },
        { status: 401 }
      );
    }

    const user = authResult.user!;
    const availableRoles: string[] = [];

    // Permissions selon le rôle
    if (user.role === 'SUPERVISEUR') {
      availableRoles.push('CLIENT', 'LIVREUR', 'COMMERCIAL', 'SUPERVISEUR');
    } else if (user.role === 'COMMERCIAL') {
      availableRoles.push('CLIENT', 'LIVREUR');
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          currentUser: {
            name: user.name,
            role: user.role,
          },
          availableRoles,
          permissions: {
            canCreateClients: AuthService.canCreateClients(user),
            canCreateEmployees: ['COMMERCIAL', 'SUPERVISEUR'].includes(user.role),
            canCreateCommercials: user.role === 'SUPERVISEUR',
            canCreateSuperviseurs: user.role === 'SUPERVISEUR',
          }
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur permissions:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur serveur' 
      },
      { status: 500 }
    );
  }
}