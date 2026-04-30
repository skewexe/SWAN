import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import assetsRouter from "./assets";
import workordersRouter from "./workorders";
import preventiveRouter from "./preventive";
import inventoryRouter from "./inventory";
import techniciansRouter from "./technicians";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(assetsRouter);
router.use(workordersRouter);
router.use(preventiveRouter);
router.use(inventoryRouter);
router.use(techniciansRouter);
router.use(reportsRouter);

export default router;
