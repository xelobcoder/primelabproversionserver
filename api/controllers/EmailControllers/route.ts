import express from "express";
import {
  emailSummary,
  getEmailSummaryByDay,
  getEmailLog,
  customSearch,
  saveComposedEmailDraft,
  getComposedEmailDraft,
  updateEmailComposed,
  publishEmail,
  renderVerifyEmailPage,
  verifyEmailToken,
} from "./emailHandlers";

const router = express.Router();

router.get("/api/v1/email/summary", emailSummary);
router.get("/api/v1/email/summary/daily", getEmailSummaryByDay);
router.get("/api/v1/email/logs", getEmailLog);
router.get("/api/v1/email/custom/search", customSearch);
router.post("/api/v1/email/composed/draft", saveComposedEmailDraft);
router.get("/api/v1/email/composed/draft", getComposedEmailDraft);
router.put("/api/v1/email/composed/draft", updateEmailComposed);
router.post("/api/v1/email/publish", publishEmail);
router.get("/verifyemail", renderVerifyEmailPage);
router.get("/api/v1/verify/email/token", verifyEmailToken);

export default router;
