export type searchQueryParams = {
  page?: string;
  count?: string;
  organization?: string;
  email?: string;
  contact?: number;

}

export type OrganizationRequestBody = {
  name: string;
  location: string;
  street: string;
  mobile: number;
  address: string;
  website: string;
  email: string;
  gpsMapping: string;
  region: string;
  type: string,
}

export const enum OperationsStatus {
  exist = "organization with such name exist",
  userNotFound = "user with such credentials do not exist in our records",
  unAuthorized = "Unauthorized to carry order"
}



export type OrgContactInfo = {
  name: string,
  mobile: number,
  organizationid: number,
  email: string
}


export type newOrganization = {
  name?: string;
  location?: string;
  street?: string;
  mobile?: string;
  address?: string;
  type?: string;
  website?: string;
  email?: string;
  gpsMapping?: string;
  region?: string;
  id?: number;
}

/**
 * Interface representing an Organization with sales-related methods.
 */
interface IOrganization {
  /**
   * Retrieves monthly sales data for the organization.
   * @returns Promise<any> representing monthly sales data.
   */
  monthSales(): Promise<any>;

  /**
   * Retrieves daily sales data for the organization.
   * @returns Promise<any> representing daily sales data.
   */
  daySales(): Promise<any>;

  /**
   * Retrieves weekly sales data for the organization.
   * @returns Promise<any[]> representing weekly sales data.
   */
  weeklySales(): Promise<any[]>;

  /**
   * Retrieves yearly sales data for the organization.
   * @returns Promise<any> representing yearly sales data.
   */
  getYearlySales(): Promise<any>;

  /**
   * Retrieves daily sales data with commission rate calculation.
   * @returns Promise<any[]> representing daily sales data.
   */
  getDailySales(): Promise<any[]>;

  /**
   * Generates a sales report for the organization.
   * @returns Promise<any> representing the generated sales report.
   */
  generateSalesReport(): Promise<any>;
}
