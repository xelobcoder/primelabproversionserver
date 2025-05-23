"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const handler_1 = require("./handler");
const router = express.Router();
router.get("/api/v1/applicationsettings", handler_1.getApplicationSettings);
router.get("/api/v1/applicationsettings/billing", handler_1.getApplicationSettingsBilling);
router.post("/api/v1/applicationsettings", handler_1.updateApplicationSettings);
router.put("/api/v1/applicationsettings/smsupdate", handler_1.updateSmsSettings);
router.get("/api/v1/applicationsettings/smsupdate", handler_1.getSmsSettings);
router.get("/api/v1/applicationssettings/emailpreference", handler_1.getEmailPreference);
router.get("/api/v1/applicationssettings/email/emailsettings", handler_1.getGeneralEmailSettings);
router.put("/api/v1/applicationssettings/email/emailsettings", handler_1.updateGeneralEmailSettings);
router.post("/api/v1/applicationssettings/emailpreference", handler_1.updateEmailPreference);
router.post("/api/v1/applicationsettings/registration/fields", handler_1.updateRegistrationFields);
router.get("/api/v1/applicationsettings/registration/fields", handler_1.getRegistrationSettings);
router.post("/api/v1/application/tax", handler_1.addTax);
router.get("/api/v1/application/tax", handler_1.getTax);
router.put("/api/v1/application/tax", handler_1.updateTax);
router.put("/api/v1/application/tax/activation", handler_1.changeTaxStatus);
router.delete("/api/v1/application/tax", handler_1.deleteTax);
router.get("/api/v1/applicationsetting/resultsettings", handler_1.getResultSettings);
router.put("/api/v1/applicationsetting/resultsettings", handler_1.updateResultSettings);
exports.default = router;
