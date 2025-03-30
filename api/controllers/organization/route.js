const { Router } = require('express');
const organizationHandlers = require('../../../dist/controllers/organization/handlers');
const { createOrganizationOutSource, updateOrganizationOutSource, getOrganizationOutSource, updateOrganizationOutSourceServices, getOrganizationOutSourceServices, getOrganizationOutSourceBasic, getOrganizationOutsourcingAll } = require("../../../dist/controllers/organization/outsourceHandlers");
const { organizationImageUpload } = require('../../../dist/controllers/organization/uploadImages');


const router = Router();
router.get("/api/v1/organization", organizationHandlers.getOrganizations);
router.get("/api/v1/organization/basic", organizationHandlers.getOrganizationsBasic);
router.get("/api/v1/organization/contactperson", organizationHandlers.getOrganizationsContact);
router.get("/api/v1/organization/payment", organizationHandlers.getOrganizationsPayment);
router.get("/api/v1/organization/daily", organizationHandlers.dailyOrganizationCommission);
router.get("/api/v1/organization/monthly", organizationHandlers.getOrganizationCommissionByMonth);
router.get(`/api/v1/organization/profile/image`, organizationHandlers.getOrganizationImage)
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
router.post(`/api/v1/organization/profile/image`, organizationImageUpload, organizationHandlers.uploadOrganizationProfilePicture);
router.post("/api/v1/organization/billing/test", organizationHandlers.createOrganizationPricingHandler)
router.get("/api/v1/organization/billing/test", organizationHandlers.getOrganizationPricingHandler)



// ROUTES FOR OUTSOURCING ORGANIZATIONS



router.post("/api/v1/outsourcing/organization", createOrganizationOutSource);
router.put("/api/v1/outsourcing/organization/services", updateOrganizationOutSourceServices);
router.put("/api/v1/outsourcing/organization", updateOrganizationOutSource);
router.get("/api/v1/outsourcing/organization/services", getOrganizationOutSourceServices);
router.get("/api/v1/outsourcing/organization/all", getOrganizationOutsourcingAll);
// router.post("/api/v1/outsourcing/organization", );
router.get("/api/v1/outsourcing/organization", getOrganizationOutSourceBasic)








module.exports = router;