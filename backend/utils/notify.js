const Notification = require('../models/Notification');
const socketManager = require('./socketManager');

/**
 * Creates a notification in the DB and attempts to push it via WebSockets if the user is online.
 * 
 * @param {String|ObjectId} userId - Recipient User ID
 * @param {String} role - Recipient Role ('customer', 'manager', 'admin')
 * @param {String} type - Category ('booking', 'payment', 'hotel', 'system', 'offer')
 * @param {String} message - The alert text
 * @param {String|ObjectId|null} relatedId - Optional reference (e.g. Booking ID)
 */
const sendNotification = async (userId, role, type, message, relatedId = null) => {
    try {
        const newNotif = new Notification({
            user: userId,
            role,
            type,
            message,
            relatedId
        });
        await newNotif.save();

        // Dispatch real-time event
        socketManager.sendNotificationToUser(userId, newNotif);
    } catch (error) {
        console.error('Core Notification Error (DB/Socket):', error);
    }
};

module.exports = sendNotification;
