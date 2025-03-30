const { promisifyQuery } = require("../../../helper");
const ApplicationSettings = require("../application/appsettings/appset");
export class CustomTest {
  private billingid: number;
  private testname: string;
  constructor(billingid: number, testname: string) {
    this.billingid = billingid;
    this.testname = testname;
  }

  public async getAllCustomTestList() {
    const query = `SELECT * FROM test_panels WHERE iscustom = 1`;
    return await promisifyQuery(query);
  }

  public async isCustomTest(testname) {
    if (!testname) throw new Error("testname required");
    const query = `SELECT * FROM test_panels WHERE name = ?`;
    const result = await promisifyQuery(query, [testname]);
    if (result.length === 0) return null;
    return result[0]["iscustom"] == 1;
  }
}


