
// scripts/create-headadmin.js - Script to create head admin
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createHeadAdmin() {
  console.log('🚀 Creating Head Admin Account...\n');
  
  try {
    // Check if head admin already exists
    const existingHeadAdmin = await prisma.user.findFirst({
      where: { role: 'headadmin' }
    });

    if (existingHeadAdmin) {
      console.log('❌ Head admin already exists!');
      console.log(`Email: ${existingHeadAdmin.email}`);
      console.log(`Name: ${existingHeadAdmin.firstName} ${existingHeadAdmin.lastName}`);
      return;
    }

    const firstName = await question('First Name: ');
    const lastName = await question('Last Name: ');
    const email = await question('Email: ');
    
    let password;
    let confirmPassword;
    
    do {
      password = await question('Password (min 8 chars, must include uppercase, lowercase, number, special char): ');
      confirmPassword = await question('Confirm Password: ');
      
      if (password !== confirmPassword) {
        console.log('❌ Passwords do not match. Please try again.\n');
      }
    } while (password !== confirmPassword);

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log('❌ Password does not meet requirements.');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create head admin
    const headAdmin = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: passwordHash,
        role: 'headadmin',
        isActive: true,
        isEmailVerified: true
      }
    });

    console.log('\n✅ Head Admin created successfully!');
    console.log(`ID: ${headAdmin.id}`);
    console.log(`Name: ${headAdmin.firstName} ${headAdmin.lastName}`);
    console.log(`Email: ${headAdmin.email}`);
    
  } catch (error) {
    console.error('❌ Failed to create head admin:', error);
  }
}

createHeadAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
