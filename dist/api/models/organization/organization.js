"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../../../helper");
const user_1 = __importDefault(require("../../LobnosAuth/user"));
const queries_1 = require("./queries");
const defaultSalesParam = {
    discountedAmount: 0,
    payable: 0,
    commissionRate: 0,
    referedCases: 0,
};
class Organization {
    constructor(organizationId) {
        this.organizationId = organizationId;
    }
    async getOrganizations() {
        return await (0, helper_1.promisifyQuery)("SELECT id,name FROM organization");
    }
    async hasOrganization(name) {
        const result = await (0, helper_1.promisifyQuery)(queries_1.q_has_an_organization, [name]);
        return result[0]["count"] > 0;
    }
    async isProvidedOrganizationIdValid(organizationid) {
        const rows = await (0, helper_1.promisifyQuery)(queries_1.q_organizationid_is_valid, [organizationid]);
        return rows.length > 0;
    }
    async deleteOrganization(employeeid, isPasswordConfirmed) {
        if (!this.organizationId || !employeeid || !isPasswordConfirmed)
            throw new Error("invalid arguments provided");
        const users = new user_1.default(null, null, null, null, null);
        const userid = employeeid.toString();
        const user_exist = await users.userExistWithId(userid);
        if (!user_exist)
            return "user with such credentials do not exist in our records" /* OperationsStatus.userNotFound */;
        const isAuthorized = await users.getUserRole(userid);
        const isAuthorizedPersonel = ['admin', 'manager'];
        if (!isAuthorizedPersonel.includes(isAuthorized))
            return "Unauthorized to carry order" /* OperationsStatus.unAuthorized */;
        if (isPasswordConfirmed) {
            const deleted = await (0, helper_1.promisifyQuery)(`DELETE FROM organization WHERE ID = ?`, [this.organizationId]);
            return (0, helper_1.rowAffected)(deleted);
        }
    }
    async createAorganization(body) {
        const { name, location, street, mobile, address, website, email, gpsMapping, region, type } = body;
        const has_organization = await this.hasOrganization(name);
        if (has_organization)
            return "organization with such name exist" /* OperationsStatus.exist */;
        const values = [name, location, street, mobile, address, website, email, gpsMapping, region, type];
        const result = await (0, helper_1.promisifyQuery)(queries_1.q_create_an_organization, values);
        return (0, helper_1.rowAffected)(result);
    }
    async getOrganizationWithDetails(params) {
        let conditions = [];
        let values = [];
        let q_get_organizations = `SELECT * FROM organization`;
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
        const packets = await (0, helper_1.paginationQuery)({ page, count }, q_get_organizations, values);
        return packets;
    }
    async getOrganizationBasic() {
        if (!this.organizationId)
            return;
        let result = await (0, helper_1.promisifyQuery)(`SELECT * FROM organization WHERE id = ?`, [this.organizationId]);
        return result;
    }
    async updateOrganizationBasic(requestBody) {
        const { name, location, street, mobile, address, website, email, gpsMapping, region, type, id } = requestBody;
        const values = [location, street, mobile, address, website, email, gpsMapping, region, name, type, id];
        const q_packets = await (0, helper_1.promisifyQuery)(queries_1.q_update_org_basic_info, values);
        return (0, helper_1.rowAffected)(q_packets);
    }
    async updateOrganizationalContactInfo(requestBody) {
        const { name, email, mobile, organizationid } = requestBody;
        if (!this.organizationId)
            return false;
        const values = [name, email, mobile, organizationid];
        const result = await (0, helper_1.promisifyQuery)(queries_1.q_update_organization_contact_info, values);
        return (0, helper_1.rowAffected)(result);
    }
    async updateOrganizationPayment(requestBody) {
        if (!this.organizationId)
            throw new Error("organizational id required");
        const { bankname, momoname, branch, module, commission, organizationid, id, account, accountname, momo } = requestBody;
        const values = [branch, commission, account, bankname, module, momoname, accountname, momo, this.organizationId];
        let result = (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(queries_1.q_updateOrg_payment_info, values));
        return result;
    }
    async getOrganizationalPayment() {
        if (!this.organizationId) {
            throw new Error('organizational id missing');
        }
        return await (0, helper_1.promisifyQuery)(queries_1.q_org_payment, [this.organizationId]);
    }
    async getOrganizationContact() {
        if (!this.organizationId) {
            throw new Error('organizational id missing');
        }
        const result = await (0, helper_1.promisifyQuery)(queries_1.q_org_contact, [this.organizationId]);
        return result;
    }
    async getCommissionRate() {
        let commissionRate = 0;
        const organizationInfo = await this.organizationAccountInfo();
        if (organizationInfo.length !== 0 && organizationInfo[0]["commission"] !== 0) {
            commissionRate = organizationInfo[0]["commission"];
        }
        return commissionRate;
    }
    async calculateRate(data) {
        const commissionRate = await this.getCommissionRate();
        const payable = data[0]["payable"];
        const rate = parseFloat(payable) * (parseFloat(commissionRate.toString()) / 100);
        return Object.assign(Object.assign({}, data[0]), { commissionRate: rate });
    }
    async monthSales() {
        let monthly = await (0, helper_1.promisifyQuery)(queries_1.MONTHLYSALESQUERY, [this.organizationId]);
        if (monthly.length === 0) {
            return defaultSalesParam;
        }
        monthly = await this.calculateRate(monthly);
        return monthly;
    }
    async daySales() {
        let result = await (0, helper_1.promisifyQuery)(queries_1.TODAYSALESQUERY, [this.organizationId]);
        if (result.length === 0) {
            return defaultSalesParam;
        }
        result = await this.calculateRate(result);
        return result;
    }
    async weeklySales() {
        const commissionRate = await this.getCommissionRate();
        let result = await (0, helper_1.promisifyQuery)(queries_1.WEEKLYSALESQUERY, [this.organizationId]);
        if (result.length === 0) {
            return [];
        }
        result = result.map((item) => {
            const commission = parseFloat(item === null || item === void 0 ? void 0 : item.payable) * (parseFloat(commissionRate.toString()) / 100);
            return Object.assign(Object.assign({}, item), { value: commission, name: item === null || item === void 0 ? void 0 : item.weeklySales });
        });
        return result;
    }
    async getYearlySales() {
        let result = await (0, helper_1.promisifyQuery)(queries_1.YEARLYSALESQUERY, [this.organizationId]);
        if (result.length === 0) {
            return defaultSalesParam;
        }
        result = await this.calculateRate(result);
        return result;
    }
    async getDailySales() {
        let result = await (0, helper_1.promisifyQuery)(queries_1.DAILYSALESQUERY, [this.organizationId]);
        result = await Promise.all(result.map(async (a) => await this.calculateRate([a])));
        return result;
    }
    async organizationAccountInfo() {
        if (!this.organizationId)
            throw ReferenceError('organization ID not Provided');
        return await (0, helper_1.promisifyQuery)(queries_1.q_accountInfo, [this.organizationId]);
    }
    async getOrganizationInfo() {
        return await (0, helper_1.promisifyQuery)("SELECT * FROM organization WHERE id = ?", [this.organizationId]);
    }
    async generateOrganizationalSalesReport() {
        if (!this.organizationId)
            return false;
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
        let q_query = queries_1.q_top_performance_organization;
        let conditions = [];
        let parameters = [];
        if (from && to) {
            conditions.push(`pt.date BETWEEN ? AND ?`);
            parameters.push(from, to);
        }
        else if (from && !to) {
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
        parameters.push(count);
        let result = await (0, helper_1.promisifyQuery)(q_query, parameters);
        return result;
    }
}
exports.default = Organization;
