import express from "express";
import { getRejectedSamplesList, rejectedSampleApproval, disputeSampleRejection, getSampleDisputeLog } from "./rejectedHandlers";

const router = express.Router();

router.get("/api/v1/rejected", getRejectedSamplesList);
router.post("/api/v1/rejected", rejectedSampleApproval);
router.put("/api/v1/sample/rejection/disputed", disputeSampleRejection);
router.get("/api/v1/sample/disputed/log/single", getSampleDisputeLog);

export default router;
