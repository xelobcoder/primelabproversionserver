export const q_dailySalesSummary: string = `SELECT SUM(payable) AS salesAmount, COUNT(billingid) AS totalCases, SUM(discount) AS discount, SUM(paid_amount) AS totalAmountReceived, b.billedon AS date,     DAY(b.billedon) AS 'Day' FROM billing  WHERE DATE(billedon) = ?`;

export const q_MonthWeeklySalesSummary: string = ` SELECT
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

export const q_MonthWeeklySalesSummaryPartition: string = `SELECT  OVER PARTITION(?)
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
