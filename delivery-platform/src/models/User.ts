import mongoose, { Document, Schema } from 'mongoose';
import bcryptjs from 'bcryptjs';

export interface IClientProfile {
  shopName?: string;
  fiscalNumber?: string;
  businessSector?: string;
  identityDocument?: string;
  address?: string;
  offerDeliveryPrice: number;
  offerReturnPrice: number;
  accountStatus: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  verifiedAt?: Date;
  verifiedByCommercialId?: mongoose.Types.ObjectId;
}

export interface IWallet {
  balance: number;
  pendingAmount: number;
  lastTransactionId?: string;
  updatedAt: Date;
}

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'CLIENT' | 'LIVREUR' | 'COMMERCIAL' | 'SUPERVISEUR';
  
  // Profil Client (optionnel selon rôle)
  clientProfile?: IClientProfile;
  
  // Wallet (tous les rôles)
  wallet: IWallet;
  
  // Métadonnées
  lastLogin?: Date;
  refreshToken?: string;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId; // Commercial/Superviseur qui a créé le compte
  createdAt: Date;
  updatedAt: Date;
  
  // Méthodes
  comparePassword(candidatePassword: string): Promise<boolean>;
  toJSON(): any;
  canCreateClients(): boolean;
  canModifyCOD(): boolean;
  canManageWallets(): boolean;
}

const ClientProfileSchema = new Schema<IClientProfile>({
  shopName: {
    type: String,
    trim: true,
  },
  fiscalNumber: {
    type: String,
    trim: true,
  },
  businessSector: {
    type: String,
    trim: true,
  },
  identityDocument: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  offerDeliveryPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  offerReturnPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  accountStatus: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED'],
    default: 'PENDING',
  },
  verifiedAt: {
    type: Date,
  },
  verifiedByCommercialId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
});

const WalletSchema = new Schema<IWallet>({
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  pendingAmount: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  lastTransactionId: {
    type: String,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email requis'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide'],
    },
    password: {
      type: String,
      required: [true, 'Mot de passe requis'],
      minlength: [6, 'Mot de passe minimum 6 caractères'],
      select: false, // Exclu par défaut des requêtes
    },
    name: {
      type: String,
      required: [true, 'Nom requis'],
      trim: true,
      maxlength: [100, 'Nom maximum 100 caractères'],
    },
    phone: {
      type: String,
      required: [true, 'Téléphone requis'],
      trim: true,
      match: [/^[0-9+\-\s()]{8,20}$/, 'Numéro de téléphone invalide'],
    },
    role: {
      type: String,
      enum: {
        values: ['CLIENT', 'LIVREUR', 'COMMERCIAL', 'SUPERVISEUR'],
        message: 'Rôle invalide',
      },
      required: [true, 'Rôle requis'],
    },
    
    // Profil Client conditionnel
    clientProfile: {
      type: ClientProfileSchema,
      required: function(this: IUser) {
        return this.role === 'CLIENT';
      },
    },
    
    // Wallet obligatoire
    wallet: {
      type: WalletSchema,
      required: true,
      default: () => ({
        balance: 0,
        pendingAmount: 0,
        updatedAt: new Date(),
      }),
    },
    
    // Métadonnées
    lastLogin: {
      type: Date,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password avant sauvegarde
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  this.password = await bcryptjs.hash(this.password, rounds);
  next();
});

// Mise à jour wallet.updatedAt
UserSchema.pre('save', function (next) {
  if (this.isModified('wallet')) {
    this.wallet.updatedAt = new Date();
  }
  next();
});

// Méthode comparaison password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcryptjs.compare(candidatePassword, this.password);
};

// Méthodes de permissions basées sur le rôle
UserSchema.methods.canCreateClients = function (): boolean {
  return ['COMMERCIAL', 'SUPERVISEUR'].includes(this.role);
};

UserSchema.methods.canModifyCOD = function (): boolean {
  return ['COMMERCIAL', 'SUPERVISEUR'].includes(this.role);
};

UserSchema.methods.canManageWallets = function (): boolean {
  return ['COMMERCIAL', 'SUPERVISEUR'].includes(this.role);
};

// Index pour performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ 'clientProfile.accountStatus': 1 });
UserSchema.index({ createdBy: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);