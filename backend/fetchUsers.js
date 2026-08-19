import 'dotenv/config';
import { getJsonFromS3 } from './src/services/s3DatabaseService.js';
import fs from 'fs';

const fetchUsers = async () => {
  try {
    let users = await getJsonFromS3('users.json');
    
    const userList = users.map(u => ({
      name: u.name,
      email: u.email,
      role: u.role,
      password: "ENCRYPTED (Cannot be seen)"
    }));

    console.log(JSON.stringify(userList, null, 2));
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

fetchUsers();
