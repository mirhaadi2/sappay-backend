import { Router } from 'express';
import { registerFarmerHandler, loginFarmerHandler, logoutFarmerHandler } from './controller';

const router = Router();

router.post('/register', registerFarmerHandler);
router.post('/login', loginFarmerHandler);
router.post('/logout', logoutFarmerHandler);

export default router;
