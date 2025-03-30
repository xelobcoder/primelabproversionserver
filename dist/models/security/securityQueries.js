"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queries = void 0;
exports.queries = {
    insertLoginHistory: `
    INSERT INTO loginlogs (employeeid, loginSessionId, logoutTime, browserInformation)
    VALUES (?, ?, ?, ?)
  `,
    getCurrentUserLoginSessions: `
    SELECT * FROM sessionTracker
    WHERE logoutTime > ? AND employeeid = ?
  `,
    getCurrentUserLoginSessionsWithDetails: `
    SELECT * FROM sessionTracker AS st
    INNER JOIN loginLogs AS ll ON ll.employeeid = st.employeeid
    WHERE st.logoutTime > ? AND st.employeeid = ? AND ll.loggedout = 0
  `,
    destroyUserSessionsSelect: `
    SELECT * FROM sessionTracker WHERE employeeid = ?
  `,
    destroyUserSessionsDelete: `
    DELETE FROM sessionTracker WHERE employeeid = ?
  `,
    updateLoginLogs: `
    UPDATE loginlogs SET loggedout = 1, actualLogout = ? WHERE keyid = ?
  `,
    getEmployeeLoginHistory: `
    SELECT * FROM loginlogs WHERE employeeid = ? OFFSET ? LIMIT ?
  `,
    getEmployeeLastLoginSession: `
    SELECT * FROM loginlogs WHERE employeeid = ? ORDER BY id DESC
  `,
    getGeneralLoginHistory: `
    SELECT 
      ll.browserInformation,
      ll.employeeid,
      rl.username,
      ll.logoutTime,
      ll.actualLogout,
      ll.loggedout,
      ll.loginTime
    FROM loginlogs AS ll
    INNER JOIN roles AS rl ON rl.employeeid = ll.employeeid
    ORDER BY keyid DESC LIMIT ? OFFSET ?
  `,
    getDboSystemSecurity: `
    SELECT * FROM dbo.systemsecurity
  `,
};
