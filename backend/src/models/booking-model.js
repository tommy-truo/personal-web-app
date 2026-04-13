// Written by Tommy Truong

import { pool } from '../../db.js';

// Returns a list of all bookings owned by a passenger
export async function getPassengerBookings(ownerID) {
    try {
        const query = `
            SELECT
                b.booking_id,
                bs.status_name AS booking_status,
                t.ticket_id,
                t.checked_in AS checked_in,
                bg.group_name,
                fr.flight_number,
                fs.status_name AS flight_status,
                fir.reason_name AS status_reason,

                depA.city AS dep_city,
                depA.country AS dep_country,
                depA.name AS dep_airport_name,
                depT.name AS dep_terminal_name,
                depG.number AS dep_gate_number,

                arrA.city AS arr_city,
                arrA.country AS arr_country,
                arrA.name AS arr_airport_name,
                arrT.name AS arr_terminal_name,
                arrG.number AS arr_gate_number,

                fi.scheduled_departure_datetime,
                fi.scheduled_arrival_datetime,

                p.first_name,
                p.last_name,

                s.seat_row,
                s.column_letter
            FROM bookings AS b
            JOIN booking_statuses AS bs ON b.booking_status_id = bs.booking_status_id
            JOIN tickets AS t ON t.booking_id = b.booking_id
            JOIN boarding_groups AS bg ON t.boarding_group_id = bg.boarding_group_id
            JOIN passengers AS p ON t.passenger_id = p.passenger_id

            JOIN flight_seats AS fse ON t.seat_id = fse.seat_id AND t.flight_instance_id = fse.flight_instance_id
            JOIN seats AS s ON fse.seat_id = s.seat_id
            JOIN flight_instances AS fi ON fse.flight_instance_id = fi.flight_instance_id

            JOIN flight_statuses AS fs ON fi.status_id = fs.flight_status_id

            LEFT JOIN flight_irregularity_reasons AS fir ON fi.status_reason_id = fir.flight_irregularity_reason_id
            JOIN flight_routes AS fr ON fi.flight_route_id = fr.flight_route_id

            JOIN gates AS depG ON fi.departure_gate_id = depG.gate_id
            JOIN terminals AS depT ON depG.terminal_id = depT.terminal_id
            JOIN airports AS depA ON depT.airport_id = depA.airport_id

            JOIN gates AS arrG ON fi.arrival_gate_id = arrG.gate_id
            JOIN terminals AS arrT ON arrG.terminal_id = arrT.terminal_id
            JOIN airports AS arrA ON arrT.airport_id = arrA.airport_id

            JOIN account_passengers AS ap ON ap.passenger_id = b.booking_owner_passenger_id
            JOIN accounts AS acc ON acc.account_id = ap.account_id

            WHERE acc.account_id = ?
            ORDER BY b.created_datetime DESC;
        `;

        const [rows] = await pool.query(query, [ownerID]);

        const groupedBookings = rows.reduce((acc, row) => {
            if (!acc[row.booking_id]) {
                acc[row.booking_id] = {
                    id: row.booking_id,
                    status: row.booking_status,

                    flight: {
                        number: row.flight_number,
                        status: row.flight_status,
                        statusReason: row.status_reason,
                    },

                    departure: {
                        departureCity: row.dep_city,
                        departureCountry: row.dep_country,

                        departureAirport: row.dep_airport_name,
                        departureTerminal: row.dep_terminal_name,
                        departureGate: row.dep_gate_number,

                        scheduledDeparture: row.scheduled_departure_datetime,
                    },

                    arrival: {
                        arrivalCity: row.arr_city,
                        arrivalCountry: row.arr_country,

                        arrivalAirport: row.arr_airport_name,
                        arrivalTerminal: row.arr_terminal_name,
                        arrivalGate: row.arr_gate_number,

                        scheduledArrival: row.scheduled_arrival_datetime,
                    },

                    tickets: []
                };
            }

            acc[row.booking_id].tickets.push({
                id: row.ticket_id,
                boardingGroup: row.group_name,
                
                passenger: {
                    firstName: row.first_name,
                    lastName: row.last_name
                },

                seat: {
                    row: row.seat_row,
                    col: row.column_letter
                },


                checkedIn: Boolean(row.checked_in) // Force 1/0 to true/false
            });

            return acc;
        }, {});

        return Object.values(groupedBookings);
    } catch (err) {
        console.error("Database Error in getPassengerBookings", err);
        throw err;
    }
}

// Updates a ticket's checked_in value to 1
// Does not return anything
export async function checkInTicket(ticketID) {
    try {
        const queryStatement = `
            UPDATE tickets
            SET checked_in = 1
            WHERE ticket_id = ?
        `;

        const [results] = await pool.query(queryStatement, [ticketID]);

        return results.affectedRows;

    } catch (err) {
        console.error("Database Error in checkInTicket", err);
        throw err;
    }
}

// Checks if a ticket with matching flight and seat already exists
// Returns boolean representing ticket existence
export async function ticketExists(args = {}) {
    try {
        const flightInstanceID = args.flightInstanceID ?? args.flight_instance_id ?? null;
        const seatID = args.seatID ?? args.seat_id ?? null;

        // Validate input
        if (!flightInstanceID) { throw new Error("Missing flightInstanceID"); }
        if (!seatID) { throw new Error("Missing seatID"); }

        const queryStatement = `
            SELECT 1
            FROM tickets
            WHERE flight_instance_id = ? AND seat_id = ?
            LIMIT 1
        `;

        const [results] = await pool.query(queryStatement, [flightInstanceID, seatID]);

        return results.length > 0;
    } catch (err) {
        console.error("Database Error with ticketExists", err);
        throw err;
    }
}

// Inserts new booking and tickets in a single transaction
// Returns the new booking ID
export async function createBookingWithTickets(args = {}) {
    const conn = await pool.getConnection();

    try {
        // Input
        const ownerID = args.ownerID ?? args.owner_id ?? null;
        const flightInstanceID = args.flightInstanceID ?? args.flight_instance_id ?? null;
        const tickets = args.tickets ?? null;

        // Validate input
        if (!ownerID) { throw new Error("Missing ownerID"); }
        if (!flightInstanceID) { throw new Error("Missing flightInstanceID"); }
        if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
            throw new Error("Tickets must be a non-empty array");
        }

        for (const ticket of tickets) {
            if (!ticket.passengerID || !ticket.seatID || !ticket.price) {
                throw new Error("Each ticket must have a passengerID, seatID, and price");
            }
        }

        await conn.beginTransaction();

        // Lock the flight seats that are being booked
        const seatIDs = tickets.map(t => t.seatID);
        const lockSeatsStatement = `
            SELECT fs.seat_id, fss.status_name
            FROM flight_seats AS fs
            JOIN flight_seat_statuses AS fss ON fs.status_id = fss.flight_seat_status_id
            WHERE fs.flight_instance_id = ?
                AND fs.seat_id IN (?)
            FOR UPDATE;
        `;
        const [lockedSeats] = await conn.query(lockSeatsStatement, [flightInstanceID, seatIDs]);
        const isAvailable = lockedSeats.length === seatIDs.length
            && lockedSeats.every(s => s.status_name === 'Available');

        if (!isAvailable) {
            throw new Error(`One or more selected seats are no longer available. Please refresh and select different seats.`);
        }

        // Reserve the seats by setting their status to 'Reserved'
        const reserveSeatsStatement = `
            UPDATE flight_seats
            SET status_id = (SELECT flight_seat_status_id
                            FROM flight_seat_statuses
                            WHERE status_name = 'Reserved'
                            LIMIT 1)
            WHERE flight_instance_id = ? 
                AND seat_id IN (?);
        `;
        const [reservedSeats] = await conn.query(reserveSeatsStatement, [flightInstanceID, seatIDs]);
        if (reservedSeats.affectedRows !== seatIDs.length) {
            throw new Error(`Failed to reserve all selected seats. Please refresh and try again.`);
        }

        // Create booking
        const createBookingStatement = `
            INSERT INTO bookings (
                booking_owner_passenger_id,
                booking_status_id
            ) VALUES (
                ?,
                (   SELECT booking_status_id
                    FROM booking_statuses
                    WHERE status_name = 'Pending'
                    LIMIT 1
                )
            )
        `;
        const [newBooking] = await conn.query(createBookingStatement, [ownerID]);
        const newBookingID = newBooking.insertId;

        // Create tickets
        const createTicketsStatement = `
            INSERT INTO tickets (
                booking_id,
                passenger_id,
                flight_instance_id,
                seat_id,
                boarding_group_id,
                ticket_price,
                checked_in
            )
            SELECT
                ?, -- booking_id
                ?, -- passenger_id
                ?, -- flight_instance_id
                s.seat_id,
                bg.boarding_group_id,
                ?, -- ticket_price
                0 -- checked_in
            FROM seats AS s
            JOIN cabin_classes AS cc ON s.cabin_class_id = cc.cabin_class_id
            JOIN boarding_groups AS bg ON (
                (cc.class_name = 'First Class' AND bg.group_name = 'First Class') OR
                (cc.class_name = 'Business' AND bg.group_name = 'Business Class') OR
                (cc.class_name = 'Premium Economy' AND bg.group_name = 'Group 1') OR
                (cc.class_name NOT IN ('First Class', 'Business', 'Premium Economy') AND bg.group_name = 'Group 2')
            )
            WHERE s.seat_id = ?;
        `;
        for (const ticket of tickets) {
            await conn.query(createTicketsStatement, [
                newBookingID,
                ticket.passengerID,
                flightInstanceID,
                ticket.price,
                ticket.seatID
            ]);
        }

        await conn.commit();
        return newBookingID;

    } catch (err) {
        await conn.rollback();
        console.error("Database Error with createBookingWithTickets", err);
        throw err;
    } finally {
        conn.release();
    }
}

// Deletes ticket with matching ticketID from tickets table
// Returns number of rows affected
export async function deleteTicket(ticketID) {
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction();
        
        // Reset flight seat status of ticket
        const statusStatement = `
            UPDATE flight_seats AS fs
            JOIN tickets AS t 
                ON t.flight_instance_id = fs.flight_instance_id 
                AND t.seat_id = fs.seat_id
            JOIN flight_seat_statuses AS fss 
                ON fss.status_name = 'Available'
            SET fs.status_id = fss.flight_seat_status_id
            WHERE t.ticket_id = ?;
        `;
        await conn.query(statusStatement, [ticketID]);

        // Update the last-updated timestamp of ticket's booking
        const bookingStatement = `
            UPDATE bookings
            JOIN tickets AS t
                ON bookings.booking_id = t.booking_id
            SET last_updated_datetime = NOW()
            WHERE t.ticket_id = ?
        `;
        await conn.query(bookingStatement, [ticketID]);

        // Delete ticket
        const ticketStatement = `
            DELETE FROM tickets
            WHERE ticket_id = ?
        `;
        const [ticketResult] = await conn.query(ticketStatement, [ticketID]);

        await conn.commit();
        return ticketResult.affectedRows;
    } catch (err) {
        await conn.rollback();
        console.error("Database Error in deleteTicket", err);
        throw err;
    } finally {
        conn.release();
    }
}

// Cancels booking and deletes all related tickets
// Returns the number of tickets removed
export async function cancelBooking(bookingID) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // Reset all flight_seats associated with this booking to 'Available'
        const resetSeatsQuery = `
            UPDATE flight_seats AS fs
            JOIN tickets AS t 
                ON t.flight_instance_id = fs.flight_instance_id 
                AND t.seat_id = fs.seat_id
            JOIN flight_seat_statuses AS fss 
                ON fss.status_name = 'Available'
            SET fs.status_id = fss.flight_seat_status_id
            WHERE t.booking_id = ?
        `;
        await conn.query(resetSeatsQuery, [bookingID]);

        // Delete all tickets related to this booking
        const deleteTicketsQuery = `
            DELETE FROM tickets 
            WHERE booking_id = ?
        `;
        const [ticketResult] = await conn.query(deleteTicketsQuery, [bookingID]);

        // Set the booking status to 'Cancelled'
        const updateBookingQuery = `
            UPDATE bookings
            SET booking_status_id = (
                SELECT booking_status_id 
                FROM booking_statuses 
                WHERE status_name = 'Cancelled' 
                LIMIT 1
            ), last_updated_datetime = NOW()
            WHERE booking_id = ?
        `;
        await conn.query(updateBookingQuery, [bookingID]);

        await conn.commit();
        return ticketResult.affectedRows;

    } catch (err) {
        await conn.rollback();
        console.error("Database Error in cancelBooking:", err);
        throw err;
    } finally {
        conn.release();
    }
}