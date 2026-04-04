const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
    {
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            required: true, 
            ref: 'User' 
        },
        role: { 
            type: String, 
            required: true, 
            enum: ['customer', 'manager', 'admin'] 
        },
        type: { 
            type: String, 
            required: true, 
            enum: ['booking', 'hotel', 'offer', 'payment', 'system'] 
        },
        title: { 
            type: String, 
            required: true 
        },
        message: { 
            type: String, 
            required: true 
        },
        isRead: { 
            type: Boolean, 
            required: true, 
            default: false 
        },
        relatedId: { 
            type: mongoose.Schema.Types.ObjectId, 
            default: null // e.g., Booking ID or Hotel ID if we decide to link them
        }
    },
    { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
