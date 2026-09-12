import { connectToDatabase, disconnectFromDatabase } from '../config/database.js';
import { UserModel } from '../models/user.js';

const demoEmail = 'demo@finance.local';
const demoPassword = 'Demo@12345';

async function seedDemoUser(): Promise<void> {
  await connectToDatabase();

  const existingUser = await UserModel.findOne({ email: demoEmail });
  if (existingUser) {
    console.log(`Demo user already exists: ${demoEmail}`);
    return;
  }

  await UserModel.create({ email: demoEmail, passwordHash: demoPassword });
  console.log(`Demo user created: ${demoEmail}`);
}

seedDemoUser()
  .catch((error: unknown) => {
    console.error('Demo user seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectFromDatabase();
  });
