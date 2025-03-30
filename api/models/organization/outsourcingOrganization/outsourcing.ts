import { promisifyQuery, rowAffected, paginationQuery } from '../../../../helper';
import User from '../../../LobnosAuth/user';
import { OperationsFailures } from "../../operations/types";
import { CustomTest } from '../../resultentry/customTestEntry';
import { FilterParams, IOutSourcing, organizationDataServiceData, OutSourcingOrganization, serviceProvidedSummary } from "./outsourcingTypes";
import { q_create_an_outsource_organization, q_get_outsource_organization_basic, q_get_outsourceorganizationservices, q_insert_into_outsource_org_services_table, q_outsource_organization_exist, q_outsource_organization_exist_usingid, q_update_an_outsource_organization_basic } from "./queries";

export default class Outsourcing implements IOutSourcing {
    name: string;
    contactNumber: number;
    constructor(name: string, contactNumber: number) {
        this.name = name;
        this.contactNumber = contactNumber;
    }

    private async checkForExistenceOutsourceOrganization(organizationName: string) {
        const packets = await promisifyQuery(q_outsource_organization_exist, [organizationName]);
        return packets[0]['count'] > 0;
    }

    private async checkForExistenceOutsourceOrganizationid(organizationid: number) {
        const packets = await promisifyQuery(q_outsource_organization_exist_usingid, [organizationid]);
        return packets[0]['count'] > 0;
    }

    public async createOutSourceOrganization(outsource: OutSourcingOrganization): Promise<boolean | string> {
        const { billingAddress, address, email, name, organizationType, employeeid, contactNumber, contactPerson } = outsource;
        const hasOrganization = await this.checkForExistenceOutsourceOrganization(name);
        if (hasOrganization) return OperationsFailures.OrganizationExist;
        const values = [name, organizationType, email, address, billingAddress, contactNumber, contactPerson, employeeid]
        const rows = await promisifyQuery(q_create_an_outsource_organization, values);
        return rowAffected(rows);
    }

    async getOrganizationBasicInformation(outsourceid: number):
        Promise<[]> {
        const packets = await promisifyQuery(
            q_get_outsource_organization_basic, [outsourceid]
        )
        return packets;
    }


    private async getOrganizationServicesInformation(outsourceid: number):
        Promise<[]> {
        const packets = await promisifyQuery(
            q_get_outsourceorganizationservices, [outsourceid]
        )
        return packets;
    }




    async updateOutsourceOrganization(outsource: OutSourcingOrganization): Promise<boolean | string> {
        const { billingAddress, address, email, outsourceid, name, organizationType, employeeid, contactNumber, contactPerson } = outsource;
        const values = [name, organizationType, email, address, billingAddress, contactNumber, contactPerson, employeeid, outsourceid];
        const hasOrganization = await this.checkForExistenceOutsourceOrganizationid(parseInt(outsourceid.toString()));
        if (!hasOrganization) return OperationsFailures.unfoundID;
        const result = await promisifyQuery(q_update_an_outsource_organization_basic, values)
        return rowAffected(result);
    }

    async loadoutsourcingOrganizationTable(outsourceid: number, employeeid: number, data: organizationDataServiceData) {
        const { generalTestId, outsourcePrice } = data;
        const insertedPackets = await promisifyQuery(q_insert_into_outsource_org_services_table, [outsourceid, generalTestId, outsourcePrice, employeeid]);
        return rowAffected(insertedPackets);
    }

    async loadoutsourceOrganizationServices(data: serviceProvidedSummary): Promise<boolean | OperationsFailures.unfoundID> {
        try {
            const { outsourceid, testList, employeeid } = data
            if (!outsourceid) {
                throw new Error('outsourceid not provided');
            }
            if (!await this.checkForExistenceOutsourceOrganizationid(outsourceid)) return OperationsFailures.unfoundID;
            console.log(data)
            if (Array.isArray(testList) && testList.length > 0) {
                for (const test of testList) {
                    const load = await this.loadoutsourcingOrganizationTable(outsourceid, employeeid, { ...test, outsourceid, employeeid });
                }
            }
            return true;
        } catch (error) {
            if (error.code === "ER_DUP_ENTRY") {

            }
            return false;
        }
    }


    async getOrganizationOursourcePricing(outsourceid: number) {
        if (!await this.checkForExistenceOutsourceOrganizationid(outsourceid)) {
            return OperationsFailures.unfoundID
        }

        const services_data = await this.getOrganizationServicesInformation(outsourceid);
        if (services_data.length == 0) return []
        const allTest = await new CustomTest(null, null).getAllCustomTestList();

        if (allTest.length === 0) return [];
        let testList = [];
        for (const service of services_data) {
            const data = allTest.filter((item: any, index: number) => item.id === service['generalTestId']);
            if (data.length > 0) {
                const { outserviceid, outsourceid, generalTestId, outsourcePrice } = service;

                const priceDifference = data[0]['price'] - outsourcePrice
                const generatedData = { outserviceid, outsourceid, testid: generalTestId, name: data[0]['name'], priceDifference, price: outsourcePrice }

                testList.push(generatedData);
            }

        }
        return testList;
    }



    async getAllOutsourcingOrganization(data: FilterParams) {
        let query = `SELECT * FROM outsourcingorganization`;
        const filters: string[] = [];
        const params: any[] = [];

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

        let result = await paginationQuery({ page, count }, query, params);

        if (result.length > 0) {
            result = await Promise.all(
                result.map(async (item: any, index: number) => {
                    const employeeid = item['outsourceCreatedBy'];
                    if (employeeid && !isNaN(employeeid)) {
                        const packet = await new User(null, null, null, null, null).getUserDataById(employeeid);
                        if (packet.length > 0) {
                            item.createdby = packet[0]['username'];
                        }
                    }
                    return item;
                })
            )
        }
        return result;
    }
    calculateProfit(outorganizationid: number): number {
        throw new Error("Method not implemented.");
    }
    getOrganizationTest(testid: number, organizationid: number): [] {
        throw new Error("Method not implemented.");
    }

}



