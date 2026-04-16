// Written by Tommy Truong

import { pool } from '../../db.js';

// Returns a list of all bookings owned by a passenger
export async function getPassengerBookings(ownerID) {
    try {
        const query = `
            SELECT
                b.booking_id,
                bs.status_name AS booking_status,
                b.created_datetime,
                b.expires_datetime,
                t.ticket_id,
                t.checked_in,
                bg.group_name,
                fr.flight_number,
                fi.flight_instance_id,
                fs.status_name AS flight_status,
                fir.reason_name AS status_reason,
                depA.city AS dep_city, depA.country AS dep_country, depA.iata AS dep_iata,
                arrA.city AS arr_city, arrA.country AS arr_country, arrA.iata AS arr_iata,
                CASE
                    WHEN fs.status_name = 'Delayed' THEN fi.actual_departure_datetime
                    ELSE fi.scheduled_departure_datetime
                END AS scheduled_departure_datetime,
                CASE
                    WHEN fs.status_name = 'Delayed' THEN fi.actual_arrival_datetime
                    ELSE fi.scheduled_arrival_datetime
                END AS scheduled_arrival_datetime,
                p.first_name, p.middle_initial, p.last_name,
                s.seat_row, s.column_letter
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
            WHERE 
                ap.account_id = ?
                AND scheduled_arrival_datetime >= (NOW() - INTERVAL 24 HOUR)
            ORDER BY b.created_datetime DESC, fi.scheduled_departure_datetime ASC;
        `;

        const [rows] = await pool.query(query, [ownerID]);

        const grouped = rows.reduce((acc, row) => {
            // 1. Initialize Booking
            if (!acc[row.booking_id]) {
                acc[row.booking_id] = {
                    id: row.booking_id,
                    status: row.booking_status,
                    created: row.created_datetime,
                    expires: row.expires_datetime,
                    flights: {} // Use an object here to group by flight_instance_id
                };
            }

            // 2. Initialize Flight within Booking
            if (!acc[row.booking_id].flights[row.flight_instance_id]) {
                acc[row.booking_id].flights[row.flight_instance_id] = {
                    instanceId: row.flight_instance_id,
                    number: row.flight_number,
                    status: row.flight_status,
                    departure: {
                        city: row.dep_city,
                        iata: row.dep_iata,
                        time: row.scheduled_departure_datetime
                    },
                    arrival: {
                        city: row.arr_city,
                        iata: row.arr_iata,
                        time: row.scheduled_arrival_datetime
                    },
                    tickets: []
                };
            }

            // 3. Add Ticket to the specific Flight
            acc[row.booking_id].flights[row.flight_instance_id].tickets.push({
                id: row.ticket_id,
                passenger: `${row.first_name} ${row.middle_initial ? row.middle_initial + ". " : ""}${row.last_name}`,
                seat: `${row.seat_row}${row.column_letter}`,
                boardingGroup: row.group_name,
                checkedIn: Boolean(row.checked_in)
            });

            return acc;
        }, {});

        // Convert nested objects back to arrays for the frontend
        return Object.values(grouped).map(b => ({
            ...b,
            flights: Object.values(b.flights)
        }));
    } catch (err) {
        throw err;
    }
}

// Gets a booking info by its ID for checkout page
export async function getCheckoutInfo(bookingID) {
    try {
        const query = `
            SELECT
                bs.status_name,
                b.expires_datetime,

                owner.is_loyalty_member,
                owner.loyalty_miles,

                t.ticket_id,
                t.ticket_price,

                s.seat_row,
                s.column_letter,

                fi.flight_instance_id,

                fr.flight_number,

                depA.city AS depA_city,
                depA.iata AS depA_iata,

                arrA.city AS arrA_city,
                arrA.iata AS arrA_iata,

                CASE
                    WHEN fs.status_name = 'Delayed' 
                        THEN fi.actual_departure_datetime
                    ELSE 
                        fi.scheduled_departure_datetime
                END AS departure_datetime,
                CASE
                    WHEN fs.status_name = 'Delayed' 
                        THEN fi.actual_arrival_datetime
                    ELSE 
                        fi.scheduled_arrival_datetime
                END AS arrival_datetime
            
            FROM bookings AS b

            JOIN booking_statuses AS bs ON b.booking_status_id = bs.booking_status_id
            JOIN passengers AS owner ON b.booking_owner_passenger_id = owner.passenger_id

            JOIN tickets AS t ON t.booking_id = b.booking_id

            JOIN flight_seats AS fse 
                ON t.flight_instance_id = fse.flight_instance_id AND t.seat_id = fse.seat_id

            JOIN seats AS s ON fse.seat_id = s.seat_id

            JOIN flight_instances AS fi ON fse.flight_instance_id = fi.flight_instance_id
            JOIN flight_routes AS fr ON fi.flight_route_id = fr.flight_route_id
			JOIN flight_statuses AS fs ON fi.status_id = fs.flight_status_id

            JOIN airports AS depA ON fr.departure_airport_id = depA.airport_id
            JOIN airports AS arrA ON fr.arrival_airport_id = arrA.airport_id

            WHERE b.booking_id = ?;
        `;

        const [rows] = await pool.query(query, [bookingID]);
        if (rows.length === 0) return null;

        // Group rows by flight_instance_id
        const grouped = rows.reduce((acc, row) => {
            const flightId = row.flight_instance_id;
            if (!acc[flightId]) {
                acc[flightId] = {
                    flightInstanceId: flightId,
                    flightNumber: row.flight_number,
                    departure: { city: row.depA_city, iata: row.depA_iata, time: row.departure_datetime },
                    arrival: { city: row.arrA_city, iata: row.arrA_iata, time: row.arrival_datetime },
                    tickets: []
                };
            }
            acc[flightId].tickets.push({
                ticketId: row.ticket_id,
                price: parseFloat(row.ticket_price),
                seatLabel: `${row.seat_row}${row.column_letter}`
            });
            return acc;
        }, {});

        return {
            bookingID,
            status: rows[0].booking_status,
            expires: rows[0].expires_datetime,
            loyalty: { isMember: rows[0].is_loyalty_member, miles: rows[0].loyalty_miles },
            flights: Object.values(grouped)
        };
    } catch (err) {
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

// Updated to handle multiple flights (Round-Trip) and fix scoping
export async function createPendingBooking(args = {}) {
    const conn = await pool.getConnection();

    try {
        const ownerID = args.ownerID ?? args.owner_id ?? null;
        const tickets = args.tickets ?? null; // Expecting [{ passengerID, seatID, flightInstanceID, price }, ...]

        if (!ownerID) throw new Error("Missing ownerID");
        if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
            throw new Error("Tickets must be a non-empty array");
        }

        await conn.beginTransaction();

        // 1. CREATE THE MASTER BOOKING
        const createBookingStatement = `
            INSERT INTO bookings (booking_owner_passenger_id, booking_status_id, created_datetime, last_updated_datetime, expires_datetime) 
            VALUES (
                (SELECT passenger_id FROM account_passengers WHERE account_id = ? AND is_primary = 1 LIMIT 1),
                (SELECT booking_status_id FROM booking_statuses WHERE status_name = 'Pending' LIMIT 1),
                NOW(),
                NOW(),
                (NOW() + INTERVAL 15 MINUTE)
            )
        `;
        const [newBooking] = await conn.query(createBookingStatement, [ownerID]);
        const newBookingID = newBooking.insertId;

        // 2. PROCESS TICKETS (Grouped by flight to handle locking/updates efficiently)
        for (const ticket of tickets) {
            const { passengerID, seatID, flightInstanceID, price } = ticket;

            // Lock and Verify Seat Availability
            const lockSeatsStatement = `
                SELECT fs.seat_id, fss.status_name
                FROM flight_seats AS fs
                JOIN flight_seat_statuses AS fss ON fs.status_id = fss.flight_seat_status_id
                WHERE fs.flight_instance_id = ? AND fs.seat_id = ?
                FOR UPDATE;
            `;
            const [locked] = await conn.query(lockSeatsStatement, [flightInstanceID, seatID]);
            
            if (locked.length === 0 || locked[0].status_name !== 'Available') {
                throw new Error(`Seat ${seatID} on flight ${flightInstanceID} is no longer available.`);
            }

            // Update Seat Status to Reserved
            const reserveSeatsStatement = `
                UPDATE flight_seats
                SET 
                    status_id = (SELECT flight_seat_status_id FROM flight_seat_statuses WHERE status_name = 'Reserved' LIMIT 1)
                WHERE flight_instance_id = ? AND seat_id = ?;
            `;
            await conn.query(reserveSeatsStatement, [flightInstanceID, seatID]);

            // Insert Ticket
            const createTicketsStatement = `
                INSERT INTO tickets (booking_id, passenger_id, flight_instance_id, seat_id, boarding_group_id, ticket_price, checked_in)
                SELECT ?, ?, ?, ?, bg.boarding_group_id, ?, 0
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
            await conn.query(createTicketsStatement, [newBookingID, passengerID, flightInstanceID, seatID, price, seatID]);
        }

        await conn.commit();
        return newBookingID;

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

export async function confirmBooking(bookingID) {
    try {
        if (!bookingID) {throw new Error("booking ID required");}
        
        const confirmQuery = `
            UPDATE bookings AS b
            SET 
                booking_status_id = (SELECT booking_status_id FROM booking_statuses WHERE status_name = 'Confirmed' LIMIT 1),
                last_updated_datetime = NOW()
            WHERE booking_id = ?
        `;
        await pool.query(confirmQuery, [bookingID]);

    } catch (err) {
        console.error("Database Error in confirmBooking");
        throw err;
    }
}

export async function expireBooking(bookingID) {
    try {
        if (!bookingID) {throw new Error("booking ID required");}
        
        const confirmQuery = `
            UPDATE bookings AS b
            SET 
                booking_status_id = (SELECT booking_status_id FROM booking_statuses WHERE status_name = 'Expired' LIMIT 1),
                last_updated_datetime = NOW()
            WHERE booking_id = ?
        `;
        await pool.query(confirmQuery, [bookingID]);

    } catch (err) {
        console.error("Database Error in expireBooking:");
        throw err;
    }
}

// Cancels booking
export async function cancelBooking(bookingID) {
    try {
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
        await pool.query(updateBookingQuery, [bookingID]);

    } catch (err) {
        console.error("Database Error in cancelBooking:", err);
        throw err;
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

export async function getBookingsToExpire() {
    try {
        const fetchQuery = `
            SELECT booking_id
            FROM bookings
            WHERE
                expires_datetime <= NOW()
                AND booking_status_id = (
                    SELECT booking_status_id
                    FROM booking_statuses
                    WHERE 
                        status_name = 'Pending')
            ;
        `;

        const [rows] = await pool.query(fetchQuery);

        return rows;
    } catch (err) {
        console.error("Database Error in getBookingsToExpire");
        throw err;
    }
}