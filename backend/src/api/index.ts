import { Router } from 'express';
import offersRouter from './offers.router';
import complexesRouter from './complexes.router';
import filtersRouter from './filters.router';

const router = Router();

router.use('/offers', offersRouter);
router.use('/complexes', complexesRouter);
router.use('/filters', filtersRouter);

export default router;
