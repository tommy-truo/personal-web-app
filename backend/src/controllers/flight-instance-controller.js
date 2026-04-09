import { searchFlights, getFlightSeats } from '../models/flight-instance-model.js';

// GET /api/flights/search?departureCity=(city)&arrivalCity=(city)&departureDate=(date)
export const findFlights = async (req, res) => {
    try {
        const { departureCity, arrivalCity, departureDate, passengersNumber } = req.query;

        // Basic validation before hitting the database
        if (!departureCity || !arrivalCity) {
            return res.status(400).json({ 
                message: "Both departureCity and arrivalCity query parameters are required." 
            });
        }
        if (!departureDate) { return res.status(400).json({message: "Date parameter is required."}); }

        if (!passengersNumber) { return res.status(400).json({message: "passengersNumber parameter is required."}); }
        if (isNaN(passengersNumber) || passengersNumber < 1) {
            return res.status(400).json({
                message: "passengersNumber must be a positive integer."
            });
        }

        const flights = await searchFlights({ departureCity, arrivalCity, departureDate, passengersNumber });

        res.status(200).json(flights);
    } catch (err) {
        console.error("Controller Error in findFlights:", err);
        res.status(500).json({ error: "Failed to search for flights." });
    }
};

export const fetchFlightSeats = async (req, res) => {
    try {
        const { flightInstanceId } = req.params;

        if (!flightInstanceId) {
            return res.status(400).json({ message: "Flight instance ID is required." });
        }

        const seats = await getFlightSeats(flightInstanceId);

        res.status(200).json(seats);
    } catch (err) {
        console.error("Controller Error in getFlightSeats:", err);
        res.status(500).json({ error: "Failed to retrieve flight seats." });
    }
};