import { Router } from 'express';
import * as FlightController from '../controllers/flight-instance-controller.js';

const router = Router();

router.get('/search', FlightController.findFlights);
router.get('/:flightInstanceId/seats', FlightController.fetchFlightSeats);

export default router;