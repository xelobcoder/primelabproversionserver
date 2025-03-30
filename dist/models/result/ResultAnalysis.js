"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../../../helper");
const customTestEntry_1 = require("../resultentry/customTestEntry");
const resultAnalysisQueries_1 = require("./resultAnalysisQueries");
const ResultAnalysisInterface_1 = require("./ResultAnalysisInterface");
const list_1 = require("../../testpanel/list");
const user_1 = __importDefault(require("../../LobnosAuth/user"));
/**
 * Class representing a result analysis for a specific employee.
 */
class ResultAnalysis {
    /**
     * Creates an instance of ResultAnalysis.
     * @param employeeid - The ID of the employee.
     * @throws {Error} If `employeeid` is not provided.
     */
    constructor(employeeid) {
        if (!employeeid) {
            throw new Error('employeeid is a necessity');
        }
        this.employeeid = employeeid;
    }
    async getTotalCaseCount(testid) {
        const [result] = await (0, helper_1.promisifyQuery)(`SELECT COUNT(*) AS casesCount FROM test_ascension WHERE testid = ?`, [testid]);
        return result['casesCount'];
    }
    async getTestMonthCount(testid, month) {
        const [row] = await (0, helper_1.promisifyQuery)(resultAnalysisQueries_1.q_test_month_case_count, [testid, month]);
        return row['caseCount'];
    }
    async getTestYearCount(testid, year) {
        const defaultYear = year || new Date().getFullYear();
        const [row] = await (0, helper_1.promisifyQuery)(resultAnalysisQueries_1.q_test_month_case_count_year, [testid, defaultYear]);
        return row['caseCount'];
    }
    async getTestMonthlyCount(testid) {
        const resultset = [];
        for (let month = 1; month <= 12; month++) {
            const casesCount = await this.getTestMonthCount(testid, month);
            resultset.push({ month: ResultAnalysisInterface_1.monthCollection[month], no: month, casesCount });
        }
        return resultset;
    }
    absoluteModeCalculation(currentMonthCases, nextMonthCases) {
        return nextMonthCases - currentMonthCases;
    }
    percentageModeCalculation(currentMonthCases, nextMonthCases) {
        if (currentMonthCases === 0 && nextMonthCases === 0)
            return '0%';
        if (nextMonthCases === 0)
            return `-${100}%`;
        if (currentMonthCases === 0)
            return '100%';
        const percentageChange = ((nextMonthCases - currentMonthCases) / currentMonthCases) * 100;
        return `${percentageChange.toFixed(2)}%`;
    }
    async calculateTestMonthChange(mode, testid) {
        const monthResultSet = await this.getTestMonthlyCount(testid);
        if (monthResultSet.length === 0)
            return [];
        for (let i = 0; i < monthResultSet.length - 1; i++) {
            const currentMonthCases = monthResultSet[i].casesCount;
            const nextMonthCases = monthResultSet[i + 1].casesCount;
            monthResultSet[i + 1].change = mode === 'percentage'
                ? this.percentageModeCalculation(currentMonthCases, nextMonthCases)
                : this.absoluteModeCalculation(currentMonthCases, nextMonthCases);
            if (monthResultSet[i + 1].change.toString().includes("-") || monthResultSet[i + 1].change == 0) {
                monthResultSet[i + 1]['state'] = 'negative';
            }
            else {
                monthResultSet[i + 1]['state'] = 'positive';
            }
        }
        monthResultSet.forEach(entry => entry.mode = mode);
        return monthResultSet;
    }
    async getAllTestMonthChangeForYear(mode) {
        const allTest = await new customTestEntry_1.CustomTest(null, null).getAllCustomTestList();
        const resultset = await Promise.all(allTest.map(async (item) => {
            const testid = item['id'];
            const testname = item['name'];
            if (testid) {
                const singleTestAnalysis = await this.calculateTestMonthChange(mode, testid);
                return { testid, data: singleTestAnalysis, testname };
            }
            return null;
        }));
        return resultset.filter(result => result !== null);
    }
    async dailyMonthTestCountByDailyBases(testid, month) {
        if (typeof month !== 'number') {
            throw new TypeError('number required');
        }
        const resultset = [];
        for (let day = 1; day <= 31; day++) {
            const [result] = await (0, helper_1.promisifyQuery)(resultAnalysisQueries_1.q_test_month_case_count_by_day, [testid, month, day]);
            resultset.push({ day, caseCount: result['caseCount'] });
        }
        return resultset;
    }
    async getResultValuesForMonth(testid, month) {
        const testname = await list_1.testpanel.getTestUsingTestid(testid);
        if (!testname)
            return testname;
        const testTable = list_1.testpanel.generatedTestTableName(testname);
        if (testTable) {
            const q = `SELECT field,value,billingid,patientid,employeeid,created_on FROM ${testTable} WHERE  MONTH(created_on) = ?`;
            let rows = await (0, helper_1.promisifyQuery)(q, [month]);
            if (rows.length > 0) {
                rows = await Promise.all(rows.map(async (result, index) => {
                    const { employeeid } = result;
                    if (!employeeid)
                        return result;
                    const ScientistData = await new user_1.default(null, null, null, null, null).getUserDataById(employeeid);
                    if (ScientistData.length === 0)
                        return result;
                    const { username } = ScientistData[0];
                    return Object.assign(Object.assign({}, result), { employeeid, username });
                }));
            }
            return rows;
        }
        return [];
    }
}
exports.default = ResultAnalysis;
