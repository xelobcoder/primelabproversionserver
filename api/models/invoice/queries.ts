export const testInformationQuery = `SELECT price, name FROM test_panels WHERE ID IN (SELECT testid FROM test_ascension WHERE BILLINGID = ?)`;

export const clientInformationQuery = `
  SELECT 
    CONCAT(np.FIRSTNAME, " ", np.MIDDLENAME, " ", np.LASTNAME) AS fullname,
    age,
    agetype,
    billingid,
    date,
    paid_amount,
    discount,
    payable,
    testcost,
    (taxValue + testcost) AS total,
    taxValue,
    mobile_number,
    outstanding,
    gender,
    email,
    dob
  FROM billing AS bb
  INNER JOIN new_patients AS np ON np.PATIENTID = bb.PATIENTID
  WHERE bb.BILLINGID = ?`;
