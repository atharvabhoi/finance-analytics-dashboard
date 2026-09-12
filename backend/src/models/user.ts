import bcrypt from 'bcryptjs';
import { HydratedDocument, model, Model, Schema } from 'mongoose';

const PASSWORD_SALT_ROUNDS = 12;

export interface User {
  email: string;
  passwordHash: string;
}

interface UserMethods {
  verifyPassword(candidatePassword: string): Promise<boolean>;
}

type UserModel = Model<User, object, UserMethods>;
type UserDocument = HydratedDocument<User, UserMethods>;

const userSchema = new Schema<User, UserModel, UserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'email must be valid.'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    collection: 'users',
    timestamps: true,
    versionKey: false,
  },
);

userSchema.pre('save', async function hashPassword(this: UserDocument) {
  if (!this.isModified('passwordHash')) {
    return;
  }

  this.passwordHash = await bcrypt.hash(this.passwordHash, PASSWORD_SALT_ROUNDS);
});

userSchema.methods.verifyPassword = async function verifyPassword(
  this: UserDocument,
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const UserModel = model<User, UserModel>('User', userSchema);
