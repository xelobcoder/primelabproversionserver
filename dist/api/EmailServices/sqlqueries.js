"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPDATE_CLINICIAN_AUTH_MODE = exports.UPDATE_PATIENT_AUTH_MODE = exports.SELECT_CLINICIAN_AUTHENTICATION = exports.SELECT_PATIENT_AUTHENTICATION = exports.SELECT_EMAIL_SUMMARY = exports.SELECT_EMAIL_SUMMARY_BY_DAY = exports.SELECT_COMPOSED_EMAILS = exports.SELECT_BULK_EMAILS = exports.UPDATE_EMAIL_TARGET = exports.UPDATE_COMPOSED_EMAIL = exports.INSERT_COMPOSED_EMAIL = exports.SELECT_ALL_STAFF_EMAIL = exports.SELECT_ALL_CLIENTS_EMAIL = exports.SELECT_CLIENTS_EMAIL = exports.SELECT_STAFF_EMAIL = exports.SELECT_TEMP_CLINICIAN_CREDENTIALS = exports.SELECT_EMAIL_LOG = exports.SELECT_EMAIL_PREFERENCE = exports.SELECT_EMAIL_NOTIFICATION = void 0;
exports.SELECT_EMAIL_NOTIFICATION = `SELECT emailNotification FROM applicationsettings`;
exports.SELECT_EMAIL_PREFERENCE = `SELECT * FROM emailpreference`;
exports.SELECT_EMAIL_LOG = `SELECT * FROM emaillog WHERE id BETWEEN ? AND ? ORDER BY id DESC LIMIT ?`;
exports.SELECT_TEMP_CLINICIAN_CREDENTIALS = `SELECT * FROM clinicianscredentials WHERE clinicianid = ?`;
exports.SELECT_STAFF_EMAIL = `SELECT * FROM roles WHERE email LIKE ? AND emailAuthenticated = 'true'`;
exports.SELECT_CLIENTS_EMAIL = `SELECT * FROM new_patients AS np INNER JOIN patients_settings AS pt ON pt.patientid = np.patientid WHERE np.email LIKE ? AND emailAuthenticated = 'true'`;
exports.SELECT_ALL_CLIENTS_EMAIL = `SELECT email FROM new_patients`;
exports.SELECT_ALL_STAFF_EMAIL = `SELECT email FROM roles`;
exports.INSERT_COMPOSED_EMAIL = `INSERT INTO composedemails (subject,body,employeeid) VALUES(?,?,?)`;
exports.UPDATE_COMPOSED_EMAIL = `UPDATE composedemails SET subject = ?, body = ?, employeeid = ? WHERE id = ?`;
exports.UPDATE_EMAIL_TARGET = `UPDATE composedemails SET target = ?, ispublished = ?, scheduledate = ? WHERE id = ?`;
exports.SELECT_BULK_EMAILS = `SELECT email FROM {table}`;
exports.SELECT_COMPOSED_EMAILS = `SELECT {mode} FROM composedemails`;
exports.SELECT_EMAIL_SUMMARY_BY_DAY = `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date, COUNT(id) AS total,
  SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS failed,
  SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) AS success FROM emaillog GROUP BY DATE_FORMAT(date, '%Y-%m-%d')`;
exports.SELECT_EMAIL_SUMMARY = `SELECT COUNT(id) AS total,
  SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS failed,
  SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) AS success FROM emaillog`;
exports.SELECT_PATIENT_AUTHENTICATION = `SELECT * FROM patients_settings WHERE PATIENTID = ?`;
exports.SELECT_CLINICIAN_AUTHENTICATION = `SELECT * FROM clinicianscredentials WHERE clinicianid = ?`;
exports.UPDATE_PATIENT_AUTH_MODE = `UPDATE patients_settings SET authenticationMode = 'email', emailAuthenticated = 'true' WHERE patientid = ?`;
exports.UPDATE_CLINICIAN_AUTH_MODE = `UPDATE clinicianscredentials SET authenticationMode = 'email', isAuthenticated = 1, authenticatedon = NOW() WHERE clinicianid = ?`;
