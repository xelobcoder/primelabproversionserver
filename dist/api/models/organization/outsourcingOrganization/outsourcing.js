"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../../../../helper");
const user_1 = __importDefault(require("../../../LobnosAuth/user"));
const customTestEntry_1 = require("../../resultentry/customTestEntry");
const queries_1 = require("./queries");
class Outsourcing {
    constructor(name, contactNumber) {
        this.name = name;
        this.contactNumber = contactNumber;
    }
    async checkForExistenceOutsourceOrganization(organizationName) {
        const packets = await (0, helper_1.promisifyQuery)(queries_1.q_outsource_organization_exist, [organizationName]);
        return packets[0]['count'] > 0;
    }
    async checkForExistenceOutsourceOrganizationid(organizationid) {
        const packets = await (0, helper_1.promisifyQuery)(queries_1.q_outsource_organization_exist_usingid, [organizationid]);
        return packets[0]['count'] > 0;
    }
    async createOutSourceOrganization(outsource) {
        const { billingAddress, address, email, name, organizationType, employeeid, contactNumber, contactPerson } = outsource;
        const hasOrganization = await this.checkForExistenceOutsourceOrganization(name);
        if (hasOrganization)
            return "Organization With Such Name Already Exist" /* OperationsFailures.OrganizationExist */;
        const values = [name, organizationType, email, address, billingAddress, contactNumber, contactPerson, employeeid];
        const rows = await (0, helper_1.promisifyQuery)(queries_1.q_create_an_outsource_organization, values);
        return (0, helper_1.rowAffected)(rows);
    }
    async getOrganizationBasicInformation(outsourceid) {
        const packets = await (0, helper_1.promisifyQuery)(queries_1.q_get_outsource_organization_basic, [outsourceid]);
        return packets;
    }
    async getOrganizationServicesInformation(outsourceid) {
        const packets = await (0, helper_1.promisifyQuery)(queries_1.q_get_outsourceorganizationservices, [outsourceid]);
        return packets;
    }
    async updateOutsourceOrganization(outsource) {
        const { billingAddress, address, email, outsourceid, name, organizationType, employeeid, contactNumber, contactPerson } = outsource;
        const values = [name, organizationType, email, address, billingAddress, contactNumber, contactPerson, employeeid, outsourceid];
        const hasOrganization = await this.checkForExistenceOutsourceOrganizationid(parseInt(outsourceid.toString()));
        if (!hasOrganization)
            return "such id not found" /* OperationsFailures.unfoundID */;
        const result = await (0, helper_1.promisifyQuery)(queries_1.q_update_an_outsource_organization_basic, values);
        return (0, helper_1.rowAffected)(result);
    }
    async loadoutsourcingOrganizationTable(outsourceid, employeeid, data) {
        const { generalTestId, outsourcePrice } = data;
        const insertedPackets = await (0, helper_1.promisifyQuery)(queries_1.q_insert_into_outsource_org_services_table, [outsourceid, generalTestId, outsourcePrice, employeeid]);
        return (0, helper_1.rowAffected)(insertedPackets);
    }
    async loadoutsourceOrganizationServices(data) {
        try {
            const { outsourceid, testList, employeeid } = data;
            if (!outsourceid) {
                throw new Error('outsourceid not provided');
            }
            if (!await this.checkForExistenceOutsourceOrganizationid(outsourceid))
                return "such id not found" /* OperationsFailures.unfoundID */;
            console.log(data);
            if (Array.isArray(testList) && testList.length > 0) {
                for (const test of testList) {
                    const load = await this.loadoutsourcingOrganizationTable(outsourceid, employeeid, Object.assign(Object.assign({}, test), { outsourceid, employeeid }));
                }
            }
            return true;
        }
        catch (error) {
            if (error.code === "ER_DUP_ENTRY") {
            }
            return false;
        }
    }
    async getOrganizationOursourcePricing(outsourceid) {
        if (!await this.checkForExistenceOutsourceOrganizationid(outsourceid)) {
            return "such id not found" /* OperationsFailures.unfoundID */;
        }
        const services_data = await this.getOrganizationServicesInformation(outsourceid);
        if (services_data.length == 0)
            return [];
        const allTest = await new customTestEntry_1.CustomTest(null, null).getAllCustomTestList();
        if (allTest.length === 0)
            return [];
        let testList = [];
        for (const service of services_data) {
            const data = allTest.filter((item, index) => item.id === service['generalTestId']);
            if (data.length > 0) {
                const { outserviceid, outsourceid, generalTestId, outsourcePrice } = service;
                const priceDifference = data[0]['price'] - outsourcePrice;
                const generatedData = { outserviceid, outsourceid, testid: generalTestId, name: data[0]['name'], priceDifference, price: outsourcePrice };
                testList.push(generatedData);
            }
        }
        return testList;
    }
    async getAllOutsourcingOrganization(data) {
        let query = `SELECT * FROM outsourcingorganization`;
        const filters = [];
        const params = [];
        if (data.searchValue) {
            const searchFilter = `%${data.searchValue}%`;
            filters.push(`(name LIKE ? OR organizationType LIKE ? OR email LIKE ? OR address LIKE ? OR billingAddress LIKE ? OR contactNumber LIKE ? OR contactPerson LIKE ?)`);
            params.push(searchFilter, searchFilter, searchFilter, searchFilter, searchFilter, searchFilter, searchFilter);
        }
        if (filters.length > 0) {
            query += ` WHERE ` + filters.join(' AND ');
        }
        query += ` LIMIT ? OFFSET ?`;
        const page = data.page | 1;
        const count = data.count | 10;
        let result = await (0, helper_1.paginationQuery)({ page, count }, query, params);
        if (result.length > 0) {
            result = await Promise.all(result.map(async (item, index) => {
                const employeeid = item['outsourceCreatedBy'];
                if (employeeid && !isNaN(employeeid)) {
                    const packet = await new user_1.default(null, null, null, null, null).getUserDataById(employeeid);
                    if (packet.length > 0) {
                        item.createdby = packet[0]['username'];
                    }
                }
                return item;
            }));
        }
        return result;
    }
    calculateProfit(outorganizationid) {
        throw new Error("Method not implemented.");
    }
    getOrganizationTest(testid, organizationid) {
        throw new Error("Method not implemented.");
    }
}
exports.default = Outsourcing;
