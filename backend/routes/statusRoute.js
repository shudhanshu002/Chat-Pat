const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { multerMiddleware } = require('../config/cloudinaryConfig');
const { createStatus, getStatus, viewStatus, deleteStatus } = require('../controllers/status.controller')

const router = express.Router();

router.post('/',authMiddleware,multerMiddleware,createStatus);
router.get('/',authMiddleware,getStatus);

router.put('/:statusId/view',authMiddleware,viewStatus)

router.delete('/:statusId',authMiddleware,deleteStatus)

module.exports = router