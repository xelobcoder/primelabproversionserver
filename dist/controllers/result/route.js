"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/apiRoutes.ts
const express_1 = __importDefault(require("express"));
const patientHandlers_1 = require("../handlers/patientHandlers");
const creatorHandlers_1 = require("../handlers/creatorHandlers");
const router = express_1.default.Router();
router.get(`/api/v1/result/patientrend/single`, patientHandlers_1.getPatientTestTrend);
router.post("/api/v1/result/entry/customtest", creatorHandlers_1.resultEntry);
exports.default = router;
