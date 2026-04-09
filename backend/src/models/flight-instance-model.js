// Written by Tommy Truong

import { pool } from '../../db.js';
import { mapFlightInstance} from '../utils/mappers/flight-mapper.js';

export async function searchFlights(args = {}) {
    try {
        const departureCity = args.departureCity || null;
        const arrivalCity = args.arrivalCity || null;
        const departureDate = args.departureDate || null;

        if (!departureCity) throw new Error(`Departure city is required`);
        if (!arrivalCity) throw new Error(`Arrival city is required`);
        
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

                arrA.city AS arrival_city,
                arrA.country AS arrival_country,
                arrA.name AS arrival_airport_name,

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

            WHERE depA.city LIKE ? AND arrA.city LIKE ? AND 
                DATE(fi.scheduled_departure_datetime) = ?;
        `;
        const [rows] = await pool.query(queryStatement, [`${departureCity}%`, `${arrivalCity}%`, departureDate]);
        return rows.map(row => mapFlightInstance(row));
    } catch (err) {
        console.error(`Database Error in getAllFlightInstances:`, err);
        throw err;
    }
}