import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { getJsonFromS3, saveJsonToS3 } from './src/services/s3DatabaseService.js';

/**
 * S3 Database Seeder
 * This script initializes the master 'super_admin' account in the S3 JSON database.
 */
const seedS3Database = async () => {
  console.log('🌱 Starting S3 Database Seeding Process...');

  try {
    let users = await getJsonFromS3('users.json');
    
    // Check if the super_admin already exists
    const adminExists = users.find(u => u.email === 'superadmin@gmail.com');
    
    if (adminExists) {
      console.log('✅ Super Admin account already exists in S3 (users.json).');
    } else {
      console.log('👤 Generating Master Super Admin Account...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('superadmin123', salt);
      
      const superAdmin = {
        id: `usr_${Date.now()}`,
        name: 'System Admin',
        email: 'superadmin@gmail.com',
        password: hashedPassword,
        role: 'super_admin',
        createdAt: new Date().toISOString()
      };

      users.push(superAdmin);
      
      const success = await saveJsonToS3('users.json', users);
      if (success) {
        console.log('👑 Super Admin account successfully generated and saved to AWS S3!');
        console.log('📧 Email: admin@universalparser.com');
        console.log('🔑 Password: superadmin123');
      } else {
        console.error('❌ Failed to save Super Admin account to S3.');
      }
    }

    console.log('🎉 S3 Database Seeding Complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

// Execute the seeder
seedS3Database();
