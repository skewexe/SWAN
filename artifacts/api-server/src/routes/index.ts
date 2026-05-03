import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import assetsRouter from "./assets";
import workordersRouter from "./workorders";
import workorderPartsRouter from "./workorder_parts";
import preventiveRouter from "./preventive";
import inventoryRouter from "./inventory";
import techniciansRouter from "./technicians";
import reportsRouter from "./reports";
import notificationsRouter from "./notifications";
import sitesRouter from "./sites";
import zonesRouter from "./zones";
import assetPartsRouter from "./asset_parts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(assetsRouter);
router.use(workordersRouter);
router.use(workorderPartsRouter);
router.use(preventiveRouter);
router.use(inventoryRouter);
router.use(techniciansRouter);
router.use(reportsRouter);
router.use(notificationsRouter);
router.use(sitesRouter);
router.use(zonesRouter);
router.use(assetPartsRouter);

export default router;
