const express = require('express');
const TryOn = require('../models/TryOn');
const User = require('../models/User');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { tryOn, generateMultiAngleTryOn } = require('../services/geminiService');

const router = express.Router();

// Test endpoint for debugging
router.post('/test', authenticateToken, async (req, res) => {
  try {
    console.log('Test endpoint called');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    res.json({ 
      message: 'Test successful',
      hasPersonImage: !!req.body.personImage,
      hasGarmentImage: !!req.body.garmentImage,
      useReferenceImages: req.body.useReferenceImages
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ message: 'Test failed' });
  }
});

// Create new try-on
router.post('/create', authenticateToken, async (req, res) => {
  try {
    console.log('Try-on create endpoint called');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Has personImage:', !!req.body.personImage);
    console.log('Has garmentImage:', !!req.body.garmentImage);
    console.log('useReferenceImages:', req.body.useReferenceImages);
    
    const { personImage, garmentImage, garmentDescription, tags, useReferenceImages } = req.body;
    const userId = req.user._id;

    // Validation
    if (!garmentImage) {
      return res.status(400).json({ message: 'Garment image is required' });
    }

    let finalPersonImage = personImage;
    let imageSource = 'uploaded';

    // Check if user wants to use reference images and they exist
    if (useReferenceImages && req.user.referenceImages?.fullLengthImage) {
      finalPersonImage = req.user.referenceImages.fullLengthImage;
      imageSource = 'reference';
    } else if (!personImage) {
      return res.status(400).json({ message: 'Person image is required when not using reference images' });
    }

    // Generate try-on result using Gemini API
    let resultImage;
    let multiAngleResults = {};

    try {
      // Generate multi-angle results
      multiAngleResults = await generateMultiAngleTryOn(
        finalPersonImage,
        'image/jpeg',
        garmentImage,
        'image/jpeg'
      );
      
      // Use front view as the main result image
      resultImage = multiAngleResults.front || await tryOn(
        finalPersonImage,
        'image/jpeg',
        garmentImage,
        'image/jpeg',
        'front'
      );
    } catch (error) {
      console.error('Multi-angle generation failed, falling back to single image:', error);
      // Fallback to single image generation
      resultImage = await tryOn(
        finalPersonImage,
        'image/jpeg',
        garmentImage,
        'image/jpeg',
        'front'
      );
    }

    // Save try-on to database
    const tryOnRecord = new TryOn({
      userId,
      personImage: finalPersonImage,
      garmentImage,
      resultImage,
      multiAngleResults,
      garmentDescription: garmentDescription || '',
      imageSource,
      tags: tags || []
    });

    await tryOnRecord.save();

    // Add to user's try-on history
    await User.findByIdAndUpdate(
      userId,
      { $push: { tryOnHistory: tryOnRecord._id } }
    );

    res.status(201).json({
      message: 'Try-on created successfully',
      tryOn: {
        id: tryOnRecord._id,
        personImage: tryOnRecord.personImage,
        garmentImage: tryOnRecord.garmentImage,
        resultImage: tryOnRecord.resultImage,
        multiAngleResults: tryOnRecord.multiAngleResults,
        garmentDescription: tryOnRecord.garmentDescription,
        tags: tryOnRecord.tags,
        imageSource: tryOnRecord.imageSource,
        createdAt: tryOnRecord.createdAt
      }
    });

  } catch (error) {
    console.error('Try-on creation error:', error);
    res.status(500).json({ message: 'Failed to create try-on' });
  }
});

// Get user's try-on history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const tryOns = await TryOn.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('personImage garmentImage resultImage garmentDescription tags createdAt likeCount views');

    const total = await TryOn.countDocuments({ userId });

    res.json({
      tryOns,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch try-on history' });
  }
});

// Get specific try-on
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const tryOnId = req.params.id;
    const userId = req.user?._id;

    const tryOnRecord = await TryOn.findById(tryOnId)
      .populate('userId', 'username')
      .populate('likes', 'username');

    if (!tryOnRecord) {
      return res.status(404).json({ message: 'Try-on not found' });
    }

    // Check if user can view this try-on
    if (!tryOnRecord.isPublic && tryOnRecord.userId._id.toString() !== userId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Increment view count
    await TryOn.findByIdAndUpdate(tryOnId, { $inc: { views: 1 } });

    res.json({
      tryOn: {
        id: tryOnRecord._id,
        personImage: tryOnRecord.personImage,
        garmentImage: tryOnRecord.garmentImage,
        resultImage: tryOnRecord.resultImage,
        garmentDescription: tryOnRecord.garmentDescription,
        tags: tryOnRecord.tags,
        isPublic: tryOnRecord.isPublic,
        likeCount: tryOnRecord.likeCount,
        views: tryOnRecord.views + 1,
        createdAt: tryOnRecord.createdAt,
        user: {
          id: tryOnRecord.userId._id,
          username: tryOnRecord.userId.username
        },
        isLiked: userId ? tryOnRecord.likes.some(like => like._id.toString() === userId.toString()) : false
      }
    });

  } catch (error) {
    console.error('Try-on fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch try-on' });
  }
});

// Update try-on (description, tags, visibility)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const tryOnId = req.params.id;
    const userId = req.user._id;
    const { garmentDescription, tags, isPublic } = req.body;

    const tryOnRecord = await TryOn.findById(tryOnId);

    if (!tryOnRecord) {
      return res.status(404).json({ message: 'Try-on not found' });
    }

    if (tryOnRecord.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = {};
    if (garmentDescription !== undefined) updateData.garmentDescription = garmentDescription;
    if (tags !== undefined) updateData.tags = tags;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const updatedTryOn = await TryOn.findByIdAndUpdate(
      tryOnId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Try-on updated successfully',
      tryOn: {
        id: updatedTryOn._id,
        garmentDescription: updatedTryOn.garmentDescription,
        tags: updatedTryOn.tags,
        isPublic: updatedTryOn.isPublic
      }
    });

  } catch (error) {
    console.error('Try-on update error:', error);
    res.status(500).json({ message: 'Failed to update try-on' });
  }
});

// Delete try-on
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const tryOnId = req.params.id;
    const userId = req.user._id;

    const tryOnRecord = await TryOn.findById(tryOnId);

    if (!tryOnRecord) {
      return res.status(404).json({ message: 'Try-on not found' });
    }

    if (tryOnRecord.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove from user's history and favorites
    await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          tryOnHistory: tryOnId,
          favorites: tryOnId
        }
      }
    );

    await TryOn.findByIdAndDelete(tryOnId);

    res.json({ message: 'Try-on deleted successfully' });

  } catch (error) {
    console.error('Try-on deletion error:', error);
    res.status(500).json({ message: 'Failed to delete try-on' });
  }
});

// Like/Unlike try-on
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const tryOnId = req.params.id;
    const userId = req.user._id;

    const tryOnRecord = await TryOn.findById(tryOnId);

    if (!tryOnRecord) {
      return res.status(404).json({ message: 'Try-on not found' });
    }

    const isLiked = tryOnRecord.likes.includes(userId);

    if (isLiked) {
      // Unlike
      await TryOn.findByIdAndUpdate(tryOnId, { $pull: { likes: userId } });
      res.json({ message: 'Try-on unliked', liked: false });
    } else {
      // Like
      await TryOn.findByIdAndUpdate(tryOnId, { $addToSet: { likes: userId } });
      res.json({ message: 'Try-on liked', liked: true });
    }

  } catch (error) {
    console.error('Like/unlike error:', error);
    res.status(500).json({ message: 'Failed to like/unlike try-on' });
  }
});

// Get public try-ons (for discovery)
router.get('/public/feed', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const tryOns = await TryOn.find({ isPublic: true })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('personImage garmentImage resultImage garmentDescription tags createdAt likeCount views');

    const total = await TryOn.countDocuments({ isPublic: true });

    res.json({
      tryOns: tryOns.map(tryOn => ({
        id: tryOn._id,
        personImage: tryOn.personImage,
        garmentImage: tryOn.garmentImage,
        resultImage: tryOn.resultImage,
        garmentDescription: tryOn.garmentDescription,
        tags: tryOn.tags,
        likeCount: tryOn.likeCount,
        views: tryOn.views,
        createdAt: tryOn.createdAt,
        user: {
          id: tryOn.userId._id,
          username: tryOn.userId.username
        }
      })),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Public feed error:', error);
    res.status(500).json({ message: 'Failed to fetch public try-ons' });
  }
});

module.exports = router;
