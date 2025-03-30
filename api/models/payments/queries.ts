export const queries = {
  getClientTransactionInformation: `
    SELECT 
      np.PATIENTID AS patientid,
      CONCAT(np.FIRSTNAME,' ',np.MIDDLENAME,' ',np.LASTNAME) AS fullname,
      np.EMAIL AS email,
      CONCAT(0,np.MOBILE_NUMBER) AS mobileNumber,
      b.BILLINGID AS billingid,
      b.OUTSTANDING AS outstanding,
      b.DISCOUNT AS discount,
      b.PAID_AMOUNT AS paid_amount,
      b.PAYABLE AS payable,
      DATE(b.billedon) as date
    FROM new_patients AS np
    INNER JOIN billing as b ON np.patientid = b.patientid
  `,
  getClientFullOutstanding: `
    SELECT SUM(PAID_AMOUNT) AS paid, SUM(PAYABLE) AS total 
    FROM billing 
    WHERE PATIENTID = ?
  `,
  getTransactionData: `
    SELECT * 
    FROM billing AS b 
    INNER JOIN new_patients AS np ON b.patientid = np.patientid 
    WHERE np.patientid = ?
  `,
  allClientDebtTransactions: `
    SELECT 
      billedon AS date,
      billingid,
      outstanding,
      paid_amount AS paid,
      payable,
      discount
    FROM billing 
    WHERE patientid = ?
    AND outstanding > 0
  `,
  updateSingleTransactionDebt: `
    UPDATE billing 
    SET PAID_AMOUNT = ?, OUTSTANDING = ? 
    WHERE BILLINGID = ?
  `,
  updateTransactionHx: `
    INSERT INTO billingHx (BILLINGID, paymentmode, amount, employeeid) 
    VALUES (?,?,?,?)
  `,
  updatePayment: `
    SELECT * 
    FROM BILLING 
    WHERE billingid = ?
  `,
  updatePaymentUpdate: `
    UPDATE BILLING 
    SET outstanding = ?, paid_amount = ?
    WHERE billingid = ?
  `,
  insertBillingHx: `
    INSERT INTO billingHx (BILLINGID, paymentmode, amount) 
    VALUES (?,?,?)
  `,
  paymentMode: `
    SELECT * 
    FROM paymentmodes
  `,
  specificBillTransactionHx: `
    SELECT * 
    FROM billingHx 
    WHERE BILLINGID = ?  
    ORDER BY KeyID DESC
  `,
};
