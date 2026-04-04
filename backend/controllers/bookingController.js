const Booking = require('../models/Booking');
const Room = require('../models/Room');
const sendEmail = require('../utils/sendEmail');
const generateInvoicePDF = require('../utils/invoiceGenerator');
const sendNotification = require('../utils/notify');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
    // 1. Log request body for developer debugging
    console.log('Incoming Booking Request:', JSON.stringify(req.body, null, 2));

    const { 
        roomId, 
        checkInDate, 
        checkOutDate, 
        totalPrice = 0, 
        platformFee = 0,
        managerEarnings = 0,
        paymentMethod = 'Card',
        paymentId = 'MOCK-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    } = req.body;

    // 2. Validate essential fields (be more permissive on price)
    if (!roomId || !checkInDate || !checkOutDate) {
        return res.status(400).json({ 
            message: 'Missing essential booking details. Please ensure your dates and room are selected correctly.' 
        });
    }

    try {
        // Enforce valid date objects
        const start = new Date(checkInDate);
        const end = new Date(checkOutDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid check-in or check-out date format' });
        }

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: `Room with ID ${roomId} could not be found. It may have been removed or updated.` });
        }

        const confirmedBookings = await Booking.find({
            room: roomId,
            status: 'Confirmed',
            $or: [
                { checkInDate: { $lt: end }, checkOutDate: { $gt: start } }
            ]
        });

        const totalAvailable = room.totalRoomCount || room.totalRooms || 1;
        if (confirmedBookings.length >= totalAvailable) {
            return res.status(400).json({ message: 'Apologies, this room was just booked by another guest for these dates.' });
        }

        // Map frontend payment method strings to backend enum
        const methodMap = {
            'upi': 'UPI',
            'card': 'Card',
            'netbanking': 'Netbanking',
            'wallet': 'Wallet',
            'pay_at_hotel': 'Pay at Hotel'
        };

        const booking = new Booking({
            user: req.user._id,
            room: roomId,
            checkInDate: start,
            checkOutDate: end,
            totalPrice: totalPrice || room.pricePerNight || 0,
            platformFee: platformFee || (totalPrice * 0.05) || 0,
            managerEarnings: managerEarnings || (totalPrice * 0.8) || 0,
            status: 'Confirmed',
            paymentMethod: methodMap[paymentMethod] || 'Card',
            paymentStatus: paymentMethod === 'pay_at_hotel' ? 'Unpaid' : 'Paid',
            paymentId: paymentMethod === 'pay_at_hotel' ? 'At Hotel' : paymentId
        });

        const createdBooking = await booking.save();

        // 3. Populate Booking details for the Premium Invoice & Notifications
        const populatedBooking = await Booking.findById(createdBooking._id)
            .populate({
                path: 'room',
                populate: { path: 'hotel' }
            })
            .populate('user');

        // ---> NOTIFICATION TRIGGERS <---
        // 1. Notify Customer
        await sendNotification(
            req.user._id, 
            'customer', 
            'booking', 
            `Booking Confirmed! You're staying at ${populatedBooking.room.hotel?.name || 'an Elite Stay'} from ${start.toLocaleDateString()}.`, 
            createdBooking._id
        );

        // 2. Notify Hotel Manager
        if (populatedBooking.room.hotel && populatedBooking.room.hotel.manager) {
            await sendNotification(
                populatedBooking.room.hotel.manager,
                'manager',
                'booking',
                `New Booking Received! ${req.user.name} booked ${populatedBooking.room.name}.`,
                createdBooking._id
            );
        }

        // 4. Send Confirmation Email with PDF Attachment
        try {
            // Generate the premium PDF buffer
            const pdfBuffer = generateInvoicePDF(populatedBooking);

            await sendEmail({
                email: req.user.email,
                subject: 'Booking Confirmation & Invoice - Elite Stays',
                message: `Payment Success! Your room booking is done.\n\nBooking ID: ${createdBooking._id}\nPlease find your luxury invoice attached.`,
                html: `
                    <div style="font-family: 'Helvetica', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                        <div style="background: linear-gradient(135deg, #6d5dfc 0%, #8b5cf6 100%); padding: 40px 20px; border-radius: 16px 16px 0 0; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">ELITE STAYS</h1>
                            <p style="color: rgba(255,255,255,0.8); margin-top: 10px; font-size: 14px;">CONFIRMATION # ${createdBooking._id.toString().toUpperCase()}</p>
                        </div>
                        
                        <div style="padding: 30px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px;">
                            <h2 style="color: #6d5dfc; margin-top: 0;">Payment Success & Booking Done!</h2>
                            <p>Hi ${req.user.name}, your luxury stay at <strong>${populatedBooking.room.hotel.name}</strong> has been successfully booked.</p>
                            
                            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 25px 0;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #64748b; font-size: 13px;">ROOM</td>
                                        <td style="padding: 8px 0; text-align: right; font-weight: bold;">${populatedBooking.room.name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #64748b; font-size: 13px;">CHECK-IN</td>
                                        <td style="padding: 8px 0; text-align: right; font-weight: bold;">${new Date(populatedBooking.checkInDate).toLocaleDateString()}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #64748b; font-size: 13px;">CHECK-OUT</td>
                                        <td style="padding: 8px 0; text-align: right; font-weight: bold;">${new Date(populatedBooking.checkOutDate).toLocaleDateString()}</td>
                                    </tr>
                                    <tr style="border-top: 1px solid #e2e8f0;">
                                        <td style="padding: 15px 0 0 0; font-weight: bold; color: #1e293b;">TOTAL PAID</td>
                                        <td style="padding: 15px 0 0 0; text-align: right; font-weight: bold; font-size: 18px; color: #10b981;">₹${populatedBooking.totalPrice?.toLocaleString()}</td>
                                    </tr>
                                </table>
                            </div>

                            <p style="text-align: center; margin: 30px 0;">
                                <a href="#" style="background: #6d5dfc; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Download Official Invoice</a>
                            </p>

                            <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 40px;">
                                Questions? Reply to this mail or contact us at support@elitestays.com.
                            </p>
                        </div>
                    </div>
                `,
                attachments: [
                    {
                        filename: `Invoice_${createdBooking._id}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            });
            console.log('Confirmation email with premium invoice sent to:', req.user.email);
        } catch (emailErr) {
            console.error('Email Sending Failed:', emailErr);
        }

        res.status(201).json(createdBooking);
    } catch (error) {
        console.error('SERVER SIDE BOOKING ERROR:', {
            errorMessage: error.message,
            stack: error.stack,
            fullRequest: req.body
        });
        res.status(500).json({ 
            message: 'A server error occurred while confirming your booking. We have logged this and are investigating. Please try again in a few moments.' 
        });
    }
};

// @desc    Get logged in user bookings
// @route   GET /api/bookings/mybookings
// @access  Private
const getMyBookings = async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate({
            path: 'room',
            select: 'name type images maxGuests hotel',
            populate: {
                path: 'hotel',
                select: 'name city address images'
            }
        });
    res.json(bookings);
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin
const getBookings = async (req, res) => {
    const bookings = await Booking.find({}).populate('user', 'id name').populate('room', 'id name');
    res.json(bookings);
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate({
                path: 'room',
                select: 'name type images maxGuests hotel',
                populate: {
                    path: 'hotel',
                    select: 'name city address images'
                }
            })
            .populate('user', 'name email');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Security check: only the user who booked it or an admin can see it
        if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(401).json({ message: 'Not authorized to view this booking' });
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching booking details' });
    }
};

// @desc    Download booking invoice PDF
// @route   GET /api/bookings/:id/invoice
// @access  Private
const downloadInvoice = async (req, res) => {
    try {
        console.log(`Invoice download request for ID: ${req.params.id} by User: ${req.user._id}`);
        
        const booking = await Booking.findById(req.params.id)
            .populate({
                path: 'room',
                populate: { path: 'hotel' }
            })
            .populate('user');

        if (!booking) {
            console.warn(`Booking not found: ${req.params.id}`);
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Security check
        if (booking.user?._id.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            console.warn(`Unauthorized invoice download attempt by User: ${req.user._id} for Booking: ${req.params.id}`);
            return res.status(401).json({ message: 'Not authorized' });
        }

        console.log('Generating PDF buffer...');
        const pdfBuffer = generateInvoicePDF(booking);

        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('Generated PDF buffer is empty');
        }

        console.log(`Sending PDF buffer of size: ${pdfBuffer.length} bytes`);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=Invoice_${booking._id}.pdf`,
            'Content-Length': pdfBuffer.length,
            'Cache-Control': 'no-cache'
        });

        res.send(pdfBuffer);
    } catch (error) {
        console.error('CRITICAL: Invoice Download Error:', error);
        res.status(500).json({ 
            message: 'Error generating invoice. Our team has been notified.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = { createBooking, getMyBookings, getBookings, getBookingById, downloadInvoice };
