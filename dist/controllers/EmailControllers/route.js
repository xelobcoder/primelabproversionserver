"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const emailHandlers_1 = require("./emailHandlers");
const router = express_1.default.Router();
router.get("/api/v1/email/summary", emailHandlers_1.emailSummary);
router.get("/api/v1/email/summary/daily", emailHandlers_1.getEmailSummaryByDay);
router.get("/api/v1/email/logs", emailHandlers_1.getEmailLog);
router.get("/api/v1/email/custom/search", emailHandlers_1.customSearch);
router.post("/api/v1/email/composed/draft", emailHandlers_1.saveComposedEmailDraft);
router.get("/api/v1/email/composed/draft", emailHandlers_1.getComposedEmailDraft);
router.put("/api/v1/email/composed/draft", emailHandlers_1.updateEmailComposed);
router.post("/api/v1/email/publish", emailHandlers_1.publishEmail);
router.get("/verifyemail", emailHandlers_1.renderVerifyEmailPage);
router.get("/api/v1/verify/email/token", emailHandlers_1.verifyEmailToken);
exports.default = router;
