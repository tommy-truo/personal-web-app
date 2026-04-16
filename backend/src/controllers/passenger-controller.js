// Written by Tommy Truong
import { handleControllerError } from '../utils/controller-error-handler.js';
import * as BookingModel from '../models/booking-model.js';
import * as PassengerModel from '../models/passenger-model.js';

/*      HTTP Status Codes
SUCCESS
200 - OK (GET,PUT,PATCH)
201 - Created (POST)
204 - No Content (DELETE)

CLIENT ERROR
400 - Bad Request
401 - Unauthorized (not logged in)
403 - Forbidden (logged in but not allowed)
404 - Not Found
409 - Conflict

SERVER ERROR
500 - Internal Server Error
*/


//      BASIC FORMAT
/*
export async function functionName(req, res) {
    try {
        // logic
    } catch (err) {
        console.error("Controller Error:", err);
        handleControllerError(res, err, "internal error message");
    }
}
*/


//      PASSENGER MODEL FUNCTIONS

// GET /users/:userID/passengers
// Gets all passengers linked to an account
export async function getPassengersByUser(req, res) {
    try {
        const userID = req.params.userID;

        if (!userID) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const passengers = await PassengerModel.getAllPassengersByAccount({
            accountID: userID
        });

        return res.status(200).json(passengers);
    } catch (err) {
        handleControllerError(res, err, "Controller Error in getPassengersByUser");
    }
}

export async function getPassengersByFlight(req, res) {
    try {
        const flightInstanceID = req.params.flightInstanceID;
        if (!flightInstanceID) {
            return res.status(400).json({ message: "Flight Instance ID is required" });
        }

        const ids = await PassengerModel.getPassengersByFlight(flightInstanceID);
        return res.status(200).json(ids);
    } catch (err) {
        handleControllerError(res, err, "Controller Error in getPassengersByFlight");
    }
}

// POST /users/:userID/passengers
// Creates and links new guest passenger to an account
export async function createAndLinkPassenger(req, res) {
    try {
        const userID = req.params.userID;
        const passengerData = req.body;

        if (!userID) {
            return res.status(400).json({ message: "User ID is required" });
        }

        // Create passenger
        const newpassengerID = await PassengerModel.createPassenger(passengerData);

        // Link passenger to account
        await PassengerModel.linkGuestToAccount({
            accountID: userID,
            passengerID: newpassengerID,
            relationship: passengerData.relationship || "guest"
        });

        // Fetch created passenger
        const newPassenger = await PassengerModel.getPassengerByID(newpassengerID);

        return res.status(201).json({
            ...newPassenger,
            isPrimary: false
        });

    } catch (err) {
        handleControllerError(res, err, "Controller Error in createAndLinkPassenger");
    }
}

// PUT /passengers/:passengerID
// Updates a passenger's full info
export async function updatePassenger(req, res) {
    try {
        const passengerID = req.params.passengerID;
        const updatedData = req.body;

        if (!passengerID) {
            return res.status(400).json({ message: "Passenger ID is required" });
        }

        // Check existence
        const exists = await PassengerModel.passengerExistsByID(passengerID);
        if (!exists) {
            return res.status(404).json({ message: "Passenger not found" });
        }

        const affectedRows = await PassengerModel.updatePassengerFull(
            passengerID,
            updatedData
        );

        if (affectedRows === 0) {
            return res.status(400).json({ message: "Update failed" });
        }

        const updatedPassenger = await PassengerModel.getPassengerByID(passengerID);

        return res.status(200).json(updatedPassenger);

    } catch (err) {
        handleControllerError(res, err, "Controller Error in updatePassenger");
    }
}

// PATCH /passengers/:passengerID
// Partially updates a passenger
export async function patchPassenger(req, res) {
    try {
        const passengerID = req.params.passengerID;
        const userID = req.params.userID;
        const updatedData = req.body;
        const relationship = req.body.relationship;

        if (!passengerID) {
            return res.status(400).json({ message: "Passenger ID is required" });
        }

        if (!updatedData || Object.keys(updatedData).length === 0) {
            return res.status(400).json({ message: "No fields provided for update" });
        }

        // Check existence
        const exists = await PassengerModel.passengerExistsByID(passengerID);
        if (!exists) {
            return res.status(404).json({ message: "Passenger not found" });
        }

        const affectedRows = await PassengerModel.updatePassengerPartial(
            passengerID,
            updatedData
        );

        // Update the relationship if needed
        if (relationship) {
            await PassengerModel.updatePassengerRelationship(userID, passengerID, relationship);
        }

        if (affectedRows === 0) {
            return res.status(200).json({ message: "No changes made" });
        }

        const updatedPassenger = await PassengerModel.getPassengerByID(passengerID);

        return res.status(200).json(updatedPassenger);

    } catch (err) {
        handleControllerError(res, err, "Controller Error in patchPassenger");
    }
}

// DELETE /users/:userID/passengers/:passengerID
// Unlinks a guest passenger from an account
export async function unlinkPassenger(req, res) {
    try {
        const userID = req.params.userID;
        const passengerID = req.params.passengerID;

        if (!userID || !passengerID) {
            return res.status(400).json({ message: "User ID and Passenger ID are required" });
        }

        // Prevent unlinking account owner
        const isOwner = await PassengerModel.isAccountOwner({
            accountID: userID,
            passengerID: passengerID
        });

        if (isOwner) {
            return res.status(400).json({
                message: "Cannot unlink account owner"
            });
        }

        // Prevent unlinking passenger with active tickets
        const hasTickets = await PassengerModel.hasActiveTickets(passengerID);
        if (hasTickets) {
            return res.status(400).json({
                message: "Cannot unlink passenger with active tickets"
            });
        }

        await PassengerModel.unlinkGuestFromAccount({
            accountID: userID,
            passengerID: passengerID
        });

        return res.status(200).json({
            message: "Passenger unlinked successfully"
        });

    } catch (err) {
        handleControllerError(res, err, "Controller Error in unlinkPassenger");
    }
}