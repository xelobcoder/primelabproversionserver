const express = require("express");
const {
  getAllCollections,
  getBillingTest,
  initiateProcessing,
  getAllEnterResult,
  getAllTestPreview,
  getAllPendingCases,
  getUltrasoundWaitingList,
  getProcessedScanList,
} = require("../../../dist/controllers/operations/operationsHandlers");

const router = express.Router();

router.get("/api/v1/operations/collection", getAllCollections);
router.get("/api/v1/operations/test", getBillingTest);
router.put("/api/v1/operations/test/initiateprocessing", initiateProcessing);
router.get("/api/v1/operations/collection/result", getAllEnterResult);
router.get("/api/v1/operations/test/result", getAllTestPreview);
router.get("/api/v1/operation/pendingcases/all", getAllPendingCases);
router.get("/api/v1/operations/imaging/ultrasound", getUltrasoundWaitingList);
router.get("/api/v1/operations/imaging/ultrasound/processed", getProcessedScanList);
module.exports = router;
