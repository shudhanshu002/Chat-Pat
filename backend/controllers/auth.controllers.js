const otpGenerate = require('../utils/otpGenerator.utils');
const response = require('../utils/responseHandler.utils');
const sendOtpToEmail = require('../services/emailService');
const tiwilloService = require('../services/twilloService');
const generateToken = require('../utils/generateToken.util');
const User = require('../models/User.model');
const { uploadFileToCloudinary } = require('../config/cloudinaryConfig');
const Conversation = require('../models/Conversation.model');

const sendOtp = async (req, res) => {
  // opt verification using phone or email
  const { phoneNumber, phoneSuffix, email } = req.body;
  const otp = otpGenerate();
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // otp expire after 5 min
  let user = null;

  try {
    // with email
    if (email) {
      user = await User.findOne({ email });
      if (!user) {
        user = new User({ email });
      }

      user.emailOtp = otp;
      user.emailOtpExpiry = expiry;
      await user.save();
      await sendOtpToEmail(email, otp);
      return response(res, 200, 'OTP send to your email:- ', { email });
    }

    //with phoneNumber
    if (!phoneNumber || !phoneSuffix) {
      return response(res, 400, 'phone number and suffix required');
    }

    const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
    user = await User.findOne({ phoneNumber });
    if (!user) {
      user = await new User({ phoneNumber, phoneSuffix });
    }
    await tiwilloService.sendOtpToPhoneNumber(fullPhoneNumber);
    await user.save();
    return response(res, 200, 'OTP send succesfully', user);
  } catch (error) {
    console.error('Error in sendOtp controller:', error);
    return response(res, 500, `send_otp_error:: ${error.message || 'Internal server error'}`);
  }
};

// verify otp
const verifyOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email, otp } = req.body;

  try {
    let user=null;

    //otp-verification-with-eamil
    if (email) {
      user = await User.findOne({ email });
      if (!user) {
        return response(res, 404, 'USER not found');
      }

      const now = new Date();
      if (
        !user.emailOtp ||
        String(user.emailOtp) !== String(otp) ||
        now > new Date(user.emailOtpExpiry)
      ) {
        return response(res, 400, 'Invalid or Expired OTP');
      }
      user.isVerified = true;
      user.emailOtp = null;
      user.emailOtpExpiry = null;
      await user.save();
    } else {
      if (!phoneNumber || !phoneSuffix) {
        return response(res, 400, 'Phone_number and Suffix are required');
      }

      const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
      user = await User.findOne({ phoneNumber });
      if (!user) {
        return response(res, 400, 'USER not found');
      }
      let result;
      try {
        result = await tiwilloService.verifyOtp(fullPhoneNumber, otp);
      } catch (err) {
        console.error('Twilio verifyOtp error: ', err);
        return response(res, 500, 'Error verifying OTP with Twilio');
      }
      if (result.status !== 'approved') {
        return response(res, 400, 'Invalid OTP');
      }
      user.isVerified = true;

      await user.save();
    }


    // cookie set
    const token = generateToken(user?._id);
    res.cookie('auth_token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    return response(res, 200, 'OTP verified successfully', { token, user });
  } catch (error) {
    console.error(error);
    return response(res, 500, 'verify_otp_error:: || Internal server error');
  }
};

const updateProfile = async (req, res) => {
  const { username, agreed, about } = req.body;
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);
    const file = req.file;
    if (file) {
      const uploadResult = await uploadFileToCloudinary(file);
      user.profilePicture = uploadResult?.secure_url;
    } else if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture;
    }

    if (username) user.username = username;
    if (agreed) user.agreed = agreed;
    if (about) user.about = about;
    await user.save();

    return response(res, 200, 'USER profile updated successfully', user);
  } catch (error) {
    console.error(error);
    return response(res, 500, 'UPDATE_PROFILE_ERROR:: || Internal server error');
  }
};

const checkAuthenticate = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return response(res, 404, 'Unauthorized');
    }
    const user = await User.findById(userId);
    if (!user) {
      return response(res, 404, 'USER not found');
    }

    return response(res, 200, 'user retrieved allowed to surf__', user);
  } catch (error) {
    console.error(error);
    return response(res, 500, 'AUTHENTICATION_ERROR:: || Internal server error');
  }
};

const logout = (_, res) => {
  try {
    res.cookie('auth_token', '', { expires: new Date(0) });
    return response(res, 200, 'user logged-out successfully');
  } catch (error) {
    console.error(error);
    return response(res, 500, 'LOGOUT_ERROR:: || Internal server error');
  }
};

const getAllUsers = async (req, res) => {
  const loggedInUser = req.user.userId;
  
  try {
    const users = await User.find({ _id: { $ne: loggedInUser } })
      .select(
        'username profilePicture lastSeen isOnline about phoneNumber phoneSuffix',
      )
      .lean();

    const usersWithConversation = await Promise.all(
      users.map(async (user) => {
        const conversation = await Conversation.findOne({
          participants: { $all: [loggedInUser, user?._id] },
        })
          .populate({
            path: 'lastMessage',
            select: 'content createdAt sender receiver',
          })
          .lean();

        return {
          ...user,
          conversation: conversation || null,
        };
      }),
    );
    return response(
      res,
      200,
      'users retrieved successfully',
      usersWithConversation,
    );
  } catch (error) {
    console.error(error);
    return response(res, 500, 'GET_ALL_USERS:: || Internal server error');
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  updateProfile,
  logout,
  checkAuthenticate,
  getAllUsers,
};
