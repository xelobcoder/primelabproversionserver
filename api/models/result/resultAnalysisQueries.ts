export const q_test_month_case_count_by_day = `SELECT COUNT(*) AS caseCount FROM test_ascension AS ta INNER JOIN billing AS b ON ta.billingid = b.billingid WHERE ta.testid = ? AND ta.month  = ? AND DAY(b.billedon) = ?`;

export const q_test_month_case_count = `SELECT COUNT(*) AS caseCount FROM test_ascension WHERE testid = ? AND month = ?`;

export const q_test_month_case_count_year = `SELECT COUNT(*) AS caseCount FROM test_ascension  WHERE testid = ? AND year = ?`;