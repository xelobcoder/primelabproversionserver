interface InventoryInterface {
  stockid: number | null;

  checkStockExist(stockname: string): Promise<boolean>;

  addNewStock(records: any): Promise<string | number>;

  updateAstock(records: any): Promise<number>;

  deleteAstock(stockid: number): Promise<number>;

  getStocks(query: any, warehouseid?: number | string): Promise<any[]>;

  getAstock(stockid: number): Promise<any | undefined>;

  getMainSupplyStock(stockid: number, brandid: number): Promise<any | Error>;

  getExpiredStock(query: any): Promise<any[]>;

  addStockCategory(records: any): Promise<number | Error>;

  getStockCategory(): Promise<any[]>;

  updateStockCategory(records: any): Promise<number | Error>;

  deleteStockCategory(stockCategoryId: number): Promise<boolean>;

  getGeneralUnExpiredStocks(requestQuery: any): Promise<any[]>;

  getGeneralExpired(query: any): Promise<any[]>;

  deleteStockBrand(records: any): Promise<number | string>;

  getAstockBrands(records: any): Promise<any[]>;

  addStockBrand(records: any): Promise<number>;

  updateAStockBrand(records: any): Promise<number>;

  filterstock(filteringValue: string | null, query: any): Promise<any[]>;

  updateStockOrders(data: any[]): Promise<any>;

  updateOrderReceivedTransactionSummary(summary: any): Promise<boolean | Error>;

  receivePurchaseStocks(records: any[], total: number, tax: { amount: number; method: string }, response?: any): Promise<boolean | void>;

  getDebitHxSingle(productordersid: number): Promise<any[]>;

  addDebitHx(
    productordersid: number,
    stockid: number,
    batchnumber: string,
    brandid: number,
    debitqty: number,
    wastage?: number
  ): Promise<number>;

  getCreditHxSingle(productordersid: number, stockid: number, brandid: number, batchnumber: string): Promise<any[]>;

  isDebitable(stockid: number, brands: number[]): Promise<any[]>;

  purchasetoConsumeInsight(data: any): Promise<any[]>;

  updateGeneralStocksQty(qty: number, stockid: number, operation: "add" | "minus"): Promise<number | Error>;

  updateMainSupplyGeneral(stockid: number, brandid: number, qty: number, operation: "add" | "minus"): Promise<number | null>;
}
