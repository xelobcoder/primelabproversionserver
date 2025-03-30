"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const organizationHandlers = __importStar(require("./handlers"));
const outsourceHandlers_1 = require("./outsourceHandlers");
const router = (0, express_1.Router)();
router.get("/api/v1/organization", organizationHandlers.getOrganizations);
router.get("/api/v1/organization/basic", organizationHandlers.getOrganizationsBasic);
router.get("/api/v1/organization/contactperson", organizationHandlers.getOrganizationsContact);
router.get("/api/v1/organization/payment", organizationHandlers.getOrganizationsPayment);
router.get("/api/v1/organization/daily", organizationHandlers.dailyOrganizationCommission);
router.get("/api/v1/organization/monthly", organizationHandlers.getOrganizationCommissionByMonth);
router.get("/api/v1/organization/id", organizationHandlers.getOrganizationId);
router.get("/api/v1/organization/performance/top", organizationHandlers.getTopPerformance);
router.get("/api/v1/organization/detail/report/monthly", organizationHandlers.generateMonthlySalesReport);
router.get("/api/v1/organizations/details", organizationHandlers.getOrganizationWithDetails);
router.post("/api/v1/new/organizations", organizationHandlers.createAOrganization);
router.put("/api/v1/organization/update/basic", organizationHandlers.updateOrganizationBasic);
router.put("/api/v1/organization/update/contact", organizationHandlers.updateOrganizationContact);
router.put("/api/v1/organization/update/payment", organizationHandlers.updateOrganizationPayment);
router.post("/api/v1/new/organization/images", organizationHandlers.upload);
router.delete("/api/v1/organization", organizationHandlers.deleteOrganization);
// ROUTES FOR OUTSOURCING ORGANIZATIONS
router.get("/api/v1/outsourcing/organization", outsourceHandlers_1.createOrganizationOutSource);
router.get("/api/v1/outsourcing/organization/services", createOrganizationServices);
exports.default = router;
