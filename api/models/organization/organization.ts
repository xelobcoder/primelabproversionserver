import { promisifyQuery, paginationQuery, rowAffected } from "../../../helper";
import User from "../../LobnosAuth/user";
import { newOrganization, OperationsStatus, OrganizationRequestBody, OrgContactInfo, searchQueryParams } from "./OrgaInterfac";
import { MONTHLYSALESQUERY, WEEKLYSALESQUERY, DAILYSALESQUERY, TODAYSALESQUERY, YEARLYSALESQUERY, q_accountInfo, q_update_org_basic_info, q_create_an_organization, q_has_an_organization, q_update_organization_contact_info, q_org_payment, q_org_contact, q_updateOrg_payment_info, q_top_performance_organization, q_organizationid_is_valid } from "./queries";

interface OrganizationInfo {
  id: number;
  commission: number;
}

const defaultSalesParam = {
  discountedAmount: 0,
  payable: 0,
  commissionRate: 0,
  referedCases: 0,
};

class Organization {
  private organizationId: number | null;

  constructor(organizationId: number | null) {
    this.organizationId = organizationId;
  }

  async getOrganizations() {
    return await promisifyQuery("SELECT id,name FROM organization")
  }

  async hasOrganization(name: string) {
    const result = await promisifyQuery(q_has_an_organization, [name]);
    return result[0]["count"] > 0;
  }


  async isProvidedOrganizationIdValid(organizationid: number) {
    const rows = await promisifyQuery(q_organizationid_is_valid, [organizationid]);
    return rows.length > 0;
  }


  async deleteOrganization(employeeid: number, isPasswordConfirmed: false) {
    if (!this.organizationId || !employeeid || !isPasswordConfirmed) throw new Error("invalid arguments provided");
    const users = new User(null, null, null, null, null);
    const userid = employeeid.toString();

    const user_exist = await users.userExistWithId(userid);
    if (!user_exist) return OperationsStatus.userNotFound;
    const isAuthorized = await users.getUserRole(userid);
    const isAuthorizedPersonel = ['admin', 'manager'];

    if (!isAuthorizedPersonel.includes(isAuthorized)) return OperationsStatus.unAuthorized;

    if (isPasswordConfirmed) {
      const deleted = await promisifyQuery(`DELETE FROM organization WHERE ID = ?`, [this.organizationId]);
      return rowAffected(deleted);
    }
  }




  async createAorganization(body: OrganizationRequestBody): Promise<boolean | string> {
    const { name, location, street, mobile, address, website, email, gpsMapping, region, type } = body;
    const has_organization = await this.hasOrganization(name);
    if (has_organization) return OperationsStatus.exist;
    const values = [name, location, street, mobile, address, website, email, gpsMapping, region, type];
    const result = await promisifyQuery(q_create_an_organization, values);
    return rowAffected(result);
  }

  public async getOrganizationWithDetails(params: searchQueryParams) {
    let conditions = [];
    let values = [];
    let q_get_organizations = `SELECT * FROM organization`
    const { organization, email, contact, count = 10, page = 1 } = params;

    if (organization) {
      conditions.push(`name LIKE ?`);
      values.push('%conditions%');
    }

    if (email) {
      conditions.push(`email LIKE ?`);
      values.push('%email%');
    }

    if (contact) {
      conditions.push(`mobile LIKE ?`);
      values.push('%contact%');
    }

    if (conditions.length != 0) {
      q_get_organizations += ' WHERE ' + conditions.join(" AND ");
    }
    const packets = await paginationQuery({ page, count }, q_get_organizations, values);
    return packets;
  }


  async getOrganizationBasic() {
    if (!this.organizationId) return;
    let result = await promisifyQuery(`SELECT * FROM organization WHERE id = ?`, [this.organizationId]);
    return result;
  }


  async updateOrganizationBasic(requestBody: newOrganization) {
    const { name, location, street, mobile, address, website, email, gpsMapping, region, type, id } = requestBody;
    const values = [location, street, mobile, address, website, email, gpsMapping, region, name, type, id];
    const q_packets = await promisifyQuery(q_update_org_basic_info, values);
    return rowAffected(q_packets);
  }


  async updateOrganizationalContactInfo(requestBody: OrgContactInfo) {
    const { name, email, mobile, organizationid } = requestBody
    if (!this.organizationId) return false;
    const values = [name, email, mobile, organizationid];
    const result = await promisifyQuery(q_update_organization_contact_info, values);
    return rowAffected(result);
  }




  async updateOrganizationPayment(requestBody) {
    if (!this.organizationId) throw new Error("organizational id required");
    const { bankname, momoname, branch, module, commission, organizationid, id, account, accountname, momo } = requestBody;
    const values = [branch, commission, account, bankname, module, momoname, accountname, momo, this.organizationId]
    let result = rowAffected(await promisifyQuery(q_updateOrg_payment_info, values));
    return result;
  }



  public async getOrganizationalPayment() {
    if (!this.organizationId) {
      throw new Error('organizational id missing');
    }
    return await promisifyQuery(q_org_payment, [this.organizationId]);
  }


  async getOrganizationContact() {
    if (!this.organizationId) {
      throw new Error('organizational id missing');
    }
    const result = await promisifyQuery(q_org_contact, [this.organizationId])
    return result;
  }

  protected async getCommissionRate(): Promise<number> {
    let commissionRate = 0;
    const organizationInfo = await this.organizationAccountInfo();
    if (organizationInfo.length !== 0 && organizationInfo[0]["commission"] !== 0) {
      commissionRate = organizationInfo[0]["commission"];
    }
    return commissionRate;
  }

  private async calculateRate<T>(data: T[]): Promise<T> {
    const commissionRate = await this.getCommissionRate();
    const payable = data[0]["payable"];
    const rate = parseFloat(payable) * (parseFloat(commissionRate.toString()) / 100);
    return { ...data[0], commissionRate: rate };
  }

  public async monthSales(): Promise<any> {
    let monthly = await promisifyQuery(MONTHLYSALESQUERY, [this.organizationId]);
    if (monthly.length === 0) {
      return defaultSalesParam;
    }
    monthly = await this.calculateRate(monthly);
    return monthly;
  }

  public async daySales(): Promise<any> {
    let result = await promisifyQuery(TODAYSALESQUERY, [this.organizationId]);
    if (result.length === 0) {
      return defaultSalesParam;
    }
    result = await this.calculateRate(result);
    return result;
  }

  public async weeklySales(): Promise<any[]> {
    const commissionRate = await this.getCommissionRate();
    let result = await promisifyQuery(WEEKLYSALESQUERY, [this.organizationId]);
    if (result.length === 0) {
      return [];
    }
    result = result.map((item: any) => {
      const commission = parseFloat(item?.payable) * (parseFloat(commissionRate.toString()) / 100);
      return { ...item, value: commission, name: item?.weeklySales };
    });
    return result;
  }

  public async getYearlySales(): Promise<any> {
    let result = await promisifyQuery(YEARLYSALESQUERY, [this.organizationId]);
    if (result.length === 0) {
      return defaultSalesParam;
    }
    result = await this.calculateRate(result);
    return result;
  }

  public async getDailySales(): Promise<any[]> {
    let result = await promisifyQuery(DAILYSALESQUERY, [this.organizationId]);
    result = await Promise.all(result.map(async (a: any) => await this.calculateRate([a])));
    return result;
  }

  private async organizationAccountInfo(): Promise<OrganizationInfo[]> {
    if (!this.organizationId) throw ReferenceError('organization ID not Provided');
    return await promisifyQuery(q_accountInfo, [this.organizationId]);
  }

  public async getOrganizationInfo(): Promise<any> {
    return await promisifyQuery("SELECT * FROM organization WHERE id = ?", [this.organizationId]);
  }

  public async generateOrganizationalSalesReport(): Promise<any> {
    if (!this.organizationId) return false;
    const monthly = await this.monthSales();
    const today = await this.daySales();
    const weekly = await this.weeklySales();
    const daily = await this.getDailySales();
    const yearly = await this.getYearlySales();
    const sales = { monthly, today, weekly, yearly, daily };
    return sales;
  }


  async getTopPerformance(requestQuery) {
    const { count, from, to } = requestQuery;
    let q_query = q_top_performance_organization;
    let conditions = [];
    let parameters = [];
    if (from && to) {
      conditions.push(`pt.date BETWEEN ? AND ?`);
      parameters.push(from, to);
    } else if (from && !to) {
      conditions.push(`pt.date BETWEEN ? AND CURRENT_DATE`);
      parameters.push(from);
    }
    if (conditions.length > 0) {
      q_query += ` WHERE ${conditions.join(' AND ')}`;
    }
    q_query += `
    GROUP BY o.id, o.name
    ORDER BY TotalSales DESC
    LIMIT ?
  `;

    parameters.push(count)
    let result = await promisifyQuery(q_query, parameters);
    return result;
  }
}

export default Organization;
