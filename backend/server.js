// Written by Tommy Truong

import express from 'express';
import cors from 'cors';
import passengerRouter from './src/routes/passenger-router.js';
import bookingRouter from './src/routes/booking-router.js';
import flightRouter from './src/routes/flight-instance-router.js';
import authRouter from './src/routes/authRoutes.js';

const app = express();
const PORT = 5001;

app.use(cors()); 

app.use(express.json()); 

//      ROUTES

app.use('/api/passengers', passengerRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/flights', flightRouter)
app.use('/api/auth', authRouter);

app.use((err, req, res, next) => {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ 
        message: "Internal Server Error", 
        error: err.message 
    });
});

//      START SERVER 
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

export default app;