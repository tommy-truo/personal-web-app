import * as BookingModel from '../models/booking-model.js';

// GET /api/bookings/passenger/:ownerID
export const getPassengerBookings = async (req, res) => {
    try {
        const { ownerID } = req.params;
        if (!ownerID) {
            return res.status(400).json({ error: "Passenger owner ID is required." });
        }

        const bookings = await BookingModel.getPassengerBookings(ownerID);
        res.status(200).json(bookings);
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve bookings." });
    }
};

// POST /api/bookings
export const createPendingBooking = async (req, res) => {
    try {
        const bookingID = await BookingModel.createPendingBooking(req.body);
        
        res.status(201).json({ 
            message: "Booking created successfully.", 
            bookingID 
        });
    } catch (err) {
        // Specific error handling for seat availability
        if (err.message === "Seat is no longer available.") {
            return res.status(409).json({ error: err.message });
        }
        res.status(500).json({ error: err.message || "Failed to create booking." });
    }
};

// POST /api/bookings/:bookingID/tickets
export const addTicketsToBooking = async (req, res) => {
    try {
        const { bookingID } = req.params;
        const { tickets } = req.body;

        const ticketIDs = await BookingModel.addTickets({ bookingID, tickets });
        
        res.status(200).json({ 
            message: "Tickets added to booking.", 
            ticketIDs 
        });
    } catch (err) {
        if (err.message === "Seat is no longer available.") {
            return res.status(409).json({ error: err.message });
        }
        res.status(500).json({ error: err.message || "Failed to add tickets." });
    }
};

// PATCH /api/tickets/:ticketID/check-in
export const checkInTicket = async (req, res) => {
    try {
        const { ticketID } = req.params;
        const affectedRows = await BookingModel.checkInTicket(ticketID);

        if (affectedRows === 0) {
            return res.status(404).json({ error: "Ticket not found." });
        }

        res.status(200).json({ message: "Check-in successful." });
    } catch (err) {
        res.status(500).json({ error: "Failed to process check-in." });
    }
}

// DELETE /api/tickets/:ticketID
export const deleteTicket = async (req, res) => {
    try {
        const { ticketID } = req.params;
        const affectedRows = await BookingModel.deleteTicket(ticketID);

        if (affectedRows === 0) {
            return res.status(404).json({ error: "Ticket not found." });
        }

        res.status(200).json({ message: "Ticket deleted and seat released." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete ticket." });
    }
};

// DELETE /api/bookings/:bookingID
export const cancelBooking = async (req, res) => {
    try {
        const { bookingID } = req.params;
        const ticketsRemoved = await BookingModel.cancelBooking(bookingID);

        res.status(200).json({ 
            message: "Booking cancelled and seats released.", 
            count: ticketsRemoved 
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to cancel booking." });
    }
};