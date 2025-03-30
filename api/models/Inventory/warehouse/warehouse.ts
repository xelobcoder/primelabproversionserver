import { promisifyQuery, rowAffected, paginationQuery } from "../../../../helper";
import { warehouseQueries } from "./queries";

class WareHouse {
  private warehouseId: number;

  constructor(warehouseId: number) {
    this.warehouseId = warehouseId;
  }

  public async addWareHouse(warehousename: string): Promise<number | "EXIST"> {
    if (!warehousename) throw new Error("warehouse name not included");

    if (await this.checkWarehouseExistence(warehousename)) {
      return "EXIST";
    }

    const result = await promisifyQuery(warehouseQueries.addWarehouse, [warehousename]);
    return rowAffected(result);
  }

  public async getAWarehouse(): Promise<any> {
    if (!this.warehouseId) throw new Error("warehouse id required");

    return await promisifyQuery(warehouseQueries.getWarehouseById, this.warehouseId);
  }

  public async getAllWareHouse(): Promise<any[]> {
    return await paginationQuery({}, warehouseQueries.getAllWarehouses);
  }

  public async deleteWarehouse(warehouseId: number): Promise<number> {
    if (!warehouseId) throw new Error("warehouse id required");

    const deleted = await promisifyQuery(warehouseQueries.deleteWarehouse, warehouseId);
    return rowAffected(deleted);
  }

  public async updateWarehouse(warehouseId: number, newName: string): Promise<number> {
    if (!warehouseId || !newName) throw new Error("warehouse id and new name are required");

    const updated = await promisifyQuery(warehouseQueries.updateWarehouse, [newName, warehouseId]);
    return rowAffected(updated);
  }

  public async createShelf(warehouseId: number, shelfName: string): Promise<number> {
    if (!warehouseId || !shelfName) throw new Error("warehouse id and shelf name are required");

    const result = await promisifyQuery(warehouseQueries.createShelf, [warehouseId, shelfName]);
    return rowAffected(result);
  }

  public async getShelf(shelfId: number): Promise<any> {
    if (!shelfId) throw new Error("shelf id required");

    return await promisifyQuery(warehouseQueries.getShelfById, shelfId);
  }

  public async getWarehouseShelves(): Promise<any[]> {
    if (!this.warehouseId) throw new Error("warehouseid not provided");

    return await promisifyQuery(warehouseQueries.getWarehouseShelves, this.warehouseId);
  }

  public async getShelves(count: number, page: number): Promise<any[]> {
    return await paginationQuery({ count, page }, warehouseQueries.getShelves, [count, (page - 1) * count]);
  }

  public async getGeneralWareSelfItems(warehouseId: number, shelfId: number): Promise<any[]> {
    if (!warehouseId || !shelfId) throw new Error("warehouseid and shelf id are required");

    const result = await promisifyQuery(warehouseQueries.getGeneralWarehouseItems, [warehouseId, shelfId]);
    return result;
  }

  public async updateShelf(shelfId: number, newName: string): Promise<number> {
    if (!shelfId || !newName) throw new Error("shelf id and new name are required");

    return await promisifyQuery(warehouseQueries.updateShelf, [newName, shelfId]);
  }

  public async deleteShelf(shelfId: number): Promise<number> {
    if (!shelfId) throw new Error("shelf id required");

    return await promisifyQuery(warehouseQueries.deleteShelf, shelfId);
  }

  private async checkWarehouseExistence(warehousename: string): Promise<boolean> {
    const checkResult = await promisifyQuery(warehouseQueries.checkExistence, [warehousename]);
    return checkResult[0].count > 0;
  }
}

export default WareHouse;
