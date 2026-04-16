import { Router } from 'express';
import * as BookingController from '../controllers/booking-controller.js';

const router = Router();

// --- Booking Management ---

// POST /api/bookings - Create a new booking with tickets
router.post('/', BookingController.createPendingBooking);

// GET /api/bookings/passenger/:ownerID - Get all bookings for a specific passenger owner
router.get('/passenger/:ownerID', BookingController.getPassengerBookings);

router.get('/:bookingID/checkout', BookingController.getCheckoutInfo);

// PATCH /api/bookings/:bookingID/confirm - Set booking status to 'Confirmed'
router.patch('/:bookingID/confirm', BookingController.confirmBooking);

// PATCH /api/bookings/:bookingID/confirm - Set booking status to 'Expired'
router.patch('/:bookingID/expire', BookingController.expireBooking);

// DELETE /api/bookings/:bookingID - Cancel an entire booking and release seats
router.delete('/:bookingID', BookingController.cancelBooking);

// --- Ticket Management ---

// PATCH /api/tickets/:ticketID/check-in - Check in a specific ticket
router.patch('/tickets/:ticketID/check-in', BookingController.checkInTicket);

// DELETE /api/tickets/:ticketID - Delete a single ticket and release the seat
router.delete('/:bookingID/tickets/:ticketID', BookingController.deleteTicket);

// --- Transaction Management ---

// POST /api/bookings/transaction
router.post('/transaction', BookingController.createTransaction);

export default router;