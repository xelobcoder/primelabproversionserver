const SQLQueries = {
  getAllClinicians: "SELECT * FROM clinicianbasicinfo",


  getClinicianBasicInfo: `SELECT * FROM clinicianBasicInfo WHERE id = ?`,

  getCliniciansWithPagination: "SELECT * FROM clinicianbasicinfo LIMIT ? OFFSET ?",

  updateClinicianBasicInfo: `UPDATE clinicianbasicinfo SET NAME = ?, PHONE = ?, EMAIL = ?, LOCATION = ?,
     ADDRESS = ?,OCCUPATION = ? WHERE ID = ?`,

  deleteClinicianById: "DELETE FROM clinicianbasicinfo WHERE id = ?",

  insertClinicianBasicInfo: `INSERT INTO clinicianbasicinfo 
            (name,phone,email,location,address,
            occupation,organization) 
            VALUES (?,?,?,?,?,?,?)`,
  getSingleClinicianById: "SELECT * FROM clinicianbasicinfo WHERE ID = ?",

  getTopPerformingClinicians: `
    SELECT DISTINCT c.ID AS id,
      c.NAME AS name,
      c.COMMISSION AS commissionRate,
      c.COMMISSION / 100 * (
        SELECT SUM(b.PAYABLE)
        WHERE c.ID = c.ID
      ) AS commissionEarned,
      SUM(b.payable) AS TotalSales
    FROM clinician AS c
    INNER JOIN BILLING AS b ON b.CLINICIAN = c.ID
    GROUP BY c.ID, c.NAME ORDER BY TotalSales DESC
    LIMIT ?`,

  getClinicianResult: `
    SELECT 
      b.billingid,
      np.patientid,
      tp.name,
      tt.testid,
      tt.approvalStatus AS approval,
      tt.collection,
      tt.ready,
      tt.processing,
      np.firstname,
      np.lastname,
      np.middlename,
      b.clinician,
      b.billedon
    FROM test_ascension AS tt 
    INNER JOIN billing AS b ON tt.billingid = b.billingid
    INNER JOIN new_patients AS np ON np.patientid = b.patientid 
    INNER JOIN test_panels AS tp ON tp.ID = tt.testid
    WHERE b.clinician = ?
    AND DATE(b.billedon) BETWEEN ? AND ?`,

  getBillingTestBasedByClinician: `
    SELECT 
      b.billingid,
      np.patientid,
      tp.name,
      tt.testid,
      tt.approvalStatus AS approval,
      tt.collection,
      tt.ready,
      tt.processing,
      np.firstname,
      np.lastname,
      np.middlename,
      b.clinician,
      b.billedon
    FROM test_ascension AS tt 
    INNER JOIN billing AS b ON tt.billingid = b.billingid
    INNER JOIN new_patients AS np ON np.patientid = b.patientid 
    INNER JOIN test_panels AS tp ON tp.ID = tt.testid
    WHERE b.clinician = ?
    AND b.billingid = ?`,
};

export default SQLQueries;
