import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

// REGISTER USER
export const registerUser = async (req, res) => {
  const { full_name, email, password, phone, cnic } = req.body;

  if (!full_name || !email || !password || !cnic) {
    return res.status(400).json({ message: 'Please fill all required fields' });
  }

  try {
    // Check if email or CNIC already exists
    const [existingUsers] = await db.query(
      'SELECT * FROM Users WHERE email = ? OR cnic = ?',
      [email, cnic]
    );
    if (existingUsers.length) {
      return res.status(400).json({ message: 'Email or CNIC already registered' });
    }

    console.log('Registering user with email:', email);
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    console.log('Password hashed successfully');
    console.log('Inserting user into database');
    // Insert user into database
    await db.query(
      'INSERT INTO Users (full_name, email, password_hash, phone, cnic, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [full_name, email, password_hash, phone || null, cnic, 'customer', 'pending']
    );

    res.status(201).json({ message: 'Registration successful! Please login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// REGISTER ADMIN (backend-only, via Postman)
export const registerAdmin = async (req, res) => {
  const { fullName, email, password, phone, cnic } = req.body;

  // Required fields check
  if (!fullName || !email || !password || !cnic) {
    return res.status(400).json({ message: 'Please fill all required fields' });
  }

  try {
    // Check if email or CNIC already exists
    const [existingUsers] = await db.query(
      'SELECT * FROM Users WHERE email = ? OR cnic = ?',
      [email, cnic]
    );
    if (existingUsers.length) {
      return res.status(400).json({ message: 'Email or CNIC already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert admin into database
    await db.query(
      'INSERT INTO Users (full_name, email, password_hash, phone, cnic, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [fullName, email, password_hash, phone || null, cnic, 'admin', 'approved'] // admin approved by default
    );

    res.status(201).json({ message: 'Admin registration successful!' });
  } catch (err) {
    console.error('Admin registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



// LOGIN USER
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment');
      return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET not set' });
    }
    const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
    const user = users[0];
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Block login for deleted accounts
    if (user.status === 'deleted') {
      return res.status(403).json({ message: 'Account has been deleted' });
    }

    // access denied for rejected accounts
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Account opening request denied' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 3600000, // 1 hour
    });

    res.json({ user: { id: user.user_id, full_name: user.full_name, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// LOGOUT USER
export const logoutUser = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });
  res.json({ message: 'Logged out successfully' });
};

// GET CURRENT AUTHENTICATED USER
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Not authorized' });

    const [users] = await db.query('SELECT user_id, full_name, email, role FROM Users WHERE user_id = ?', [userId]);
    const user = users[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user: { id: user.user_id, full_name: user.full_name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
