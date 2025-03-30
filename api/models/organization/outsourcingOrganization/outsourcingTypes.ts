export type OutSourcingOrganization = {
    name: string;
    organizationType: string,
    email: string,
    address: string,
    billingAddress: string,
    contactNumber: number,
    outsourceid?: number | string,
    employeeid: number,
    contactPerson: string
}



export type OutSourcingContract = {
    startdate: Date,
    enddate: Date,
    servicesConvered: string,
    BillingTerms: string,
    Discount: string,
}


export type ServicesItem = {
    test: string,
    testid: number,
    price: number
}

export type organizationDataServiceData = {
    outsourceid: number,
    generalTestId: number,
    outsourcePrice: number,
    employeeid: number
}

export interface IOutsourcingOrganization {
    basicInfo: OutSourcingOrganization,
    contract: OutSourcingContract,
    services: ServicesItem[]
}

export interface IOutSourcing {
    createOutSourceOrganization(outsource: OutSourcingOrganization): Promise<boolean | string>;
    updateOutsourceOrganization(outsource: OutSourcingOrganization): Promise<boolean | string>;
    calculateProfit(outorganizationid: number): number;
    getOrganizationTest(testid: number, organizationid: number): [];
}


export type serviceProvidedSummary = {
    outsourceid: number,
    testList: {
        generalTestId: number,
        outsourcePrice: number

    }[],
    employeeid: number
}


export interface FilterParams {
    page: number;
    count: number;
    searchValue?: string;
}