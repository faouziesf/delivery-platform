import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Test connexion MongoDB
    await dbConnect();
    
    return NextResponse.json(
      { 
        success: true, 
        message: '🎉 MongoDB connecté !',
        timestamp: new Date().toISOString(),
        database: process.env.MONGODB_URI?.split('/').pop()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Erreur test MongoDB:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur connexion MongoDB',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}