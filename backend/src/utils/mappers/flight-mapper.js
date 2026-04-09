// Written by Tommy Truong

export const mapFlightInstance = (row) => {
    if (!row) return null;

    return {
        // Identifiers
        flightInstanceId: row.flight_instance_id,
        flightNumber: row.flight_number,
        
        // Departure Details
        departure: {
            country: row.departure_country,
            city: row.departure_city,
            airportName: row.departure_airport_name,
            iata: row.departure_iata,
            time: row.departure_time
        },

        // Arrival Details
        arrival: {
            country: row.arrival_country,
            city: row.arrival_city,
            airportName: row.arrival_airport_name,
            iata: row.arrival_iata,
            time: row.arrival_time
        },

        // Status & Irregularities
        status: {
            name: row.status_name,
            reason: row.reason_name
        },

        // Metrics
        distanceKm: row.estimated_distance_km,
        
        // Duration Calculation
        durationMinutes: calculateDuration(row.departure_time, row.arrival_time)
    };
};

// Helper to calculate total minutes between two date strings
function calculateDuration(start, end) {
    if (!start || !end) return 0;
    const diff = new Date(end) - new Date(start);
    return Math.floor(diff / 1000 / 60);
}

export const mapFlightSeats = (row) => {
    if (!row) return null;

    return {
        id: row.seat_id,
        row: row.seat_row,
        col: row.column_letter,
        class: row.class_name,

        status: row.seat_status,
        isAvailable: validateSeatAvailability(row.seat_status)
    };
}

function validateSeatAvailability(status) {
    if (!status) return false;

    if (status === 'Available') {
        return true;
    } else {
        return false;
    }
}