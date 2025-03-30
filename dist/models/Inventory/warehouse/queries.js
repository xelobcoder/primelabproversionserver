"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warehouseQueries = void 0;
exports.warehouseQueries = {
    checkExistence: "SELECT COUNT(*) as count FROM warehouse WHERE name = ?",
    addWarehouse: "INSERT INTO warehouse (name) VALUE (?)",
    getWarehouseById: "SELECT * FROM warehouse WHERE id = ?",
    getAllWarehouses: "SELECT * FROM warehouse",
    deleteWarehouse: "DELETE FROM warehouse WHERE id = ?",
    updateWarehouse: "UPDATE warehouse SET name = ? WHERE id = ?",
    createShelf: "INSERT INTO shelves (warehouse, name) VALUES (?, ?)",
    getShelfById: "SELECT * FROM shelves WHERE id = ?",
    getWarehouseShelves: `
    SELECT sh.id, sh.warehouse as warehouseid, wh.name as warehouse,
    sh.name FROM shelves AS sh INNER JOIN warehouse AS wh ON sh.warehouse = wh.id
    WHERE sh.warehouse = ? GROUP BY sh.id ORDER BY sh.id DESC`,
    getShelves: `
    SELECT sh.id, sh.warehouse as warehouseid, wh.name AS warehouse,
    sh.name FROM shelves AS sh INNER JOIN warehouse AS wh ON sh.warehouse = wh.id
    GROUP BY sh.id ORDER BY sh.id DESC LIMIT ? OFFSET ?`,
    getGeneralWarehouseItems: "SELECT stockid, name FROM generalstocks WHERE warehouse = ? AND shelf = ?",
    updateShelf: "UPDATE shelves SET name = ? WHERE id = ?",
    deleteShelf: "DELETE FROM shelves WHERE id = ?",
};
