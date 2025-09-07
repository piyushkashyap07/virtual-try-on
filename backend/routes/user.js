const express = require('express');
const User = require('../models/User');
const TryOn = require('../models/TryOn');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Add try-on to favorites
router.post('/favorites/:tryOnId', authenticateToken, async (req, res) => {
  try {
    const { tryOnId } = req.params;
    const userId = req.user._id;

    // Check if try-on exists and belongs to user
    const tryOnRecord = await TryOn.findById(tryOnId);
    if (!tryOnRecord) {
      return res.status(404).json({ message: 'Try-on not found' });
    }

    if (tryOnRecord.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add to favorites
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { favorites: tryOnId } },
      { new: true }
    ).populate('favorites', 'personImage garmentImage resultImage createdAt');

    res.json({
      message: 'Added to favorites',
      favorites: user.favorites
    });

  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ message: 'Failed to add to favorites' });
  }
});

// Remove try-on from favorites
router.delete('/favorites/:tryOnId', authenticateToken, async (req, res) => {
  try {
    const { tryOnId } = req.params;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { favorites: tryOnId } },
      { new: true }
    ).populate('favorites', 'personImage garmentImage resultImage createdAt');

    res.json({
      message: 'Removed from favorites',
      favorites: user.favorites
    });

  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ message: 'Failed to remove from favorites' });
  }
});

// Get user's favorites
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId)
      .populate({
        path: 'favorites',
        options: {
          sort: { createdAt: -1 },
          skip: skip,
          limit: limit
        },
        select: 'personImage garmentImage resultImage garmentDescription tags createdAt likeCount views'
      });

    const total = user.favorites.length;

    res.json({
      favorites: user.favorites,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Failed to fetch favorites' });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Promise.all([
      TryOn.countDocuments({ userId }),
      TryOn.countDocuments({ userId, isPublic: true }),
      TryOn.aggregate([
        { $match: { userId: userId } },
        { $group: { _id: null, totalViews: { $sum: '$views' }, totalLikes: { $sum: { $size: '$likes' } } } }
      ])
    ]);

    const [totalTryOns, publicTryOns, aggregatedStats] = stats;
    const { totalViews = 0, totalLikes = 0 } = aggregatedStats[0] || {};

    res.json({
      stats: {
        totalTryOns,
        publicTryOns,
        privateTryOns: totalTryOns - publicTryOns,
        totalViews,
        totalLikes,
        averageViewsPerTryOn: totalTryOns > 0 ? Math.round(totalViews / totalTryOns) : 0
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch user statistics' });
  }
});

// Search user's try-ons
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { q, tags, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { userId };

    // Text search
    if (q) {
      query.$or = [
        { garmentDescription: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // Tag filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    const tryOns = await TryOn.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('personImage garmentImage resultImage garmentDescription tags createdAt likeCount views');

    const total = await TryOn.countDocuments(query);

    res.json({
      tryOns,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Failed to search try-ons' });
  }
});

// Get user's public profile (for other users to view)
router.get('/public/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ username, isActive: true })
      .select('username createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const publicTryOns = await TryOn.find({ 
      userId: user._id, 
      isPublic: true 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('personImage garmentImage resultImage garmentDescription tags createdAt likeCount views');

    const totalPublicTryOns = await TryOn.countDocuments({ 
      userId: user._id, 
      isPublic: true 
    });

    res.json({
      user: {
        id: user._id,
        username: user.username,
        memberSince: user.createdAt
      },
      publicTryOns,
      pagination: {
        current: page,
        pages: Math.ceil(totalPublicTryOns / limit),
        total: totalPublicTryOns,
        hasNext: page < Math.ceil(totalPublicTryOns / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Public profile error:', error);
    res.status(500).json({ message: 'Failed to fetch public profile' });
  }
});

module.exports = router;
