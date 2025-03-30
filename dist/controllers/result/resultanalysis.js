"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlergetTestResultValuesForMonth = exports.handlergetAllTestYearlyAnalysis = exports.handlergetTestMonthlyCountForYear = exports.handlergetTestTotalCasesMonthDaily = exports.handlerTestTotalCasesCount = void 0;
const ResultAnalysis_1 = __importDefault(require("../../models/result/ResultAnalysis"));
const helper_1 = require("../../../helper");
async function handlerTestTotalCasesCount(request, response) {
    try {
        let { employeeid, testid } = request.query;
        if (!employeeid || !testid) {
            throw new Error('employeeid,month && testid required');
        }
        let parsedTestid = parseInt(testid.toString());
        const total = await new ResultAnalysis_1.default(parseInt(employeeid.toString())).getTotalCaseCount(parsedTestid);
        response.send({ casesCount: total });
    }
    catch (err) {
        console.log(err);
        (0, helper_1.responseError)(response);
    }
}
exports.handlerTestTotalCasesCount = handlerTestTotalCasesCount;
async function handlergetTestTotalCasesMonthDaily(request, response) {
    try {
        let { employeeid, testid, month } = request.query;
        const isRight = employeeid && testid && month;
        if (!isRight)
            throw new Error('employeeid && month && testid required');
        const parsedEmployeeid = parseInt(employeeid.toString());
        const parsedTestid = parseInt(testid.toString());
        const parsedMonth = parseInt(month.toString());
        if (parsedEmployeeid && parsedTestid && parsedMonth) {
            const result = await new ResultAnalysis_1.default(parsedEmployeeid).dailyMonthTestCountByDailyBases(parsedTestid, parsedMonth);
            response.send(result);
        }
    }
    catch (err) {
        (0, helper_1.responseError)(response);
    }
}
exports.handlergetTestTotalCasesMonthDaily = handlergetTestTotalCasesMonthDaily;
async function handlergetTestMonthlyCountForYear(request, response) {
    try {
        let { employeeid, testid, month } = request.query;
        const isRight = employeeid && testid && month;
        if (!isRight)
            throw new Error('employeeid && month && testid required');
        const parsedEmployeeid = parseInt(employeeid.toString());
        const parsedTestid = parseInt(testid.toString());
        const parsedMonth = parseInt(month.toString());
        if (parsedEmployeeid && parsedTestid && parsedMonth) {
            const result = await new ResultAnalysis_1.default(parsedEmployeeid).getTestMonthlyCount(parsedTestid);
            response.send(result);
        }
    }
    catch (err) {
        console.log(err);
        (0, helper_1.responseError)(response);
    }
}
exports.handlergetTestMonthlyCountForYear = handlergetTestMonthlyCountForYear;
async function handlergetAllTestYearlyAnalysis(request, response) {
    try {
        let { employeeid } = request.query;
        const parsedEmployeeid = parseInt(employeeid.toString());
        const resultv = await new ResultAnalysis_1.default(parsedEmployeeid).getAllTestMonthChangeForYear('percentage');
        response.send(resultv);
    }
    catch (err) {
        console.log(err);
        (0, helper_1.responseError)(response);
    }
}
exports.handlergetAllTestYearlyAnalysis = handlergetAllTestYearlyAnalysis;
async function handlergetTestResultValuesForMonth(request, response) {
    try {
        let { employeeid, month, testid } = request.query;
        if (!employeeid || !month || !testid) {
            return (0, helper_1.customError)('month and employeeid must be provided in query', 400, response);
        }
        const parsedEmployeeid = parseInt(employeeid.toString());
        const parsedTestid = parseInt(testid.toString());
        const parsedMonth = parseInt(month.toString());
        const resultv = await new ResultAnalysis_1.default(parsedEmployeeid).getResultValuesForMonth(parsedTestid, parsedMonth);
        if (!resultv)
            return response.send({ error: 'test not found' });
        response.send(resultv);
    }
    catch (err) {
        console.log(err);
        (0, helper_1.responseError)(response);
    }
}
exports.handlergetTestResultValuesForMonth = handlergetTestResultValuesForMonth;
