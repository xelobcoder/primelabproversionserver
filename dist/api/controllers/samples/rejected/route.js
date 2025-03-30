"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rejectedHandlers_1 = require("./rejectedHandlers");
const router = express_1.default.Router();
router.get("/api/v1/rejected", rejectedHandlers_1.getRejectedSamplesList);
router.post("/api/v1/rejected", rejectedHandlers_1.rejectedSampleApproval);
router.put("/api/v1/sample/rejection/disputed", rejectedHandlers_1.disputeSampleRejection);
router.get("/api/v1/sample/disputed/log/single", rejectedHandlers_1.getSampleDisputeLog);
exports.default = router;
