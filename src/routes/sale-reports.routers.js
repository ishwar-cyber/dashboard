import { Router } from "express";

import { saleReports } from "../controllers/sale-report.controllers.js";

const saleReportRouter = Router();

saleReportRouter.get('/reports', saleReports);

export default saleReportRouter;