import { Router } from "express";
import * as clinicianHandlers from "./cliniciansHandlers";

const router = Router();

router.get("/api/v1/clinicians", clinicianHandlers.getCliniciansHandler);
router.get("/api/v1/clinicians/getclinician", clinicianHandlers.getSingleClinicianHandler);
router.put("/api/v1/clinicians", clinicianHandlers.putCliniciansHandler);
router.delete("/api/v1/clinicians", clinicianHandlers.deleteCliniciansHandler);
router.post("/api/v1/clinicians", clinicianHandlers.postCliniciansHandler);
router.get("/api/v1/clinician/performance/top", clinicianHandlers.getTopPerformingCliniciansHandler);
router.post("/api/v1/client/filter/clinician", clinicianHandlers.filterClinicianHandler);
router.get("/api/v1/clinician/resultsets", clinicianHandlers.getClinicianResultHandler);
router.get("/api/v1/clinician/resultsets/billingid", clinicianHandlers.getBillingTestBasedByClinicianHandler);
router.post("/api/v1/orders/temporary", clinicianHandlers.postTemporaryOrderHandler);
router.get("/api/v1/orders/temporary", clinicianHandlers.getTemporaryOrdersHandler);
router.get("/api/v1/orders/temporary/processing", clinicianHandlers.getTemporaryOrdersProcessingHandler);
router.post("/api/v1/orders/processed", clinicianHandlers.postProcessedOrderHandler);

export default router;
