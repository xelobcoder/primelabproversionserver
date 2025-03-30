"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomTest = void 0;
const { promisifyQuery } = require("../../../helper");
const ApplicationSettings = require("../application/appsettings/appset");
class CustomTest {
    constructor(billingid, testname) {
        this.billingid = billingid;
        this.testname = testname;
    }
    async getAllCustomTestList() {
        const query = `SELECT * FROM test_panels WHERE iscustom = 1`;
        return await promisifyQuery(query);
    }
    async isCustomTest(testname) {
        if (!testname)
            throw new Error("testname required");
        const query = `SELECT * FROM test_panels WHERE name = ?`;
        const result = await promisifyQuery(query, [testname]);
        if (result.length === 0)
            return null;
        return result[0]["iscustom"] == 1;
    }
}
exports.CustomTest = CustomTest;
