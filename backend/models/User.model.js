const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    phoneSuffix: {
      type: String,
      lowercase: true,
      validate: {
        validator: function (value) {
          return /^\+\d+$/.test(value);
        },
        message: 'Invalid email address format',
      },
    },
    username: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true
    },
    emailOtp: {
      type: String,
    },
    emailOtpExpiry: {
      type: Date,
    },
    profilePicture: {
      type: String,
    },
    about: {
      type: String,
    },
    lastSeen: {
      type: Date,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    agreed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const User = mongoose.model('User', UserSchema);
module.exports = User;