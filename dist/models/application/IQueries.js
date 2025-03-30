"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTaxQuery = exports.changeTaxStatusQuery = exports.updateTaxQuery = exports.getAllTaxesQuery = exports.addTaxQuery = exports.checkTaxNameExistQuery = void 0;
exports.checkTaxNameExistQuery = `SELECT * FROM tax WHERE name = ?`;
exports.addTaxQuery = `INSERT INTO tax (name, value) VALUES (?, ?)`;
exports.getAllTaxesQuery = `SELECT * FROM tax`;
exports.updateTaxQuery = `UPDATE Tax SET name = ?, value = ? WHERE id = ?`;
exports.changeTaxStatusQuery = `UPDATE Tax SET apply = ? WHERE id = ?`;
exports.deleteTaxQuery = `DELETE FROM tax WHERE id = ?`;
