const router = require("express").Router();
const { handleNewBilling, canInitiateBill } = require("../../../dist/controllers/billing/controllers");
router.post("/api/v1/billing", handleNewBilling);
router.get("/api/v1/billing/caninitialbill", canInitiateBill)
module.exports = router; 