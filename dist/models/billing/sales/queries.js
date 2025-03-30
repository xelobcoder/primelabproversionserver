"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.q_MonthWeeklySalesSummaryPartition = exports.q_MonthWeeklySalesSummary = exports.q_dailySalesSummary = void 0;
exports.q_dailySalesSummary = `SELECT SUM(payable) AS salesAmount, COUNT(billingid) AS totalCases, SUM(discount) AS discount, SUM(paid_amount) AS totalAmountReceived, b.billedon AS date,     DAY(b.billedon) AS 'Day' FROM billing  WHERE DATE(billedon) = ?`;
exports.q_MonthWeeklySalesSummary = ` SELECT
        SUM(payable) AS salesAmount,
        CASE
            WHEN DAY(b.billedon) BETWEEN 1 AND 7 THEN 'First Week'
            WHEN DAY(b.billedon) BETWEEN 8 AND 14 THEN 'Second Week'
            WHEN DAY(b.billedon) BETWEEN 15 AND 21 THEN 'Third Week'
            WHEN DAY(b.billedon) BETWEEN 22 AND 31 THEN 'Fourth Week'
        END AS 'Week',
        COUNT(b.BILLINGID) AS totalCases
      FROM billing AS b
      WHERE YEAR = YEAR(CURRENT_DATE)
      AND MONTH = MONTH(CURRENT_DATE)`;
exports.q_MonthWeeklySalesSummaryPartition = `SELECT  OVER PARTITION(?)
        SUM(payable) AS salesAmount,
        CASE
            WHEN DAY(b.billedon) BETWEEN 1 AND 7 THEN 'First Week'
            WHEN DAY(b.billedon) BETWEEN 8 AND 14 THEN 'Second Week'
            WHEN DAY(b.billedon) BETWEEN 15 AND 21 THEN 'Third Week'
            WHEN DAY(b.billedon) BETWEEN 22 AND 31 THEN 'Fourth Week'
        END AS 'Week',
        COUNT(b.BILLINGID) AS totalCases
      FROM billing AS b
      WHERE YEAR = YEAR(CURRENT_DATE)
      AND MONTH = MONTH(CURRENT_DATE)`;
