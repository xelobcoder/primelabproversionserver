"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const handler_1 = require("./handler");
const router = (0, express_1.Router)();
router.get("/api/v1/sales/summary/general", handler_1.handleGeneralSalesSummary);
router.get("/api/v1/summary/daily", handler_1.handleDailySummary);
exports.default = router;
