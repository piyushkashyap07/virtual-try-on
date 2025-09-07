const mongoose = require('mongoose');

const tryOnSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  personImage: {
    type: String,
    required: true
  },
  garmentImage: {
    type: String,
    required: true
  },
  resultImage: {
    type: String,
    required: true
  },
  multiAngleResults: {
    front: {
      type: String,
      default: null
    },
    back: {
      type: String,
      default: null
    },
    side: {
      type: String,
      default: null
    }
  },
  garmentDescription: {
    type: String,
    default: ''
  },
  imageSource: {
    type: String,
    enum: ['uploaded', 'reference'],
    default: 'uploaded'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
tryOnSchema.index({ userId: 1, createdAt: -1 });
tryOnSchema.index({ isPublic: 1, createdAt: -1 });

// Virtual for like count
tryOnSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Ensure virtual fields are serialized
tryOnSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('TryOn', tryOnSchema);
