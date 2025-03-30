export const samplingQuery = `
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

export const modelQueryBase = `
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

export const modelQueryWithFilters = (querydate, content) => {
  let query = modelQueryBase;
  const params = [];

  // Add filters if provided
  if (querydate) {
    query += " AND DATE(ta.ready_date) = ?";
    params.push(querydate);
  } else {
    query += " AND DATE(ta.ready_date) = CURDATE()";
  }

  if (content) {
    query += " AND ta.billingid = ?";
    params.push(content);
  }

  query += " GROUP BY ta.billingid ORDER BY ta.billingid DESC LIMIT 100";
  return { query, params };
};

export const extrainfoTestQuery = `
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

export const updatePrintCountQuery = `UPDATE test_ascension SET printcount = ?, printedOn =  NOW() WHERE id = ?`;

export const testNameQuery = `SELECT * FROM test_panels WHERE id = ?`;

export const employeeIdQuery = (tablename) => `SELECT employeeid FROM \`${tablename}\` WHERE billingid = ?`;

export const usernameQuery = `SELECT username FROM roles WHERE employeeid = ?`;

export const approvedByQuery = `SELECT ApprovedBy FROM test_ascension WHERE billingid = ? AND testid = ?`;

export const approvedByUsernameQuery = `SELECT username FROM roles WHERE employeeid = ?`;

export const summaryReadyPageQuery = `
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

export const makeDecisionOnResultQuery = `UPDATE test_ascension 
  SET approvalstatus = ?, actionPlan = ?,
  declineMessage = ?,
  approvedby = ?  
  WHERE billingid = ? AND testid = ?`;

export const checkApprovalQuery = `SELECT approvalstatus FROM test_ascension WHERE billingid = ? AND testid = ?`;

export const advancedTablesSearchQueryBase = `
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

export const advancedTablesSearchQueryWithFilters = (filters) => {
  const { patientid, fullname, mobile, from, to, count, page } = filters;
  let query = advancedTablesSearchQueryBase;
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

export const transactionApprovedTestQuery = `
  SELECT 
    tp.name,
    ta.testid
  FROM test_ascension AS ta 
  INNER JOIN test_panels AS tp ON tp.id = ta.testid
  WHERE ta.billingid = ? AND ta.approvalStatus = 1
`;

