"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.q_get_all_test_preview = exports.q_get_all_entered_result = exports.q_ultrasound_processed_list = exports.q_ultrasound_waitingList = exports.q_get_all_result_entry_partitioning = exports.q_get_all_result_entry_base = exports.q_log_result_entry = exports.q_startProcessingTest = exports.q_qualifiedToProcessByDepartment = exports.q_billing_test_collection = exports.q_entered_result_part = exports.q_approved_samples = exports.q_checkbillingid = void 0;
exports.q_checkbillingid = "SELECT * FROM billing WHERE billingid = ?";
exports.q_approved_samples = "SELECT * FROM samplestatus WHERE billingid = ? AND approvalstatus= 1";
exports.q_entered_result_part = `SELECT ta.testid,
                          tp.name,
                          ta.billingid,
                          tp.category,
                          ta.processing,
                          ta.processing_date,
                          ta.ready,
                          ta.ready_date
                        FROM test_ascension as ta
                          INNER JOIN test_panels as tp ON ta.testid = tp.id
                          INNER JOIN departments AS d ON d.id = tp.category
       WHERE ta.billingid = ?`;
exports.q_billing_test_collection = `SELECT ta.testid,
                tp.name,
                ta.billingid,
                tp.category,
                ta.processing,
                ta.processing_date,
                ta.ready,
                ta.ready_date
              FROM test_ascension as ta
                INNER JOIN test_panels as tp ON ta.testid = tp.id
                INNER JOIN departments AS d ON d.id = tp.category
              WHERE ta.billingid = ?`;
exports.q_qualifiedToProcessByDepartment = `SELECT CONCAT(np.firstname,' ',np.middlename,' ',np.lastname) AS fullname,
          np.patientid,
          b.billingid,
          tp.category
        FROM new_patients as np
          INNER JOIN billing as b ON np.patientid = b.patientid
          INNER JOIN test_ascension AS ta ON ta.billingid = b.billingid
          INNER JOIN samplestatus AS ss ON ss.ascensionid = ta.id
          INNER JOIN test_panels AS tp ON tp.ID = ss.testid
          INNER JOIN departments AS d ON d.ID = tp.category
        WHERE ss.approvalstatus = 1 AND DATE(b.billedon) = CURRENT_DATE`;
exports.q_startProcessingTest = `UPDATE test_ascension SET processing_date = NOW(),
    processing = 'true'  WHERE billingid = ? AND testid = ?`;
exports.q_log_result_entry = `UPDATE test_ascension SET ready_date = NOW(),ready = 'true'  WHERE billingid = ? AND testid = ?`;
exports.q_get_all_result_entry_base = `
  SELECT 
    CONCAT(np.firstname, ' ', np.middlename, ' ', np.lastname) AS fullname,
    CONCAT(np.age, " ", np.agetype) AS age,
    np.patientid,
    b.billingid,
    tp.category,
    b.billedon AS billing_date,
    d.department,
    ta.id AS ascensionid,
    tp.name,
    b.clinician,
    ss.approvalstatus,
    ta.ready,
    ta.processing,
    tp.id,
    b.clientstatus,
    CASE WHEN b.organization <> 0 THEN
      (SELECT name FROM organization WHERE id = b.organization)
    END AS organization,
    CASE WHEN b.clinician <> 0 THEN
      (SELECT name FROM clinicianbasicinfo WHERE id = b.clinician)
    END AS clinicianName
  FROM new_patients AS np
  INNER JOIN {billing_table} AS b ON np.patientid = b.patientid
  INNER JOIN {asc_table} AS ta ON ta.billingid = b.billingid
  INNER JOIN samplestatus AS ss ON ss.ascensionid = ta.id
  INNER JOIN test_panels AS tp ON tp.id = ss.testid
  INNER JOIN departments AS d ON d.id = tp.category
  WHERE ss.approvalstatus = 1
    AND ta.collection = 'true'
    AND d.department <> 'ultrasound'
`;
exports.q_get_all_result_entry_partitioning = `SELECT 
    CONCAT(np.firstname, ' ', np.middlename, ' ', np.lastname) AS fullname,
    CONCAT(np.age, " ", np.agetype) AS age,
    np.patientid,
    b.billingid,
    b.billedon AS billing_date,
    tp.category,
    ta.id AS acensionid,
    d.department,
    tp.name,
    b.clinician,
    ss.approvalstatus,
    ta.ready,
    ta.processing,
    tp.id,
    b.clientstatus,
    CASE WHEN b.organization <> 0 THEN
      (SELECT name FROM organization WHERE id = b.organization)
    END AS organization,
    CASE WHEN b.clinician <> 0 THEN
      (SELECT name FROM clinicianbasicinfo WHERE id = b.clinician)
    END AS clinicianName
  FROM new_patients AS np
  INNER JOIN (
    SELECT * FROM billing PARTITION ({billing_table})
  ) AS b ON np.patientid = b.patientid
  INNER JOIN (
    SELECT * FROM test_ascension PARTITION ({asc_table})
  ) AS ta ON ta.billingid = b.billingid
  INNER JOIN samplestatus AS ss ON ss.ascensionid = ta.id
  INNER JOIN test_panels AS tp ON tp.id = ss.testid
  INNER JOIN departments AS d ON d.id = tp.category
  WHERE ss.approvalstatus = 1
    AND ta.collection = 'true'
    AND d.department <> 'ultrasound'

`;
exports.q_ultrasound_waitingList = `SELECT DISTINCT
          np.patientid,
          b.billingid,
          CONCAT( np.firstname,' ',np.middlename,' ',np.lastname) AS fullname,
          b.billedon,
          tp.name,
          tp.id AS testid,
          tp.category,
          d.department
  FROM new_patients as np
    INNER JOIN billing as b ON np.patientid = b.patientid
    INNER JOIN test_ascension AS ta ON ta.billingid = b.billingid
    INNER JOIN samplestatus AS ss ON ss.ascensionid = ta.id
    INNER JOIN test_panels AS tp ON tp.id = ta.testid
    INNER JOIN departments AS d ON d.id = tp.category
  WHERE  d.department = 'ultrasound' AND ta.ready = 'false' LIMIT ? OFFSET ?`;
exports.q_ultrasound_processed_list = `SELECT DISTINCT
        np.patientid,
        b.billingid,
        CONCAT(np.firstname, ' ', np.middlename, ' ', np.lastname) AS fullname,
        b.billedon,
        tp.name,
        tp.id AS testid,
        tp.category,
        ta.ready,
        d.department
      FROM new_patients AS np
      INNER JOIN billing AS b ON np.PATIENTID = b.patientid
      INNER JOIN test_ascension AS ta ON ta.billingid = b.billingid
      INNER JOIN samplestatus AS ss ON ss.ascensionid = ta.id
      INNER JOIN test_panels AS tp ON tp.id = ta.testid
      INNER JOIN departments AS d ON d.id = tp.category
      ?
      ORDER BY b.BILLINGID ASC
      LIMIT ? OFFSET ?
    `;
exports.q_get_all_entered_result = `SELECT  CONCAT(np.firstname,' ',np.middlename,' ',np.lastname) AS fullname,
          np.PATIENTID AS patientid,
          np.gender,
          b.BILLINGID AS billingid,
          ta.id AS ascensionid,
          b.billedon AS billing_date,
          tp.CATEGORY AS category
        FROM new_patients as np
          INNER JOIN billing as b ON np.PATIENTID = b.PATIENTID
          INNER JOIN samplestatus AS ss ON ss.billingid = b.BILLINGID
          INNER JOIN test_ascension AS ta ON ta.billingid = b.BILLINGID
          INNER JOIN test_panels AS tp ON tp.ID = ss.testid
          INNER JOIN departments AS d ON d.ID = tp.CATEGORY`;
exports.q_get_all_test_preview = `SELECT ta.testid,
            tp.NAME,
            ta.billingid,
            tp.CATEGORY,
            ta.processing,
            ta.processing_date,
            ta.ready,
            ta.ready_date
          FROM test_ascension as ta
            INNER JOIN test_panels as tp ON ta.testid = tp.ID
            INNER JOIN departments AS d ON d.id = tp.CATEGORY
          WHERE ta.billingid = ?`;
