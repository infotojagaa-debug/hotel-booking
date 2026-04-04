const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Get all notifications or clear all
router.route('/')
    .get(protect, getNotifications)
    .delete(protect, clearAll);

// Mark all as read
router.route('/read-all')
    .patch(protect, markAllAsRead);

// Manage specific notification
router.route('/:id/read')
    .patch(protect, markAsRead);

router.route('/:id')
    .delete(protect, deleteNotification);

module.exports = router;
