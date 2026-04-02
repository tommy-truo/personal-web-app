import { db } from '../config/db.js'; // Ensure this points to a .js file

// SIGNUP FUNCTION
export const signup = async (req, res) => {
    console.log("Data received from frontend:", req.body);
    
    const { firstName, middleInitial, lastName, dob, email, password, isLoyaltyMember } = req.body;
    const loyaltyValue = isLoyaltyMember ? 1 : 0;

    try {
        // Inserts into accounts table
        const accountSql = 'INSERT INTO accounts (email, password, is_active) VALUES (?, ?, ?)';
        const [accountResult] = await db.execute(accountSql, [email, password, 1]);
        const accountId = accountResult.insertId;

        // Inserts into passengers table
        const passengerSql = 'INSERT INTO passengers (first_name, middle_initial, last_name, date_of_birth, is_loyalty_member) VALUES (?, ?, ?, ?, ?)';
        const [passengerResult] = await db.execute(passengerSql, [firstName, middleInitial || null, lastName, dob, loyaltyValue]);
        const passengerId = passengerResult.insertId;

        // Links account and passenger in account-passengers table
        const linkSql = 'INSERT INTO account_passengers (account_id, passenger_id, relationship, is_primary) VALUES (?, ?, ?, ?)';
        const [linkResult] = await db.execute(linkSql, [accountId, passengerId, 'Self', 1]);

        // Successful Message
        return res.status(200).json({ 
            message: "Signup successful! Details saved in both tables.",
            user: { id: accountId, email: email, role: 'passenger' } 
        });

    } catch (err) {
        // Error Catcher
        console.error("❌ DATABASE ERROR:", err.sqlMessage || err);
        
        if (err.code === 'ETIMEDOUT') {
            return res.status(503).json({ message: "Database timed out. Please try again." });
        }
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Email already exists." });
        }

        return res.status(500).json({ message: "Error during signup process" });
    }
};

// LOGIN FUNCTION
export const login = async (req, res) => {
    console.log("Login attempt:", req.body.email);
    
    const { email, password } = req.body;

    try {
        const sql = 'SELECT * FROM accounts WHERE email = ? AND password = ?';
        
        const [rows] = await db.execute(sql, [email, password]);

        if (rows.length > 0) {
            const user = rows[0];

            if (user.is_active === 0) {
                return res.status(403).json({ message: "This account is inactive." });
            }

            return res.status(200).json({ 
                message: "Login successful!",
                user: { id: user.account_id, email: user.email, role: user.role } 
            });
        } else {
            return res.status(401).json({ message: "The account or password is not valid" });
        }

    } catch (err) {



        console.error("LOGIN ERROR: ", err.message || err);
        return res.status(500).json({ message: "Error during login." });
    }
};
