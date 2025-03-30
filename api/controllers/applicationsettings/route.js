const express = require('express');
const  {
  getApplicationSettings,
  getApplicationSettingsBilling,
  updateApplicationSettings,
  updateSmsSettings,
  getSmsSettings,
  getEmailPreference,
  getGeneralEmailSettings,
  updateGeneralEmailSettings,
  updateEmailPreference,
  updateRegistrationFields,
  getRegistrationSettings,
  addTax,
  getTax,
  updateTax,
  changeTaxStatus,
  deleteTax,
  getResultSettings,
  updateResultSettings,
}  = require("../../../dist/controllers/applicationsettings/handler");

const router = express.Router();

router.get("/api/v1/applicationsettings", getApplicationSettings);
router.get("/api/v1/applicationsettings/billing", getApplicationSettingsBilling);
router.post("/api/v1/applicationsettings", updateApplicationSettings);
router.put("/api/v1/applicationsettings/smsupdate", updateSmsSettings);
router.get("/api/v1/applicationsettings/smsupdate", getSmsSettings);
router.get("/api/v1/applicationssettings/emailpreference", getEmailPreference);
router.get("/api/v1/applicationssettings/email/emailsettings", getGeneralEmailSettings);
router.put("/api/v1/applicationssettings/email/emailsettings", updateGeneralEmailSettings);
router.post("/api/v1/applicationssettings/emailpreference", updateEmailPreference);
router.post("/api/v1/applicationsettings/registration/fields", updateRegistrationFields);
router.get("/api/v1/applicationsettings/registration/fields", getRegistrationSettings);
router.post("/api/v1/application/tax", addTax);
router.get("/api/v1/application/tax", getTax);
router.put("/api/v1/application/tax", updateTax);
router.put("/api/v1/application/tax/activation", changeTaxStatus);
router.delete("/api/v1/application/tax", deleteTax);
router.get("/api/v1/applicationsetting/resultsettings", getResultSettings);
router.put("/api/v1/applicationsetting/resultsettings", updateResultSettings);

module.exports = router;