import { Router } from "express";
import { handleGeneralSalesSummary, handleDailySummary } from "./handler";

const router = Router();


router.get("/api/v1/sales/summary/general", handleGeneralSalesSummary);
router.get("/api/v1/summary/daily", handleDailySummary);

export default router;
