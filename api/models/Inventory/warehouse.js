const { rowAffected,paginationQuery,promisifyQuery } = require("../../../helper");

class WareHouse {
  constructor(warehouseId) {
    this.warehouseId = warehouseId;
  }

  async  checkWarehouseExistence(warehousename) {
    if (!warehousename) {
      throw new Error("Warehouse name not included");
    }
    // Check if the warehouse already exists
    const checkResult = await promisifyQuery(
      'SELECT COUNT(*) as count FROM warehouse WHERE name = ?',
      [warehousename]
    );
  
    return checkResult[0].count > 0;
  }  
  async addWareHouse(warehousename) {
    if (!warehousename) throw new Error("warehouse name not included");
    if (await this.checkWarehouseExistence(warehousename)) { return 'EXIST' }
    const result = await promisifyQuery(`INSERT INTO warehouse (name) VALUE (?)`, [warehousename]);
    return rowAffected(result);
  }

  async getAWarehouse() {
    if (!this.warehouseId) throw new Error("warehouse id required");
    return await promisifyQuery(`SELECT * FROM warehouse WHERE id = ?`, this.warehouseId);
  }

  async getAllWareHouse() {
    return await paginationQuery({}, `SELECT * FROM warehouse`);
  }

  async deleteWarehouse(warehouseId) {
    if (!warehouseId) throw new Error("warehouse id required");
    const deleted = await promisifyQuery(`DELETE FROM warehouse WHERE id = ?`, warehouseId);
    return rowAffected(deleted);
  }

  async updateWarehouse(warehouseId, newName) {
    if (!warehouseId || !newName) throw new Error("warehouse id and new name are required");
    const updated= await promisifyQuery(`UPDATE warehouse SET name = ? WHERE id = ?`, [newName, warehouseId]);
    return rowAffected(updated);
  }

  async createShelf(warehouseId, shelfName) {
    if (!warehouseId || !shelfName) throw new Error("warehouse id and shelf name are required");
    const result = await promisifyQuery(`INSERT INTO shelves (warehouse, name) VALUES (?, ?)`, [warehouseId, shelfName]);
    return rowAffected(result);
  }

  async getShelf(shelfId) {
    if (!shelfId) throw new Error("shelf id required");
    return await promisifyQuery(`SELECT * FROM shelves WHERE id = ?`, shelfId);
  }

  async getWarehouseShelves(warehouseId) {
    if (!warehouseId) throw new Error('warehouseid not provided');
    return await promisifyQuery(`SELECT sh.id,sh.warehouse as warehouseid,wh.name as warehouse,
    sh.name FROM shelves AS sh INNER JOIN warehouse AS wh ON sh.warehouse = wh.id
    WHERE sh.warehouse = ? GROUP BY sh.id ORDER BY sh.id DESC`, [parseInt(warehouseId)]);
  }

  async getShelves() {
    return await paginationQuery({}, `SELECT sh.id,sh.warehouse as warehouseid,wh.name AS warehouse,
    sh.name FROM shelves AS sh INNER JOIN warehouse AS wh ON sh.warehouse = wh.id
    GROUP BY sh.id ORDER BY sh.id DESC LIMIT ? OFFSET ?`);
  }

  async getGeneralWareSelfItems(warehouseId, shelfId) {
    if (!warehouseId || !shelfId) throw new Error("warehouseid and shelf id are required");
    const result = await promisifyQuery(`SELECT stockid, name FROM generalstocks WHERE warehouse = ? AND shelf = ?`, [warehouseId, shelfId]);
    return result;
  }

  async updateShelf(shelfId, newName) {
    if (!shelfId || !newName) throw new Error("shelf id and new name are required");
    return await promisifyQuery(`UPDATE shelves SET name = ? WHERE id = ?`, [newName, shelfId]);
  }

  async deleteShelf(shelfId) {
    if (!shelfId) throw new Error("shelf id required");
    return await promisifyQuery(`DELETE FROM shelves WHERE id = ?`, shelfId);
  }
}


module.exports = WareHouse;