export const checkTaxNameExistQuery = `SELECT * FROM tax WHERE name = ?`;
export const addTaxQuery = `INSERT INTO tax (name, value) VALUES (?, ?)`;
export const getAllTaxesQuery = `SELECT * FROM tax`;
export const updateTaxQuery = `UPDATE Tax SET name = ?, value = ? WHERE id = ?`;
export const changeTaxStatusQuery = `UPDATE Tax SET apply = ? WHERE id = ?`;
export const deleteTaxQuery = `DELETE FROM tax WHERE id = ?`;
