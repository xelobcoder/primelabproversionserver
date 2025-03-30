"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.q_reorganization_query = exports.q_dropSpecificTablePartition = exports.q_dropTableAllPartition = exports.q_addNewPartition = exports.q_getAllpartiton = exports.deleteBillTransactionQuery = exports.getBillAscesnsion = exports.updateCurrentBill = exports.q_currentDateBilledClientsAllBranches = exports.currentDateBilledClients = exports.billCountDateQ = exports.clientBillInformationQuery = exports.clientPaymentStatusQuery = exports.deleteAscensionidQuery = exports.AddtoTestAscenstionQuery = exports.patientBilledTodayQuery = exports.updateApprovalStatusQuery = exports.insertBillQuery = exports.deleteNewBillPaymentHx = exports.updatebillHistoryQuery = void 0;
exports.updatebillHistoryQuery = "UPDATE billinghx SET paymentMode = ?, Amount = ? WHERE billingid = ?";
exports.deleteNewBillPaymentHx = "DELETE FROM billinghx WHERE billingid = ?";
exports.insertBillQuery = `INSERT INTO billing
               (patientid,
               clinician,
               organization,
               paid_amount,
               payable,
               type,
               outstanding,
               discount,
               branchid,
               taxIncluded,
               taxValue,
               clientstatus,
               testcost,
               employeeid)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
exports.updateApprovalStatusQuery = `UPDATE samplestatus SET approvalstatus = 1 WHERE billingid = ? AND testid = ?`;
exports.patientBilledTodayQuery = "SELECT COUNT(*) AS count FROM billing WHERE patientid = ? AND DATE(billedon) = CURRENT_DATE";
exports.AddtoTestAscenstionQuery = "INSERT INTO test_ascension (testid,billingid,collection,collection_date) VALUES(?,?,?,CURRENT_DATE)";
exports.deleteAscensionidQuery = "DELETE FROM test_ascension WHERE testid = ? AND billingid = ?";
exports.clientPaymentStatusQuery = `SELECT
      SUM(PAID_AMOUNT) AS paidAmount,
          SUM(PAYABLE) AS totalcostincurred,
          CASE
            WHEN SUM(PAID_AMOUNT) = SUM(PAYABLE) THEN 1
            WHEN SUM(PAID_AMOUNT) > SUM(PAYABLE) THEN -1
            WHEN SUM(PAID_AMOUNT) < SUM(PAYABLE) THEN 0
          END AS status
          FROM BILLING
      WHERE PATIENTID = ?`;
exports.clientBillInformationQuery = "SELECT * FROM billing as b  INNER JOIN new_patients as n ON b.PATIENTID = n.PATIENTID WHERE b.BILLINGID = ?";
exports.billCountDateQ = "SELECT COUNT(*) AS count FROM billing WHERE DATE(billedon) = ?";
exports.currentDateBilledClients = `
     SELECT b.billingid,
          CONCAT( np.firstname, ' ', np.middlename, ' ', np.lastname) AS fullname,
          b.paid_amount AS paid,
          b.payable,
          b.patientid,
          b.type,
          b.outstanding,
          b.discount,
          DATE(b.billedon) AS date
        FROM billing AS b
          INNER JOIN new_patients AS np ON np.patientid = b.patientid
          WHERE year  = ? AND month = ? AND day = ? AND branchid =  ?
    ORDER BY b.billingid DESC
    LIMIT ? OFFSET ?`;
exports.q_currentDateBilledClientsAllBranches = `
     SELECT b.billingid,
          CONCAT( np.firstname, ' ', np.middlename, ' ', np.lastname) AS fullname,
          b.paid_amount AS paid,
          b.payable,
          b.patientid,
          b.type,
          b.outstanding,
          b.discount,
          DATE(b.billedon) AS date
        FROM billing AS b
          INNER JOIN new_patients AS np ON np.patientid = b.patientid
          WHERE year  = ? AND month = ? AND day = ? 
    ORDER BY b.billingid DESC
    LIMIT ? OFFSET ?`;
exports.updateCurrentBill = `UPDATE billing  SET testCost = ?, payable = ?, outstanding = ?
    WHERE billingid = ?`;
exports.getBillAscesnsion = `SELECT * FROM test_ascension WHERE billingid = ?`;
exports.deleteBillTransactionQuery = `DELETE FROM billing WHERE billingid = ?`;
exports.q_getAllpartiton = `SELECT * FROM information_schema.partitions WHERE table_name = ?`;
const q_addNewPartition = (partitionName, year, month) => `
    ALTER TABLE billing 
    ADD PARTITION (PARTITION ${partitionName} VALUES LESS THAN (${year}, ${month}));
`;
exports.q_addNewPartition = q_addNewPartition;
exports.q_dropTableAllPartition = `ALTER TABLE billing REMOVE PARTITIONING`;
exports.q_dropSpecificTablePartition = `ALTER TABLE ?? DROP PARTITION ??`;
exports.q_reorganization_query = `ALTER TABLE billing REORGANIZE PARTITION ?? INTO (`;
