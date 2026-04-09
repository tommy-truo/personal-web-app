// Written by Tommy Truong

import { pool } from '../../db.js';
import { mapFlightInstance, mapFlightSeats } from '../utils/mappers/flight-mapper.js';

export async function searchFlights(args = {}) {
    try {
        const departureCity = args.departureCity || null;
        const arrivalCity = args.arrivalCity || null;
        const departureDate = args.departureDate || null;
        const passengersNumber = args.passengersNumber || null;

        if (!departureCity) throw new Error(`Departure city is required`);
        if (!arrivalCity) throw new Error(`Arrival city is required`);
        if (!departureDate) throw new Error(`Departure date is required`);
        if (!passengersNumber) throw new Error(`Passengers number is required`);
        if (isNaN(passengersNumber) || passengersNumber < 1) {
            throw new Error(`Passengers number must be a positive integer`);
        }
        
        const queryStatement = `
            SELECT 
                fi.flight_instance_id,
                fs.status_name,
                fir.reason_name,

                fr.flight_number,
                fr.estimated_distance_km,

                depA.city AS departure_city,
                depA.country AS departure_country,
                depA.name AS departure_airport_name,
                depA.iata AS departure_iata,

                arrA.city AS arrival_city,
                arrA.country AS arrival_country,
                arrA.name AS arrival_airport_name,
                arrA.iata AS arrival_iata,

                CASE 
                    WHEN fs.status_name = 'Delayed' THEN fi.actual_departure_datetime
                    ELSE fi.scheduled_departure_datetime
                END AS departure_time,
                CASE 
                    WHEN fs.status_name = 'Delayed' THEN fi.actual_arrival_datetime
                    ELSE fi.scheduled_arrival_datetime
                END AS arrival_time

            FROM flight_instances AS fi

            JOIN flight_statuses AS fs ON fi.status_id = fs.flight_status_id
            LEFT JOIN flight_irregularity_reasons AS fir ON fi.status_reason_id = fir.flight_irregularity_reason_id
            JOIN flight_routes AS fr ON fi.flight_route_id = fr.flight_route_id

            JOIN airports AS depA ON fr.departure_airport_id = depA.airport_id
            JOIN airports AS arrA ON fr.arrival_airport_id = arrA.airport_id

            WHERE 
                depA.city LIKE ? 
                AND arrA.city LIKE ? 
                AND DATE(fi.scheduled_departure_datetime) = ?
                AND ( 
                    SELECT COUNT(*) 
                    FROM flight_seats AS fseats
                    JOIN seats AS s ON fseats.seat_id = s.seat_id
                    WHERE fseats.flight_instance_id = fi.flight_instance_id
                        AND fseats.status_id = (SELECT flight_seat_status_id FROM flight_seat_statuses WHERE status_name = 'Available')
                ) >= ?

            ORDER BY fi.scheduled_departure_datetime ASC;
        `;
        const [rows] = await pool.query(queryStatement, [`${departureCity}%`, `${arrivalCity}%`, departureDate, passengersNumber]);
        return rows.map(row => mapFlightInstance(row));
    } catch (err) {
        console.error(`Database Error in getAllFlightInstances:`, err);
        throw err;
    }
}

export async function getFlightSeats(flightInstanceID) {
    try {
        // get all seats for the aircraft assigned to the flight
        // then check which ones are available
        // then return list of all seats with availability statuses
        const queryStatement = `
            SELECT
                s.seat_id,
                s.seat_row,
                s.column_letter,
                cc.class_name,

                fss.status_name AS seat_status

            FROM flight_seats AS fs

            JOIN seats AS s ON fs.seat_id = s.seat_id
            JOIN flight_seat_statuses AS fss ON fs.status_id = fss.flight_seat_status_id
            JOIN cabin_classes AS cc ON s.cabin_class_id = cc.cabin_class_id

            WHERE fs.flight_instance_id = ?
        `;
        const [rows] = await pool.query(queryStatement, [flightInstanceID]);
        return rows.map(row => mapFlightSeats(row));
    } catch (err) {
        console.error(`Database Error in getFlightSeats:`, err);
        throw err;
    }
}