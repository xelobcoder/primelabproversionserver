"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionApprovedTestQuery = exports.advancedTablesSearchQueryWithFilters = exports.advancedTablesSearchQueryBase = exports.checkApprovalQuery = exports.makeDecisionOnResultQuery = exports.summaryReadyPageQuery = exports.approvedByUsernameQuery = exports.approvedByQuery = exports.usernameQuery = exports.employeeIdQuery = exports.testNameQuery = exports.updatePrintCountQuery = exports.extrainfoTestQuery = exports.modelQueryWithFilters = exports.modelQueryBase = exports.samplingQuery = void 0;
exports.samplingQuery = `
  SELECT
  ts.ready_date,
  b.clientstatus as urgency,
  ts.collection_date,
  np.patientid,
  ss.approvalstatus,
  ss.ascensionid,
  ts.processing_date,
  br.name AS samplingCenter,
  b.billingid,
  np.GENDER AS gender,
  np.mobile_number AS mobilenumber,
  r.employeeid,
  ts.testid,
  r.USERNAME AS phelobotomist,
  np.GENDER AS gender,
  CASE
    WHEN np.MIDDLENAME IS NULL THEN  CONCAT(np.FIRSTNAME," ",np.LASTNAME)
    WHEN np.MIDDLENAME IS NOT NULL THEN  CONCAT(np.FIRSTNAME, ' ', np.MIDDLENAME, ' ', np.LASTNAME)
  END AS clientname,
  CONCAT(np.age," ",np.agetype) AS age
  FROM test_ascension AS ts
  INNER JOIN billing  AS b ON ts.billingid = b.billingid
  INNER JOIN new_patients AS np ON np.patientid = b.patientid
  INNER JOIN samplestatus AS ss ON ss.billingid = b.billingid
  INNER JOIN roles AS r ON r.employeeid = ss.phelobotomist
  INNER JOIN branch AS br ON br.branchid = b.branchid
  where ts.billingid = ? AND ts.testid = ? GROUP BY ts.billingid LIMIT 1
`;
exports.modelQueryBase = `
  SELECT 
      ta.billingid AS billingid,
 (SELECT COUNT(*) FROM test_ascension WHERE billingid = ta.billingid AND ready = 'false' AND processing = 'true') AS processing,
    (SELECT COUNT(*) FROM test_ascension WHERE billingid = ta.billingid AND ready = 'true') AS completed,
    (SELECT COUNT(*) FROM test_ascension WHERE billingid = ta.billingid AND approvalStatus = 1) AS approved,
    (SELECT COUNT(*) FROM test_ascension WHERE billingid = ta.billingid AND collection = 'false') AS undrawnsamples,
     ta.ready,
     ta.ready_date,
     b.OUTSTANDING AS outstanding,
     b.PAID_AMOUNT AS paid_amount,
     np.PATIENTID AS patientid,
     COUNT(ta.testid) AS readycount,
     (SELECT COUNT(*) FROM test_ascension WHERE billingid = ta.billingid) AS testcount,
  CASE 
    WHEN np.MIDDLENAME IS NULL THEN  CONCAT(np.FIRSTNAME," ",np.LASTNAME)
    WHEN np.MIDDLENAME IS NOT NULL THEN  CONCAT(np.FIRSTNAME, ' ', np.MIDDLENAME, ' ', np.LASTNAME) 
    END AS fullname
  FROM 
     test_ascension AS ta 
     INNER JOIN billing AS b ON b.BILLINGID = ta.billingid
     INNER JOIN new_patients AS np ON b.PATIENTID = np.PATIENTID
  WHERE 
     ta.ready = 'true' and ta.ApprovalStatus = 1
`;
const modelQueryWithFilters = (querydate, content) => {
    let query = exports.modelQueryBase;
    const params = [];
    // Add filters if provided
    if (querydate) {
        query += " AND DATE(ta.ready_date) = ?";
        params.push(querydate);
    }
    else {
        query += " AND DATE(ta.ready_date) = CURDATE()";
    }
    if (content) {
        query += " AND ta.billingid = ?";
        params.push(content);
    }
    query += " GROUP BY ta.billingid ORDER BY ta.billingid DESC LIMIT 100";
    return { query, params };
};
exports.modelQueryWithFilters = modelQueryWithFilters;
exports.extrainfoTestQuery = `
  SELECT  DISTINCT tp.NAME AS name,
                  ta.testid,
                  ta.ready,
                  ta.printedOn,
                  ta.printcount,
                  ta.collection,
                  ta.processing,
                  ta.processing_date,
                  ta.collection_date,
                  ta.approvalstatus,
                  dp.department,
                  ta.id,
                  ta.ready_date
  FROM test_ascension AS ta 
  INNER JOIN test_panels AS tp ON ta.testid = tp.id
  INNER JOIN departments AS dp ON dp.id = tp.category
  WHERE billingid = ?
`;
exports.updatePrintCountQuery = `UPDATE test_ascension SET printcount = ?, printedOn =  NOW() WHERE id = ?`;
exports.testNameQuery = `SELECT * FROM test_panels WHERE id = ?`;
const employeeIdQuery = (tablename) => `SELECT employeeid FROM \`${tablename}\` WHERE billingid = ?`;
exports.employeeIdQuery = employeeIdQuery;
exports.usernameQuery = `SELECT username FROM roles WHERE employeeid = ?`;
exports.approvedByQuery = `SELECT ApprovedBy FROM test_ascension WHERE billingid = ? AND testid = ?`;
exports.approvedByUsernameQuery = `SELECT username FROM roles WHERE employeeid = ?`;
exports.summaryReadyPageQuery = `
  SELECT 
    pt.billedon,
    pt.billingid,
    tt.collection,
    (SELECT COUNT(*) FROM billing WHERE DATE(billedon) = ?) AS registered,
    tt.ready,
    tt.collection_date,
    tt.processing,
    tt.testid,
    tt.ApprovalStatus
  FROM billing AS pt
  INNER JOIN test_ascension AS tt ON tt.billingid = pt.billingid
  WHERE DATE(pt.billedon) = ?
`;
exports.makeDecisionOnResultQuery = `UPDATE test_ascension 
  SET approvalstatus = ?, actionPlan = ?,
  declineMessage = ?,
  approvedby = ?  
  WHERE billingid = ? AND testid = ?`;
exports.checkApprovalQuery = `SELECT approvalstatus FROM test_ascension WHERE billingid = ? AND testid = ?`;
exports.advancedTablesSearchQueryBase = `
  SELECT 
      ta.billingid AS billingid,
      (SELECT COUNT(*) FROM test_ascension WHERE billingid = ta.billingid AND ready = 'false' AND processing = 'true') AS processing,
      (SELECT COUNT(*) FROM test_ascension WHERE billingid = ta.billingid AND ready = 'true') AS completed,
      (SELECT COUNT(*) FROM test_ascension WHERE billingid = ta.billingid AND approvalStatus = 1) AS approved,
      (SELECT COUNT(*) FROM test_ascension WHERE billingid = ta.billingid AND collection = 'false') AS undrawnsamples,
      ta.ready,
      ta.ready_date,
      b.OUTSTANDING AS outstanding,
      b.PAID_AMOUNT AS paid_amount,
      np.PATIENTID AS patientid,
      COUNT(ta.testid) AS readycount,
      (SELECT COUNT(*) FROM test_ascension WHERE billingid = ta.billingid) AS testcount,
    CASE 
      WHEN np.MIDDLENAME IS NULL THEN  CONCAT(np.FIRSTNAME," ",np.LASTNAME)
      WHEN np.MIDDLENAME IS NOT NULL THEN  CONCAT(np.FIRSTNAME, ' ', np.MIDDLENAME, ' ', np.LASTNAME) 
      END AS fullname
    FROM 
      test_ascension AS ta 
      INNER JOIN billing AS b ON b.BILLINGID = ta.billingid
      INNER JOIN new_patients AS np ON b.PATIENTID = np.PATIENTID
    WHERE ta.billingid IS NOT NULL
`;
const advancedTablesSearchQueryWithFilters = (filters) => {
    const { patientid, fullname, mobile, from, to, count, page } = filters;
    let query = exports.advancedTablesSearchQueryBase;
    const values = [];
    if (patientid) {
        query += `AND np.PATIENTID = ${patientid}`;
        values.push(parseInt(patientid));
    }
    if (fullname) {
        query += ` AND CONCAT(np.FIRSTNAME, ' ', np.MIDDLENAME, ' ', np.LASTNAME) LIKE ?`;
        values.push(`%${fullname}%`);
    }
    if (mobile) {
        query += `AND np.mobile_number = ?`;
        values.push(mobile);
    }
    if (from && to) {
        query += ` AND DATE(b.billedon) BETWEEN ? AND ?`;
        values.push(`${from}`);
        values.push(`${to}`);
    }
    if (from && !to) {
        query += ` AND DATE(b.billedon) BETWEEN ? AND CURRENT_DATE`;
        values.push(`${from}`);
    }
    if (!fullname && !from && !mobile && !patientid) {
        query += ` AND DATE(b.billedon) = CURRENT_DATE`;
    }
    query += ` GROUP BY b.billingid ORDER BY b.billingid DESC LIMIT ? OFFSET ?`;
    return { query, values };
};
exports.advancedTablesSearchQueryWithFilters = advancedTablesSearchQueryWithFilters;
exports.transactionApprovedTestQuery = `
  SELECT 
    tp.name,
    ta.testid
  FROM test_ascension AS ta 
  INNER JOIN test_panels AS tp ON tp.id = ta.testid
  WHERE ta.billingid = ? AND ta.approvalStatus = 1
`;
