export const SELECT_ROLE_BY_EMAIL = `SELECT * FROM roles WHERE email = ?`;
export const INSERT_USER = `INSERT INTO roles (username, password, role, email, branch) VALUES (?, ?, ?, ?, ?)`;
export const SELECT_USER_BY_EMAIL = `SELECT * FROM roles WHERE email = ?`;
export const SELECT_BRANCH_NAME_BY_ID = `SELECT name FROM branch WHERE branchid = ?`;
export const SELECT_ROLE_BY_EMPLOYEE_ID = `SELECT role FROM roles WHERE employeeid = ?`;
export const SELECT_USER_BY_EMPLOYEE_ID = `SELECT * FROM roles WHERE employeeid = ?`;
export const SELECT_USERDATA_BY_EMPLOYEE_ID = `SELECT * FROM roles WHERE employeeid = ?`;