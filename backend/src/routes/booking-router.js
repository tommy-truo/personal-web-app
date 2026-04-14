import { Router } from 'express';
import * as BookingController from '../controllers/booking-controller.js';

const router = Router();

// --- Booking Management ---

// POST /api/bookings - Create a new booking with tickets
router.post('/', BookingController.createPendingBooking);

// GET /api/bookings/passenger/:ownerID - Get all bookings for a specific passenger owner
router.get('/passenger/:ownerID', BookingController.getPassengerBookings);

// DELETE /api/bookings/:bookingID - Cancel an entire booking and release seats
router.delete('/:bookingID', BookingController.cancelBooking);

// --- Ticket Management ---

// POST /api/bookings/:bookingID/tickets - Add more tickets to an existing booking
router.post('/:bookingID/tickets', BookingController.addTicketsToBooking);

// PATCH /api/tickets/:ticketID/check-in - Check in a specific ticket
router.patch('/tickets/:ticketID/check-in', BookingController.checkInTicket);

// DELETE /api/tickets/:ticketID - Delete a single ticket and release the seat
router.delete('/tickets/:ticketID', BookingController.deleteTicket);

export default router;