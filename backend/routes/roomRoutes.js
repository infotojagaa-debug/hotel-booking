const express = require('express');
const router = express.Router();
const { getRooms, getRoomById, createRoom, updateRoom, deleteRoom } = require('../controllers/roomController');
const { protect, authorize } = require('../middleware/authMiddleware');
 
router.route('/').get(getRooms).post(protect, authorize('Admin', 'Hotel Manager'), createRoom);
router.route('/:id').get(getRoomById).put(protect, authorize('Admin', 'Hotel Manager'), updateRoom).delete(protect, authorize('Admin', 'Hotel Manager'), deleteRoom);

module.exports = router;
