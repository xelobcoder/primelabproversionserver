export const enum concesMode {
    percentage = "percentage",
    absolute = "absolute",
    none = "none"
}

type testArrayType = {
    concessionMode: string,
    concessionValue: number | string,
    price: number
}

export type createRule = {
    organizationid: number;
    useCustomLetterHeadings: boolean,
    hasConcessionAppliedAcross: boolean,
    concessionMode: concesMode,
    concessionValue: number,
    employeeid: number,
    haveDifferentPriceList: boolean,
    testList: testArrayType[] | {discountedValue:number,id:number} []

}