const express = require('express');
const User = require('../models/User');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        tryOnHistory: user.tryOnHistory,
        favorites: user.favorites
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        tryOnHistory: user.tryOnHistory,
        favorites: user.favorites
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('tryOnHistory', 'personImage garmentImage resultImage createdAt')
      .populate('favorites', 'personImage garmentImage resultImage createdAt');

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        tryOnHistory: user.tryOnHistory,
        favorites: user.favorites,
        referenceImages: user.referenceImages,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    const userId = req.user._id;

    // Check if username/email is already taken by another user
    if (username || email) {
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : [])
        ]
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: existingUser.username === username ? 'Username already taken' : 'Email already registered'
        });
      }
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email
    }
  });
});

// Upload reference images
router.post('/reference-images', authenticateToken, async (req, res) => {
  try {
    const { fullLengthImage, passportImage } = req.body;
    const userId = req.user._id;

    if (!fullLengthImage || !passportImage) {
      return res.status(400).json({ message: 'Both full-length and passport images are required' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        'referenceImages.fullLengthImage': fullLengthImage,
        'referenceImages.passportImage': passportImage,
        'referenceImages.uploadedAt': new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Reference images uploaded successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        referenceImages: user.referenceImages
      }
    });

  } catch (error) {
    console.error('Reference images upload error:', error);
    res.status(500).json({ message: 'Failed to upload reference images' });
  }
});

module.exports = router;
