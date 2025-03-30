const { promisifyQuery } = require("../../../helper");
class HR {
                  constructor(employeeid) {
                                    this.employeeid = employeeid;
                  }

                  get newEmployeeid() {
                                    return this.employeeid;

                  }
                  set newEmployeeid(employeeid) {
                                    this.employeeid = employeeid;
                  }

}




module.exports = HR;


