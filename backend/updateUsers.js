import 'dotenv/config';
import { getJsonFromS3, saveJsonToS3 } from './src/services/s3DatabaseService.js';

const updateDatabaseUsers = async () => {
  console.log('🔄 Starting User Database Update...');

  try {
    let users = await getJsonFromS3('users.json');
    
    // 1. Remove poornimasahu399@gmail.com
    const initialUserCount = users.length;
    users = users.filter(u => u.email !== 'poornimasahu399@gmail.com');
    console.log(`🗑️ Removed ${initialUserCount - users.length} user(s) matching poornimasahu399@gmail.com`);

    // 2. Change admin@universalparser.com to superadmin@gmail.com
    let adminUpdated = false;
    users = users.map(u => {
      if (u.email === 'admin@universalparser.com') {
        adminUpdated = true;
        return { ...u, email: 'superadmin@gmail.com' };
      }
      return u;
    });

    if (adminUpdated) {
      console.log('✅ Updated Super Admin email to superadmin@gmail.com');
    } else {
      console.log('⚠️ Could not find admin@universalparser.com to update. Maybe it was already updated?');
    }

    // Save changes to S3
    await saveJsonToS3('users.json', users);
    console.log('💾 Successfully saved updated users.json to S3 Database!');

  } catch (error) {
    console.error('❌ Error updating S3 user database:', error);
  }
};

updateDatabaseUsers();
