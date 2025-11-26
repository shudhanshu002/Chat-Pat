const express = require('express');
const { sendOtp, verifyOtp, updateProfile, logout, checkAuthenticate, getAllUsers } = require('../controllers/auth.controllers');
const { authMiddleware } = require('../middleware/authMiddleware');
const { multerMiddleware } = require('../config/cloudinaryConfig');

const router = express.Router();

router.post('/send-otp',sendOtp);
router.post('/verify-otp',verifyOtp)

router.put('/update-profile',authMiddleware,multerMiddleware,updateProfile)
router.get('/logout',logout);
router.get('/check-auth',authMiddleware,checkAuthenticate)
router.get('/users', authMiddleware,getAllUsers )

module.exports = router