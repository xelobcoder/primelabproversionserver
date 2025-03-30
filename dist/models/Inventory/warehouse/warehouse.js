"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../../../../helper");
const queries_1 = require("./queries");
class WareHouse {
    constructor(warehouseId) {
        this.warehouseId = warehouseId;
    }
    async addWareHouse(warehousename) {
        if (!warehousename)
            throw new Error("warehouse name not included");
        if (await this.checkWarehouseExistence(warehousename)) {
            return "EXIST";
        }
        const result = await (0, helper_1.promisifyQuery)(queries_1.warehouseQueries.addWarehouse, [warehousename]);
        return (0, helper_1.rowAffected)(result);
    }
    async getAWarehouse() {
        if (!this.warehouseId)
            throw new Error("warehouse id required");
        return await (0, helper_1.promisifyQuery)(queries_1.warehouseQueries.getWarehouseById, this.warehouseId);
    }
    async getAllWareHouse() {
        return await (0, helper_1.paginationQuery)({}, queries_1.warehouseQueries.getAllWarehouses);
    }
    async deleteWarehouse(warehouseId) {
        if (!warehouseId)
            throw new Error("warehouse id required");
        const deleted = await (0, helper_1.promisifyQuery)(queries_1.warehouseQueries.deleteWarehouse, warehouseId);
        return (0, helper_1.rowAffected)(deleted);
    }
    async updateWarehouse(warehouseId, newName) {
        if (!warehouseId || !newName)
            throw new Error("warehouse id and new name are required");
        const updated = await (0, helper_1.promisifyQuery)(queries_1.warehouseQueries.updateWarehouse, [newName, warehouseId]);
        return (0, helper_1.rowAffected)(updated);
    }
    async createShelf(warehouseId, shelfName) {
        if (!warehouseId || !shelfName)
            throw new Error("warehouse id and shelf name are required");
        const result = await (0, helper_1.promisifyQuery)(queries_1.warehouseQueries.createShelf, [warehouseId, shelfName]);
        return (0, helper_1.rowAffected)(result);
    }
    async getShelf(shelfId) {
        if (!shelfId)
            throw new Error("shelf id required");
        return await (0, helper_1.promisifyQuery)(queries_1.warehouseQueries.getShelfById, shelfId);
    }
    async getWarehouseShelves() {
        if (!this.warehouseId)
            throw new Error("warehouseid not provided");
        return await (0, helper_1.promisifyQuery)(queries_1.warehouseQueries.getWarehouseShelves, this.warehouseId);
    }
    async getShelves(count, page) {
        return await (0, helper_1.paginationQuery)({ count, page }, queries_1.warehouseQueries.getShelves, [count, (page - 1) * count]);
    }
    async getGeneralWareSelfItems(warehouseId, shelfId) {
        if (!warehouseId || !shelfId)
            throw new Error("warehouseid and shelf id are required");
        const result = await (0, helper_1.promisifyQuery)(queries_1.warehouseQueries.getGeneralWarehouseItems, [warehouseId, shelfId]);
        return result;
    }
    async updateShelf(shelfId, newName) {
        if (!shelfId || !newName)
            throw new Error("shelf id and new name are required");
        return await (0, helper_1.promisifyQuery)(queries_1.warehouseQueries.updateShelf, [newName, shelfId]);
    }
    async deleteShelf(shelfId) {
        if (!shelfId)
            throw new Error("shelf id required");
        return await (0, helper_1.promisifyQuery)(queries_1.warehouseQueries.deleteShelf, shelfId);
    }
    async checkWarehouseExistence(warehousename) {
        const checkResult = await (0, helper_1.promisifyQuery)(queries_1.warehouseQueries.checkExistence, [warehousename]);
        return checkResult[0].count > 0;
    }
}
exports.default = WareHouse;
