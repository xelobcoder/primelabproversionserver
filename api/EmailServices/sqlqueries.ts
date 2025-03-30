export const SELECT_EMAIL_NOTIFICATION = `SELECT emailNotification FROM applicationsettings`;

export const SELECT_EMAIL_PREFERENCE = `SELECT * FROM emailpreference`;

export const SELECT_EMAIL_LOG = `SELECT * FROM emaillog WHERE id BETWEEN ? AND ? ORDER BY id DESC LIMIT ?`;

export const SELECT_TEMP_CLINICIAN_CREDENTIALS = `SELECT * FROM clinicianscredentials WHERE clinicianid = ?`;

export const SELECT_STAFF_EMAIL = `SELECT * FROM roles WHERE email LIKE ? AND emailAuthenticated = 'true'`;

export const SELECT_CLIENTS_EMAIL = `SELECT * FROM new_patients AS np INNER JOIN patients_settings AS pt ON pt.patientid = np.patientid WHERE np.email LIKE ? AND emailAuthenticated = 'true'`;

export const SELECT_ALL_CLIENTS_EMAIL = `SELECT email FROM new_patients`;

export const SELECT_ALL_STAFF_EMAIL = `SELECT email FROM roles`;

export const INSERT_COMPOSED_EMAIL = `INSERT INTO composedemails (subject,body,employeeid) VALUES(?,?,?)`;

export const UPDATE_COMPOSED_EMAIL = `UPDATE composedemails SET subject = ?, body = ?, employeeid = ? WHERE id = ?`;

export const UPDATE_EMAIL_TARGET = `UPDATE composedemails SET target = ?, ispublished = ?, scheduledate = ? WHERE id = ?`;

export const SELECT_BULK_EMAILS = `SELECT email FROM {table}`;

export const SELECT_COMPOSED_EMAILS = `SELECT {mode} FROM composedemails`;

export const SELECT_EMAIL_SUMMARY_BY_DAY = `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date, COUNT(id) AS total,
  SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS failed,
  SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) AS success FROM emaillog GROUP BY DATE_FORMAT(date, '%Y-%m-%d')`;

export const SELECT_EMAIL_SUMMARY = `SELECT COUNT(id) AS total,
  SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS failed,
  SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) AS success FROM emaillog`;

export const SELECT_PATIENT_AUTHENTICATION = `SELECT * FROM patients_settings WHERE PATIENTID = ?`;

export const SELECT_CLINICIAN_AUTHENTICATION = `SELECT * FROM clinicianscredentials WHERE clinicianid = ?`;

export const UPDATE_PATIENT_AUTH_MODE = `UPDATE patients_settings SET authenticationMode = 'email', emailAuthenticated = 'true' WHERE patientid = ?`;

export const UPDATE_CLINICIAN_AUTH_MODE = `UPDATE clinicianscredentials SET authenticationMode = 'email', isAuthenticated = 1, authenticatedon = NOW() WHERE clinicianid = ?`;
