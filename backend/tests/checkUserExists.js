const { User } = require('../models');

async function checkUserExists(email, username) {
    console.log('Checking for existing users...');

    const userByEmail = await User.findOne({ where: { email } });
    console.log('Email:', email);
    console.log('Username:', username);

    const userByUsername = await User.findOne({ where: { username } });

    if (userByEmail) {
        console.log('User with this email already exists:', userByEmail.email);
    } else {
        console.log('No user found with this email.');
    }

    if (userByUsername) {
        console.log('User with this username already exists:', userByUsername.username);
    } else {
        console.log('No user found with this username.');
    }
}

// Replace with the email and username you want to check
checkUserExists('test@example.com', 'testuser');
