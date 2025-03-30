export interface SupplierRecord {
  name: string;
  address: string;
  email: string;
  contactperson: string;
  region: string;
  phonenumber: number;
  supplierid?: number;
}

export interface CommodityRecord {
  name: string;
  category: string;
}

export interface ApiResponse {
  message: string;
  statusCode: number;
  status: string;
}

export interface ApplicationSettings {
  emailNotification: number;
}


interface ISupplys {
  /**
   * Checks if a supplier is available based on contact number and email.
   * @param {number} contact - The contact number of the supplier.
   * @param {string} email - The email address of the supplier.
   * @returns {Promise<boolean | string>} True if supplier is available, error message otherwise.
   * @throws Will throw an error if email or contact is not provided.
   */
  isSupplierAvailable(contact: number, email: string): Promise<boolean | string>;

  /**
   * Adds a new supplier.
   * @param {SupplierRecord} records - The supplier record to add.
   * @returns {Promise<ApiResponse>} The API response indicating success or failure.
   */
  addSupplier(records: SupplierRecord): Promise<ApiResponse>;

  /**
   * Deletes a supplier.
   * @param {number} supplierid - The ID of the supplier to delete.
   * @returns {Promise<boolean>} True if supplier is deleted successfully, false otherwise.
   */
  deleteSupplier(supplierid: number): Promise<boolean>;

  /**
   * Retrieves suppliers with pagination.
   * @param {any} data - Pagination parameters.
   * @returns {Promise<any>} The paginated list of suppliers.
   * @throws Will throw an error if the query fails.
   */
  getSuppliers(data: any): Promise<any>;

  /**
   * Updates an existing supplier.
   * @param {SupplierRecord} records - The supplier record to update.
   * @returns {Promise<boolean | null>} True if update is successful, false otherwise.
   */
  updateSupplier(records: SupplierRecord): Promise<boolean | null>;

  /**
   * Retrieves a supplier by ID.
   * @param {number} supplierid - The ID of the supplier to retrieve.
   * @returns {Promise<any>} The supplier information.
   */
  getSupplier(supplierid: number): Promise<any>;

  /**
   * Retrieves pending orders for a supplier.
   * @param {number} id - The ID of the supplier.
   * @param {string} status - Either 'data' to fetch orders or 'count' to fetch count.
   * @returns {Promise<any>} The pending orders or count of pending orders.
   * @throws Will throw an error if supplierid is not provided.
   */
  getSupplierPendingOrders(id: number, status?: string): Promise<any>;

  /**
   * Posts a new commodity.
   * @param {CommodityRecord} records - The commodity record to add.
   * @returns {Promise<boolean>} True if commodity is added successfully, false otherwise.
   * @throws Will throw an error if name or category is not provided.
   */
  postCommodity(records: CommodityRecord): Promise<boolean>;

  /**
   * Retrieves a commodity by name.
   * @param {string} commodity - The name of the commodity to retrieve.
   * @returns {Promise<any>} The commodity information.
   * @throws Will throw an error if commodity is not provided.
   */
  getCommodity(commodity: string): Promise<any>;

  /**
   * Retrieves commodities with pagination.
   * @param {any} query - Pagination parameters.
   * @returns {Promise<any>} The paginated list of commodities.
   * @throws Will throw an error if the query fails.
   */
  getCommodities(query: any): Promise<any>;
}

export default ISupplys;
