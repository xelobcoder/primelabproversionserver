import { promisifyQuery } from '../../../helper';
import { CustomTest } from '../resultentry/customTestEntry';
import { q_test_month_case_count, q_test_month_case_count_by_day, q_test_month_case_count_year } from './resultAnalysisQueries';
import { IResultAnalysis, MonthlyCaseData, monthCollection } from './ResultAnalysisInterface';
import { testpanel } from '../../testpanel/list';
import User from '../../LobnosAuth/user';

/**
 * Class representing a result analysis for a specific employee.
 */
export default class ResultAnalysis implements IResultAnalysis {
    /** Employee ID associated with this instance. */
    readonly employeeid: number;

    /**
     * Creates an instance of ResultAnalysis.
     * @param employeeid - The ID of the employee.
     * @throws {Error} If `employeeid` is not provided.
     */
    constructor(employeeid: number) {
        if (!employeeid) {
            throw new Error('employeeid is a necessity');
        }
        this.employeeid = employeeid;
    }

    async getTotalCaseCount(testid: number): Promise<number> {
        const [result] = await promisifyQuery(`SELECT COUNT(*) AS casesCount FROM test_ascension WHERE testid = ?`, [testid]);
        return result['casesCount'];
    }

    private async getTestMonthCount(testid: number, month: number): Promise<number> {
        const [row] = await promisifyQuery(q_test_month_case_count, [testid, month]);
        return row['caseCount'];
    }

    private async getTestYearCount(testid: number, year: number): Promise<number> {
        const defaultYear = year || new Date().getFullYear();
        const [row] = await promisifyQuery(q_test_month_case_count_year, [testid, defaultYear]);
        return row['caseCount'];
    }

    public async getTestMonthlyCount(testid: number): Promise<MonthlyCaseData[]> {
        const resultset: MonthlyCaseData[] = [];
        for (let month = 1; month <= 12; month++) {
            const casesCount = await this.getTestMonthCount(testid, month);
            resultset.push({ month: monthCollection[month], no: month, casesCount });
        }
        return resultset;
    }

    private absoluteModeCalculation(currentMonthCases: number, nextMonthCases: number): number {
        return nextMonthCases - currentMonthCases;
    }

    private percentageModeCalculation(currentMonthCases: number, nextMonthCases: number): string {
        if (currentMonthCases === 0 && nextMonthCases === 0) return '0%';
        if (nextMonthCases === 0) return `-${100}%`;
        if (currentMonthCases === 0) return '100%';

        const percentageChange = ((nextMonthCases - currentMonthCases) / currentMonthCases) * 100;
        return `${percentageChange.toFixed(2)}%`;
    }

    public async calculateTestMonthChange(mode: "absolute" | "percentage", testid: number): Promise<MonthlyCaseData[]> {
        const monthResultSet = await this.getTestMonthlyCount(testid);

        if (monthResultSet.length === 0) return [];

        for (let i = 0; i < monthResultSet.length - 1; i++) {
            const currentMonthCases = monthResultSet[i].casesCount;
            const nextMonthCases = monthResultSet[i + 1].casesCount;

            monthResultSet[i + 1].change = mode === 'percentage'
                ? this.percentageModeCalculation(currentMonthCases, nextMonthCases)
                : this.absoluteModeCalculation(currentMonthCases, nextMonthCases);

            if (monthResultSet[i + 1].change.toString().includes("-") || monthResultSet[i + 1].change == 0) {
                monthResultSet[i + 1]['state'] = 'negative';
            } else {
                monthResultSet[i + 1]['state'] = 'positive';
            }
        }

        monthResultSet.forEach(entry => entry.mode = mode);
        return monthResultSet;
    }

    public async getAllTestMonthChangeForYear(mode: 'percentage' | "absolute"): Promise<Record<number, MonthlyCaseData[]>[]> {
        const allTest = await new CustomTest(null, null).getAllCustomTestList();
        const resultset = await Promise.all(
            allTest.map(async (item) => {
                const testid = item['id'];
                const testname = item['name'];
                if (testid) {
                    const singleTestAnalysis = await this.calculateTestMonthChange(mode, testid);
                    return { testid, data: singleTestAnalysis, testname };
                }
                return null;
            })
        );

        return resultset.filter(result => result !== null) as Record<number, MonthlyCaseData[]>[];
    }

    public async dailyMonthTestCountByDailyBases(testid: number, month: number): Promise<{ day: number, caseCount: number }[]> {
        if (typeof month !== 'number') {
            throw new TypeError('number required');
        }

        const resultset = [];
        for (let day = 1; day <= 31; day++) {
            const [result] = await promisifyQuery(q_test_month_case_count_by_day, [testid, month, day]);
            resultset.push({ day, caseCount: result['caseCount'] });
        }
        return resultset;
    }



    public async getResultValuesForMonth(testid: number, month: number): Promise<[]> {
        const testname = await testpanel.getTestUsingTestid(testid);
        if (!testname) return testname;
        const testTable = testpanel.generatedTestTableName(testname);
        if (testTable) {
            const q = `SELECT field,value,billingid,patientid,employeeid,created_on FROM ${testTable} WHERE  MONTH(created_on) = ?`;
            let rows = await promisifyQuery(q, [month]);
            if (rows.length > 0) {
                rows = await Promise.all(rows.map(async (result: any, index: number) => {
                    const { employeeid } = result;
                    if (!employeeid) return result;
                    const ScientistData = await new User(null, null, null, null, null).getUserDataById(employeeid);
                    if (ScientistData.length === 0) return result;
                    const { username } = ScientistData[0];
                    return {...result,employeeid,username}
                }))
            }
            return rows;
        }
        return []
    }
}



