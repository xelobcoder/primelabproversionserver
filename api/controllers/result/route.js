const express = require("express");
const { resultEntry } = require("../../../dist/controllers/result/resultHandlers");
const { handlerTestTotalCasesCount, handlergetTestTotalCasesMonthDaily, handlergetTestMonthlyCountForYear, handlergetAllTestYearlyAnalysis, handlergetTestResultValuesForMonth } = require('../../../dist/controllers/result/resultanalysis');

const router = express.Router();

// router.get(`/api/v1/result/patientrend/single`, getPatientTestTrend);
router.post("/api/v1/result/entry/customtest", resultEntry);



// result analysis

router.get("/api/v1/result/analysis/test", handlerTestTotalCasesCount)
router.get("/api/v1/result/analysis/test/month", handlergetTestTotalCasesMonthDaily)
router.get("/api/v1/result/analysis/test/getTestMonthlyCount", handlergetTestMonthlyCountForYear)
router.get("/api/v1/result/analysis/test/alltest/yearlycount", handlergetAllTestYearlyAnalysis)
router.get("/api/v1/result/analysis/test/resultvalues", handlergetTestResultValuesForMonth)
module.exports = router;
