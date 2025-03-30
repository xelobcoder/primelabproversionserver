export const NEWSUPPLIERQUERY = `INSERT INTO supplier (name,address,email,contactperson,region,phonenumber) VALUES (?,?,?,?,?,?)`;
export const GETSUPPLIERSQUERY = `SELECT * FROM supplier ORDER BY supplierid DESC LIMIT ? OFFSET ?`;
export const UPDATESUPPLIERQUERY = `UPDATE supplier SET name = ?, address = ?, region = ?, contactperson = ?, email = ?, phonenumber = ? WHERE supplierid = ?`;
export const GETSUPPLIER_BY_CONTACT_OR_EMAIL = `SELECT * FROM supplier WHERE phonenumber = ? OR email = ?`;
export const GET_PENDING_ORDERS = `SELECT * FROM orders WHERE receiveddate IS NULL AND supplierid = ?`;
export const INSERT_COMMODITY = `INSERT INTO commodity (COMMODITY, CATEGORY) VALUES (?,?)`;
export const GET_COMMODITIES = `SELECT * FROM commodity GROUP BY comid LIMIT ? OFFSET ?`;
