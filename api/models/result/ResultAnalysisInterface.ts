/**
 * Interface representing the methods available in the ResultAnalysis class.
 */
export interface IResultAnalysis {
    /**
     * Retrieves the total case count for a given test ID.
     * @param testid - The ID of the test.
     * @returns {Promise<number>} The total number of cases for the test.
     */
    getTotalCaseCount(testid: number): Promise<number>;

    /**
     * Retrieves the monthly case count for a given test ID.
     * @param testid - The ID of the test.
     * @returns {Promise<MonthlyCaseData[]>} 
     * An array of objects representing case counts for each month.
     */
    getTestMonthlyCount(testid: number): Promise<MonthlyCaseData[]>;

    /**
     * Calculates the change in case count between months for a given test ID.
     * @param mode - The mode of calculation ('absolute' or 'percentage').
     * @param testid - The ID of the test.
     * @returns {Promise<MonthlyCaseData[]>} An array of objects representing the change in case count for each month.
     */
    calculateTestMonthChange(mode: "absolute" | "percentage", testid: number): Promise<MonthlyCaseData[]>;

    /**
     * Retrieves the change in case count for all tests for the year.
     * @param mode - The mode of calculation ('percentage' or 'absolute').
     * @returns {Promise<Record<number, MonthlyCaseData[]>[]>} An array of objects where each object contains a test ID and its corresponding monthly change data.
     */
    getAllTestMonthChangeForYear(mode: 'percentage' | "absolute"): Promise<Record<number, MonthlyCaseData[]>[]>;

    /**
     * Retrieves the daily case count for a given test ID and month.
     * @param testid - The ID of the test.
     * @param month - The month number (1-12).
     * @returns {Promise<{ day: number, caseCount: number }[]>} 
     * An array of objects representing daily case counts for the given month.
     * @throws {TypeError} If `month` is not a number.
     */
    dailyMonthTestCountByDailyBases(testid: number, month: number): Promise<{ day: number, caseCount: number }[]>;
}

/**
 * Interface representing monthly case data.
 */
export interface MonthlyCaseData {
    month: string;
    no: number;
    casesCount: number;
    change?: number | string;
    mode?: 'absolute' | 'percentage';
}


export const monthCollection = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December",
};
