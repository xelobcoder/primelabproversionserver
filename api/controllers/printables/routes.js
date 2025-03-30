const express = require("express");
const {
  getResultReady,
  getAdvancedTablesSearch,
  getResultById,
  updatePrintCount,
  getSummaryReadyPage,
  getClientTransactionInfo,
  getClientBulkOutstanding,
  clearClientOutstandingDebt,
  getPaymentModes,
  getClientTransactionHistory,
  updatePayment,
  previewReport,
  getPreviewComments,
  getResultEntryScientist,
  checkApproval,
  makeDecisionOnResult,
  getBillingInvoice,
  // emailBillingReceipt,
  // generatePDFResult,
  getTransactionApprovedTest,
  getBillingReceipt,
} = require("./../../../dist/controllers/printables/handlers");

const router = express.Router();

router.get("/api/v1/result/ready", getResultReady);
router.get("/api/v1/ready/crm/summary/advanced", getAdvancedTablesSearch);
router.get("/api/v1/result/ready/:id", getResultById);
router.post("/api/v1/result/ready/updateprint/count", updatePrintCount);
router.get("/api/v1/result/ready/crm/summary", getSummaryReadyPage);
router.get("/api/v1/billing/payment/info/client", getClientTransactionInfo);
router.get("/api/v1/billing/client/bulk/outstanding", getClientBulkOutstanding);
router.post("/api/v1/billing/client/clear/outstandingdebt", clearClientOutstandingDebt);
router.get("/api/v1/paymentmodes", getPaymentModes);
router.get("/api/v1/billing/client/transactionhx", getClientTransactionHistory);
router.post("/api/v1/billing/payment/update", updatePayment);
router.get("/api/v1/result/preview", previewReport);
router.get("/api/v1/result/preview/comments", getPreviewComments);
router.get("/api/v1/result/preview/entry/scientist", getResultEntryScientist);
router.post("/api/v1/test/result/preview/approved/check", checkApproval);
router.post("/api/v1/result/approve", makeDecisionOnResult);
router.get("/api/v1/billing/invoice", getBillingInvoice);
// router.get("/api/v1/billing/email/receipt", emailBillingReceipt);
// router.get("/billing/result/pdf", generatePDFResult);
router.get("/api/v1/result/printout/approved/test", getTransactionApprovedTest);
router.get("/billing/receipt", getBillingReceipt);

module.exports = router;
