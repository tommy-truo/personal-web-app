// Written by Tommy Truong

import { pool } from '../../db.js';
import { mapPassenger, mapSearchCriteria } from '../utils/mappers/passenger-mapper.js';

// Returns list of all passenger rows in DB
export async function getAllPassengers() {
    try {
        const queryStatement = `
            SELECT * 
            FROM passengers
        `;
        const [rows] = await pool.query(queryStatement);
        return rows.map(row => mapPassenger(row));
    } catch (err) {
        console.error("Database Error in getAllPassengers:", err);
        throw err;
    }
}

// Returns single passenger row with matching ID, or null if none are found
export async function getPassengerByID(id) {
    try {
        const queryStatement = `
            SELECT * 
            FROM passengers
            WHERE passenger_id = ?
        `;
        const [rows] = await pool.query(queryStatement, [id]);
        if (rows.length === 0) { return null; }
        return mapPassenger(rows[0]);
    } catch (err) {
        console.error("Database Error in getPassengerByID:", err);
        throw err;
    }
}

// Returns list of all passengers belonging to an accountID and/or email
export async function getAllPassengersByAccount(account = {}) {
    try {
        const accountInfo = { 
            accountID: account.accountID ?? account.account_id ?? null,
            email: account.email || null
        }

        if (!accountInfo.accountID && !accountInfo.email) { // Must provide acountID and/or account email
            throw new Error(`Must provide account info`);
        }

        let queryStatement = `
            SELECT p.*, ap.is_primary, ap.relationship
            FROM passengers AS p
            JOIN account_passengers AS ap ON ap.passenger_id = p.passenger_id
            JOIN accounts AS a ON ap.account_id = a.account_id
            WHERE 1=1
        `;
        let params = [];

        if (accountInfo.accountID) {
            queryStatement += ` AND a.account_id = ?`;
            params.push(accountInfo.accountID);
        } else {
            queryStatement += ` AND a.email = ?`;
            params.push(accountInfo.email);
        }

        const [rows] = await pool.query(queryStatement, params);
        return rows.map(row => {
            const mapped = mapPassenger(row);
            mapped.isPrimary = Boolean(row.is_primary); // Manually inject is_primary
            return mapped;
        });
    } catch (err) {
        console.error("Database Error in getAllPassengersByAccount:", err);
        throw err;
    }
}

export async function getPassengersByFlight(flightInstanceID) {
    try {
        const queryStatement = `
            SELECT p.passenger_id
            FROM passengers AS p
            JOIN tickets AS t ON p.passenger_id = t.passenger_id
            JOIN flight_instances AS fi ON t.flight_instance_id = fi.flight_instance_id
            WHERE fi.flight_instance_id = ?
        `;
        const [rows] = await pool.query(queryStatement, [flightInstanceID]);
        return rows;
    } catch (err) {
        console.error("Database Error in getPassengersByFlight");
        throw err;
    }
}

// Connects guest passenger to account in account_passengers table
// Does not return anything
export async function linkGuestToAccount(args = {}) {
    try {
        const link = {
            accountID: args.accountID ?? args.account_id ?? null,
            passengerID: args.passengerID ?? args.passenger_id ?? null,
            relationship: args.relationship ?? null
        };

        if (!link.accountID || !link.passengerID || !link.relationship) {
            throw new Error(`Must include accountID, passengerID, and relationship`);
        }

        const queryStatement = `
            INSERT INTO account_passengers (
                account_id,
                passenger_id,
                relationship,
                is_primary,
                created_datetime
            )
            VALUES (?, ?, ?, ?, NOW())
        `;

        const values = [
            link.accountID,
            link.passengerID,
            link.relationship,
            false // Set is_primary to false for all guest passengers
        ]

        await pool.query(queryStatement, values);
    } catch (err) {
        console.error("Database Error in linkGuestToAccount");
        throw err;
    }
}

// Disconnects a guest passenger from an account on account_passengers table
// Does not return anything
export async function unlinkGuestFromAccount(args = {}) {
    try {
        const unlink = {
            accountID: args.accountID ?? args.account_id ?? null,
            passengerID: args.passengerID ?? args.passenger_id ?? null,
        };

        if (!unlink.accountID || !unlink.passengerID) {
            throw new Error(`Must include accountID and passengerID`);
        }

        const queryStatement = `
            DELETE FROM account_passengers
            WHERE account_id = ? AND passenger_id = ?
        `;
        const values = [
            unlink.accountID,
            unlink.passengerID
        ]

        await pool.query(queryStatement, values)
    } catch (err) {
        console.error("Database Error in unlinkGuestFromAccount");
        throw err;
    }
}

// Returns boolean representing if a passenger is an account owner
// To prevent users from deleting their own passenger info
export async function isAccountOwner(args = {}) {
    try {
        const pair = {
            accountID: args.accountID ?? args.account_id ?? null,
            passengerID: args.passengerID ?? args.passenger_id ?? null,
        }

        if (!pair.accountID || !pair.passengerID) {
            throw new Error(`Must include accountID and passengerID`);
        }
        
        const queryStatement = `
            SELECT is_primary 
            FROM account_passengers
            WHERE account_id = ? AND passenger_id = ?
        `;
        const values = [pair.accountID, pair.passengerID];
        
        const [rows] = await pool.query(queryStatement, values);
        return rows.length > 0 && rows[0].is_primary === 1;
    } catch (err) {
        console.error("Database Error in isAccountOwner:", err);
        throw err;
    }
}

// Returns boolean representing if passenger has any valid upcoming tickets
// Prevents user from deleting guest passengers with booking tickets
export async function hasActiveTickets(passengerID) {
    try {
        const queryStatement = `
            SELECT 1 
            FROM tickets AS t
            JOIN bookings AS b ON b.booking_id = t.booking_id
            JOIN booking_statuses AS bs ON b.booking_status_id = bs.booking_status_id
            JOIN flight_instances AS fi ON t.flight_instance_id = fi.flight_instance_id
            WHERE 
                t.passenger_id = ? AND
                (bs.status_name = 'Confirmed' OR bs.status_name = 'Pending')
                AND fi.scheduled_departure_datetime > NOW()
            LIMIT 1
        `;

        const [rows] = await pool.query(queryStatement, [passengerID]);
        return rows.length > 0;
    } catch (err) {
        console.error("Database Error in hasActiveTickets:", err);
        throw err;
    }
}

// Returns boolean representing if passenger has a Known Traveler Number
// Used to check if passenger is allowed to do Online Pre-Check
export async function hasKTN(passengerID) {
    try {
        const queryStatement = `
            SELECT 1
            FROM passengers AS p
            WHERE 
                p.passenger_id = ? AND
                p.known_traveler_number IS NOT NULL
            LIMIT 1
        `;

        const [rows] = await pool.query(queryStatement, [passengerID]);
        return rows.length > 0;
    } catch (err) {
        console.error("Database Error in hasKTN:", err);
        throw err;
    }
}

// Returns list of all passengers matching criteria
export async function searchPassengers(criteria = {}) {
    try {
        const mappedCriteria = mapSearchCriteria(criteria);
        
        let queryStatement = `SELECT * FROM passengers WHERE 1=1`;
        const params = [];

        // Names
        if (mappedCriteria.firstName) {
            queryStatement += ` AND first_name LIKE ?`;
            params.push(`%${mappedCriteria.firstName}%`);
        }
        if (mappedCriteria.middleInitial) {
            queryStatement += ` AND middle_initial LIKE ?`;
            params.push(`%${mappedCriteria.middleInitial}%`)
        }
        if (mappedCriteria.lastName) {
            queryStatement += ` AND last_name LIKE ?`;
            params.push(`%${mappedCriteria.lastName}%`);
        }

        // DOB
        if (mappedCriteria.dateOfBirth) {
            queryStatement += ` AND date_of_birth = ?`;
            params.push(mappedCriteria.dateOfBirth);
        }

        // Loyalty Member
        if (mappedCriteria.isLoyaltyMember !== null) {
            queryStatement += ` AND is_loyalty_member = ?`;
            params.push(Number(mappedCriteria.isLoyaltyMember));
        }

        // Gender
        if (mappedCriteria.gender) {
            queryStatement += ` AND gender = ?`;
            params.push(mappedCriteria.gender);
        }

        // Phone Number
        if (mappedCriteria.phoneNumber) {
            queryStatement += ` AND phone_number = ?`;
            params.push(mappedCriteria.phoneNumber);
        }

        // Passport
        if (mappedCriteria.passportNumber) {
            queryStatement += ` AND passport_number = ?`;
            params.push(mappedCriteria.passportNumber);
        }
        if (mappedCriteria.passportCountry) {
            queryStatement += ` AND passport_country = ?`;
            params.push(mappedCriteria.passportCountry);
        }

        // Known Traveler Number
        if (mappedCriteria.knownTravelerNumber) {
            queryStatement += ` AND known_traveler_number = ?`;
            params.push(mappedCriteria.knownTravelerNumber);
        }

        const [rows] = await pool.query(queryStatement, params);
        return rows.map(row => mapPassenger(row));
    } catch (err) {
        console.error("Database Error in searchPassengers:", err);
        throw err;
    }
}

// Inserts new passenger row into passengers Table, returns passenger ID
export async function createPassenger(passengerData) {
    try {
        const passenger = mapPassenger(passengerData);

        const queryStatement = `
        INSERT INTO passengers (
            first_name, middle_initial, last_name,
            date_of_birth, 
            is_loyalty_member, loyalty_miles,
            gender,
            phone_number,
            passport_number, passport_country, passport_expiration,
            known_traveler_number,
            created_datetime, last_updated_datetime
        )
        VALUES (
            ?, ?, ?, 
            ?, 
            ?, ?,
            ?,
            ?,
            ?, ?, ?,
            ?,
            NOW(), NOW()
        )
        `;

        const values = [
            passenger.firstName,
            passenger.middleInitial,
            passenger.lastName,

            passenger.dateOfBirth,

            Number(passenger.isLoyaltyMember), // Converts bool to 1 or 0
            passenger.loyaltyMiles,

            passenger.gender,

            passenger.phoneNumber,

            passenger.passportNumber,
            passenger.passportCountry,
            passenger.passportExpiration,

            passenger.knownTravelerNumber
        ]

        const [result] = await pool.query(queryStatement, values);

        return result.insertId;
    } catch (err) {
        console.error("Database Error in createPassenger:", err);
        throw err;
    }
}

// Updates passenger's full data, returns number of affected rows
export async function updatePassengerFull(id, allUpdatedData) {
    try {
        const passenger = mapPassenger(allUpdatedData);

        const queryStatement = `
        UPDATE passengers 
        SET first_name = ?, middle_initial = ?, last_name = ?,
            date_of_birth = ?, 
            is_loyalty_member = ?, loyalty_miles = ?,
            gender = ?,
            phone_number = ?,
            passport_number = ?, passport_country = ?, passport_expiration = ?,
            known_traveler_number = ?,
            last_updated_datetime = NOW()
        WHERE passenger_id = ?
        `;

        const values = [
            passenger.firstName,
            passenger.middleInitial,
            passenger.lastName,

            passenger.dateOfBirth,

            Number(passenger.isLoyaltyMember), // Converts bool to 1 or 0
            passenger.loyaltyMiles,

            passenger.gender,

            passenger.phoneNumber,

            passenger.passportNumber,
            passenger.passportCountry,
            passenger.passportExpiration,

            passenger.knownTravelerNumber,

            id
        ]

        const [result] = await pool.query(queryStatement, values);

        return result.affectedRows;
    } catch (err) {
        console.error("Database Error in updatePassenger:", err);
        throw err;
    }
}

// Dynamically updates only provided passenger fields
export async function updatePassengerPartial(id, updatedData) {
    try {
        const fieldMap = {
            firstName: 'first_name',
            middleInitial: 'middle_initial',
            lastName: 'last_name',
            dateOfBirth: 'date_of_birth',
            isLoyaltyMember: 'is_loyalty_member',
            loyaltyMiles: 'loyalty_miles',
            gender: 'gender',
            phoneNumber: 'phone_number',
            passportNumber: 'passport_number',
            passportCountry: 'passport_country',
            passportExpiration: 'passport_expiration',
            knownTravelerNumber: 'known_traveler_number'
        };

        const fields = [];
        const values = [];

        // Helper to get value from camelCase OR snake_case
        const getValue = (camelKey, columnName) => {
            const val = updatedData[camelKey] ?? updatedData[columnName];
            if (val === undefined || val === null) {
                if (camelKey == 'middleInitial' || columnName == 'middle_initial') { return null; }
                
                return undefined; // skip nulls
            }
            return val;
        };

        for (const [camelKey, columnName] of Object.entries(fieldMap)) {
            let value = getValue(camelKey, columnName);

            if (value !== undefined) {  
                // Special handling for boolean
                if (camelKey === 'isLoyaltyMember') {
                    value = Number(value);
                }

                fields.push(`${columnName} = ?`);
                values.push(value);
            }
        }

        // If nothing to update
        if (fields.length === 0) {
            return 0;
        }

        // Always update timestamp
        fields.push('last_updated_datetime = NOW()');

        const queryStatement = `
            UPDATE passengers
            SET ${fields.join(', ')}
            WHERE passenger_id = ?
        `;

        values.push(id);

        const [result] = await pool.query(queryStatement, values);

        return result.affectedRows;

    } catch (err) {
        console.error("Database Error in updatePassengerPartial:", err);
        throw err;
    }
}

export async function updatePassengerRelationship(userID, passengerID, relationship) {
    try {
        const queryStatement = `
            UPDATE account_passengers
            SET relationship = ?
            WHERE account_id = ? AND passenger_id = ?
        `;

        const [result] = await pool.query(queryStatement, [relationship,userID,passengerID]);
        return result.affectedRows;
    } catch (err) {
        console.error("Database Error in updatePassengerRelationship:", err);
        throw err;
    }
}

// Updates passenger's loyalty membership to 1, no return value
export async function enrollPassenger(passengerID) {
    try {
        const queryStatement = `
            UPDATE passengers
            SET is_loyalty_member = 1, loyalty_miles = 0
            WHERE passenger_id = ?
        `;

        const [result] = await pool.query(queryStatement, [passengerID]);
    } catch (err) {
        console.error("Database Error in enrollPassenger:", err);
        throw err;
    }
}

// Updates passenger's loyalty membership to 0 and sets all miles to 0, no return value
export async function unenrollPassenger(passengerID) {
    try {
        const queryStatement = `
            UPDATE passengers
            SET is_loyalty_member = 0, loyalty_miles = 0
            WHERE passenger_id = ?
        `;

        const [result] = await pool.query(queryStatement, [passengerID]);
    } catch (err) {
        console.error("Database Error in unenrollPassenger:", err);
        throw err;
    }
}

// Updates passenger's loyalty miles, can accept positive or negative amounts
// Does not return anything
export async function updateLoyaltyMiles(args = {}) {
    try {
        const values = {
            passengerID: args.passenger_id || args.passengerID || null,
            amount: args.amount || args.miles || null
        }

        if (!values.passengerID || !values.amount) {
            throw new Error(`Must include passengerID and amount`);
        }

        const queryStatement = `
            UPDATE passengers
            SET loyalty_miles = loyalty_miles + ?
            WHERE passenger_id = ?
        `;

        const [result] = await pool.query(queryStatement, [values.amount, values.passengerID]);
    } catch (err) {
        console.error("Database Error in updatePassengerLoyaltyMembership:", err);
        throw err;
    }
}

// Deletes passenger row with matching ID, returns number of affected rows
export async function deletePassenger(id) {
    try {
        const queryStatement = `
        DELETE FROM passengers
        WHERE passenger_id = ?
        `;

        const [result] = await pool.query(queryStatement, [id]);

        return result.affectedRows;
    } catch (err) {
        console.error("Database Error in deletePassenger:", err);
        throw err;
    }
}

// Checks for existence of passenger with matching ID, returns boolean for existence
export async function passengerExistsByID(id) {
    try {
        const queryStatement = `
        SELECT 1
        FROM passengers
        WHERE passenger_id = ?
        LIMIT 1
        `;

        const [result] = await pool.query(queryStatement, [id]);

        return result.length > 0;
    } catch (err) {
        console.error("Database Error in passengerExists:", err);
        throw err;
    }
}