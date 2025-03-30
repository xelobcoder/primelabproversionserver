export const getRoleQuery = `
  SELECT * FROM roles WHERE employeeid = ?
`;

export const getReadyForApprovalsQuery = `
  SELECT
    ta.testid,
    ta.billingid,
    bb.clientstatus AS urgency,
    tt.name,
    ta.declineMessage,
    ta.approvedby,
    ta.approvalstatus,
    ta.actionPlan,
    bb.patientid,
    dp.department,
    CASE
      WHEN np.middlename IS NULL THEN CONCAT(np.firstname, " ", np.lastname)
      ELSE CONCAT(np.firstname, " ", np.middlename, " ", np.lastname)
    END AS fullname
  FROM
    test_ascension AS ta
    INNER JOIN billing AS bb ON bb.billingid = ta.billingid
    INNER JOIN new_patients AS np ON np.patientid = bb.patientid
    INNER JOIN test_panels AS tt ON tt.ID = ta.testid
    INNER JOIN departments AS dp ON dp.id = tt.category
  WHERE
    ta.ready = 'true'
    AND ta.ApprovalStatus = 0
    AND ta.declineMessage IS NULL
`;

export const insertApprovalQuery = `
  UPDATE test_ascension
  SET ApprovalStatus = ?,
      ApprovedBy = ?,
      DeclineMessage = ?
  WHERE billingid = ? AND testid = ?
`;
