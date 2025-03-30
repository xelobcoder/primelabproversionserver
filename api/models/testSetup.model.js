const  { promisifyQuery, customError } =require('../../helper')
const  logger =  require("../../logger");
class TestSetup {
  constructor(testname) {
    this.testname = testname;
  }


  isValidTestname() {
    return (this.testname in setups) ? true : false;
  }

  async getSetupLiterature(testid) {
    return await promisifyQuery(`SELECT * FROM setupliteraturereview WHERE testid = ?`, [testid])
  }

  async updateSetupLiterature(literature, testid) {
    return await promisifyQuery(`UPDATE setupliteraturereview SET literature = ? WHERE testid = ?`, [literature, parseInt(testid)])
  }

  async canUseLiterature(testid) {
    const data = await promisifyQuery(`SELECT useLiterature from testdetails WHERE testid = ?`, [testid]);
    if (data.length == 0) return false;
    const { useLiterature } = data[0];
    return useLiterature == 1 ? true : false;
  }

  async getResultLiterature(testid) {
    if (await this.canUseLiterature(testid)) {
      const dataset = await this.getSetupLiterature(testid);
      if (dataset.length > 0) {
        return { can: true, literature: dataset[0]['literature'] }
      }
    }
    return { can: false }
  }

  async createSetupLiterature(literature, testname) { 
    try {
      // check if testname exist in the table
    const isNameExist = await this.getSetupLiterature(testname);
    if (isNameExist.length > 0) {
      return await this.updateSetupLiterature(literature, testname);
    } else {
      return await promisifyQuery(`INSERT INTO setupliteraturereview (testname,literature) VALUES(?,?)`, [this.testname || testname, literature])
    }
    } catch (err) {
      logger.error(err);
      throw new Error(err?.message || 'something went wrong');
    }
  }


  async getSetupRecords() { 
    try {
      return await promisifyQuery(`SELECT * FROM ${setups[this.testname]}`);
    } catch (err) {
      logger.error(err);
      return [];
    }
  }

  async validateRecords(records) { 
    if (Array.isArray(records) && records.length > 0) {
      const result = records.map((item) => {
        const values = Object.values(item.toString().trim());
        return (values.includes(undefined) || values.includes(null) || values.includes('') || values.length === 0) ? false : true;
      });
    return result.includes(false) ? false : true;
    } 
  }

 
}
 



module.exports = TestSetup;