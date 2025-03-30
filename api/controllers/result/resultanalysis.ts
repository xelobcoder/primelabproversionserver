import ResultAnalysis from "../../models/result/ResultAnalysis";
import { Request, Response } from "express";
import { responseError, customError } from '../../../helper';

export async function handlerTestTotalCasesCount(request: Request, response: Response) {
    try {
        let { employeeid, testid } = request.query;
        if (!employeeid || !testid) {
            throw new Error('employeeid,month && testid required');
        }
        let parsedTestid = parseInt(testid.toString());
        const total = await new ResultAnalysis(parseInt(employeeid.toString())).getTotalCaseCount(parsedTestid);
        response.send({ casesCount: total })
    } catch (err) {
        console.log(err)
        responseError(response);
    }
}




export async function handlergetTestTotalCasesMonthDaily(request: Request, response: Response) {
    try {
        let { employeeid, testid, month } = request.query;
        const isRight = employeeid && testid && month;
        if (!isRight) throw new Error('employeeid && month && testid required');

        const parsedEmployeeid = parseInt(employeeid.toString());
        const parsedTestid = parseInt(testid.toString());
        const parsedMonth = parseInt(month.toString());

        if (parsedEmployeeid && parsedTestid && parsedMonth) {
            const result = await new ResultAnalysis(parsedEmployeeid).dailyMonthTestCountByDailyBases(parsedTestid, parsedMonth);
            response.send(result);
        }

    } catch (err) {
        responseError(response);
    }
}



export async function handlergetTestMonthlyCountForYear(request: Request, response: Response) {
    try {
        let { employeeid, testid, month } = request.query;
        const isRight = employeeid && testid && month;
        if (!isRight) throw new Error('employeeid && month && testid required');

        const parsedEmployeeid = parseInt(employeeid.toString());
        const parsedTestid = parseInt(testid.toString());
        const parsedMonth = parseInt(month.toString());

        if (parsedEmployeeid && parsedTestid && parsedMonth) {
            const result = await new ResultAnalysis(parsedEmployeeid).getTestMonthlyCount(parsedTestid);
            response.send(result)
        }

    } catch (err) {
        console.log(err)
        responseError(response);
    }
}


export async function handlergetAllTestYearlyAnalysis(request: Request, response: Response) {
    try {
        let { employeeid } = request.query;
        const parsedEmployeeid = parseInt(employeeid.toString());
        const resultv = await new ResultAnalysis(parsedEmployeeid).getAllTestMonthChangeForYear('percentage');
        response.send(resultv);

    } catch (err) {
        console.log(err)
        responseError(response);
    }
}

export async function handlergetTestResultValuesForMonth(request: Request, response: Response) {
    try {
        let { employeeid, month, testid } = request.query;
        if (!employeeid || !month || !testid) {
            return customError('month and employeeid must be provided in query', 400, response);
        }

        const parsedEmployeeid = parseInt(employeeid.toString());
        const parsedTestid = parseInt(testid.toString());
        const parsedMonth = parseInt(month.toString());
        const resultv = await new ResultAnalysis(parsedEmployeeid).getResultValuesForMonth(parsedTestid, parsedMonth);
        if (!resultv) return response.send({ error: 'test not found' });
        response.send(resultv);

    } catch (err) {
        console.log(err)
        responseError(response);
    }
}