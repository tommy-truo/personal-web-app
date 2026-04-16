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

// GET /api/bookings/:bookingID/checkout
export const getCheckoutInfo = async (req, res) => {
    try {
        const { bookingID } = req.params;
        if (!bookingID) {
            return res.status(400).json({ error: "Booking ID is required. "});
        }

        const info = await BookingModel.getCheckoutInfo(bookingID);
        if (!info) {
            throw new Error("Failed to retrieve booking information for checkout. ");
        }
        res.status(200).json(info);
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve booking information for checkout. "});
    }
}

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

// PATCH /api/bookings/:bookingID/confirm
export const confirmBooking = async (req, res) => {
    try {
        const { bookingID } = req.params;
        if (!bookingID) {
            return res.status(400).json({ error: "Booking ID is required." });
        }

        await BookingModel.confirmBooking(bookingID);

        res.status(200).json({ mesage: "Booking confirmation successful." });
    } catch (err) {
        res.status(500).json({ error: "Failed to update booking status." });
    }
}

// PATCH /api/bookings/:bookingID/expire
export const expireBooking = async (req, res) => {
    try {
        const { bookingID } = req.params;
        if (!bookingID) {
            return res.status(400).json({ error: "Booking ID is required." });
        }

        await BookingModel.expireBooking(bookingID);

        res.status(200).json({ mesage: "Booking expiration successful." });
    } catch (err) {
        res.status(500).json({ error: "Failed to update booking status." });
    }
}

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

// DELETE /api/bookings/:bookingID/tickets/:ticketID
export const deleteTicket = async (req, res) => {
    try {
        const { bookingID, ticketID } = req.params;
        const affectedRows = await BookingModel.deleteTicket(bookingID, ticketID);

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
        await BookingModel.cancelBooking(bookingID);

        res.status(200).json({ 
            message: "Booking cancelled and seats released."
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to cancel booking." });
    }
};

// POST /api/bookings/transaction
export const createTransaction = async (req, res) => {
    try {
        const { bookingID, paymentMethod, transactionType, amount } = req.body;
        await BookingModel.createTransaction(bookingID, paymentMethod, transactionType, amount);

        res.status(201).json({ 
            message: "Transaction created successfully."
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to create transaction." });
    }
}