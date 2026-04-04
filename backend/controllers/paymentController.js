const Room = require('../models/Room');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');

// @desc    Create Stripe checkout session
// @route   POST /api/payments/create-checkout-session
// @access  Private
const createCheckoutSession = async (req, res) => {
    try {
        const { roomId, checkInDate, checkOutDate } = req.body;
        
        const room = await Room.findById(roomId).populate('hotel');
        if (!room) return res.status(404).json({ message: 'Room not found' });

        // Phase 9: Security Check - Only approved hotels can take bookings
        if (!room.hotel.isApproved) {
            return res.status(403).json({ message: 'Hotel is currently not taking bookings (Pending Approval)' });
        }

        const start = new Date(checkInDate);
        const end = new Date(checkOutDate);
        const nights = (end - start) / (1000 * 60 * 60 * 24);
        if (nights <= 0) return res.status(400).json({ message: 'Invalid dates' });

        // ... (Availability check code unchanged) ...
        const requestedDates = [];
        let current = new Date(start);
        while (current <= end) {
            requestedDates.push(new Date(current).getTime());
            current.setDate(current.getDate() + 1);
        }

        const isUnavailable = room.roomNumbers.some(rn => 
            rn.unavailableDates.some(ud => requestedDates.includes(new Date(ud).getTime()))
        );

        if (isUnavailable) {
            return res.status(400).json({ message: 'Room is already booked for these dates' });
        }

        // Phase 9: Financial Splitting Logic
        const totalAmount = nights * room.pricePerNight;
        const commissionRate = room.hotel.commissionPercentage || 10;
        const platformFee = (totalAmount * commissionRate) / 100;
        const managerEarnings = totalAmount - platformFee;

        // --- DEVELOPMENT MOCK FALLBACK ---
        const rawKey = String(process.env.STRIPE_SECRET_KEY || '').toLowerCase();
        const isMockKey = !rawKey || 
                         rawKey.includes('your_') || 
                         rawKey.includes('placeholder') ||
                         rawKey.length < 10; // Real keys are longer

        console.log('--- Payment Debug ---');
        console.log('Stripe Key Length:', rawKey.length);
        console.log('Is Mock Key?:', isMockKey);

        if (isMockKey) {
            console.warn('⚠️ STRIPE_SECRET_KEY is a placeholder or missing. Using Development Mock Payment.');
            
            try {
                // 1. Create the booking immediately (since no webhook will trigger)
                const mockBooking = new Booking({
                    user: req.user._id,
                    room: roomId,
                    checkInDate: start,
                    checkOutDate: end,
                    totalPrice: totalAmount,
                    platformFee: platformFee,
                    managerEarnings: managerEarnings,
                    paymentStatus: 'Paid',
                    status: 'Confirmed',
                    paymentId: 'mock_' + Date.now()
                });
                await mockBooking.save();
                console.log('Mock Booking Created successfully:', mockBooking._id);

                // 2. Update room availability
                const dates = [];
                let current = new Date(start);
                while (current <= end) {
                    dates.push(new Date(current));
                    current.setDate(current.getDate() + 1);
                }
                
                // Safe room update
                if (room.roomNumbers && room.roomNumbers.length > 0) {
                    await Room.updateOne(
                        { _id: roomId, "roomNumbers.0": { $exists: true } },
                        { $push: { "roomNumbers.0.unavailableDates": { $each: dates } } }
                    );
                }

                // 3. Conditional Confirmation (Email for Google, Notification for Normal)
                const user = await User.findById(req.user._id);
                if (user.authType === 'google') {
                    sendEmail({
                        email: user.email,
                        subject: `Booking Confirmed [DEMO]: ${room.hotel?.name || 'Elite Stay'}`,
                        message: `This is a mock booking for ${room.name}. Total: ₹${totalAmount}`
                    }).catch(e => console.error('Mock Email Error:', e.message));
                } else {
                    await Notification.create({
                        user: user._id,
                        role: 'customer',
                        type: 'booking',
                        title: 'Payment Successful',
                        message: `Your booking at ${room.hotel?.name || 'Hotel'} is confirmed.`,
                        relatedId: mockBooking._id
                    });
                }

                // 4. Return the success URL
                return res.json({ 
                    id: mockBooking.paymentId, 
                    url: `${process.env.FRONTEND_URL}/success?session_id=${mockBooking.paymentId}` 
                });
            } catch (mockErr) {
                console.error('Mock Booking Logic Error:', mockErr);
                return res.status(500).json({ message: 'Internal error during mock booking' });
            }
        }
        // --- END MOCK FALLBACK ---

        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${room.hotel.name} - ${room.name}`,
                        description: `Stay from ${checkInDate} to ${checkOutDate}`,
                        images: room.images.length > 0 ? [`${process.env.FRONTEND_URL}${room.images[0]}`] : [],
                    },
                    unit_amount: Math.round(totalAmount * 100), // Stripe expects cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/rooms/${roomId}`,
            metadata: {
                userId: req.user._id.toString(),
                roomId,
                checkInDate,
                checkOutDate,
                totalPrice: totalAmount.toString(),
                platformFee: platformFee.toString(),
                managerEarnings: managerEarnings.toString()
            }
        });

        res.json({ id: session.id, url: session.url });
    } catch (err) {
        console.error('Stripe Error:', err);
        res.status(500).json({ message: err.message });
    }
};

const handleWebhook = async (req, res) => {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Create booking
        try {
            const booking = new Booking({
                user: session.metadata.userId,
                room: session.metadata.roomId,
                checkInDate: new Date(session.metadata.checkInDate),
                checkOutDate: new Date(session.metadata.checkOutDate),
                totalPrice: Number(session.metadata.totalPrice),
                platformFee: Number(session.metadata.platformFee || 0),
                managerEarnings: Number(session.metadata.managerEarnings || 0),
                paymentStatus: 'Paid',
                status: 'Confirmed',
                paymentId: session.id
            });
            await booking.save();

            // Conditional Confirmation (Email for Google, Notification for Normal)
            try {
                const user = await User.findById(session.metadata.userId);
                const room = await Room.findById(session.metadata.roomId).populate('hotel');
                
                if (user.authType === 'google') {
                    const message = `Your booking at ${room.hotel.name} is confirmed! \n\n Room: ${room.name} \n Total: ₹${session.metadata.totalPrice} \n Check-in: ${session.metadata.checkInDate}`;
                    const html = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5;">
                            <div style="background-color: #6d5dfc; padding: 20px; color: #fff; text-align: center;">
                                <h1 style="margin: 0;">Elite Stays</h1>
                            </div>
                            <div style="padding: 30px;">
                                <h2 style="color: #1a1a1a;">Booking Confirmed!</h2>
                                <p>Hi ${user.name}, your stay at <strong>${room.hotel.name}</strong> is all set.</p>
                                <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;" />
                                <table style="width: 100%;">
                                    <tr><td><strong>Room</strong></td><td>${room.name} (${room.type})</td></tr>
                                    <tr><td><strong>Check-in</strong></td><td>${new Date(session.metadata.checkInDate).toLocaleDateString()}</td></tr>
                                    <tr><td><strong>Check-out</strong></td><td>${new Date(session.metadata.checkOutDate).toLocaleDateString()}</td></tr>
                                    <tr><td><strong>Total Paid</strong></td><td style="color: #10b981; font-weight: bold;">₹${session.metadata.totalPrice}</td></tr>
                                </table>
                                <p style="margin-top: 30px; font-size: 0.9rem; color: #666;">
                                    Need to manage your booking? Head over to your <a href="${process.env.FRONTEND_URL}/dashboard" style="color: #6d5dfc;">Customer Dashboard</a>.
                                </p>
                            </div>
                        </div>
                    `;

                    await sendEmail({
                        email: user.email,
                        subject: `Booking Confirmed: ${room.hotel.name}`,
                        message,
                        html
                    });
                } else {
                    // Send In-App Notification for Normal users
                    await Notification.create({
                        user: user._id,
                        role: 'customer',
                        type: 'booking',
                        title: 'Payment Successful',
                        message: `Your booking at ${room.hotel?.name || 'Hotel'} is confirmed.`,
                        relatedId: booking._id
                    });
                }
            } catch (confirmationErr) {
                console.error('Confirmation Error:', confirmationErr.message);
            }

            // Update room availability (mark dates as unavailable)
            const room = await Room.findById(session.metadata.roomId);
            const start = new Date(session.metadata.checkInDate);
            const end = new Date(session.metadata.checkOutDate);
            
            const dates = [];
            let current = new Date(start);
            while (current <= end) {
                dates.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }

            // We push to the first room number for simplicity in this demo
            await Room.updateOne(
                { _id: session.metadata.roomId, "roomNumbers.0": { $exists: true } },
                { $push: { "roomNumbers.0.unavailableDates": { $each: dates } } }
            );

            console.log('Booking confirmed via webhook:', booking._id);
        } catch (err) {
            console.error('Webhook processing failed:', err);
        }
    }

    res.json({ received: true });
};

module.exports = { createCheckoutSession, handleWebhook };
