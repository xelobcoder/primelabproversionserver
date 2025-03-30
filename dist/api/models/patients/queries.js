"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientQuery = void 0;
exports.PatientQuery = {
    getTransactionsByDate: `
    SELECT DATE(billedon) AS TransactionsDate, BILLINGID AS TransactionId
    FROM billing
    WHERE PATIENTID = ?
    ORDER BY billedon DESC
  `,
    updateCredentials: `
    UPDATE patients_credentials
    SET password = ?, updated = 'true'
    WHERE PATIENTID = ?
  `,
    updateNotificationSettings: `
    UPDATE patients_settings
    SET mode = ?, method = ?, notify = ?
    WHERE patientid = ?
  `,
    getPatientBillingRecordsWithPartition: `
    SELECT *
    FROM billing PARTITION(?)
    WHERE patientid = ? AND year BETWEEN ? AND ?
    LIMIT ? OFFSET ?
  `,
    getPatientBillingRecordsStartDate: `
    SELECT *
    FROM billing
    WHERE patientid = ? AND year >= ?
    LIMIT ? OFFSET ?
  `,
    getPatientBillingRecords: `
    SELECT *
    FROM billing
    WHERE patientid = ?
    LIMIT ? OFFSET ?
  `,
};
