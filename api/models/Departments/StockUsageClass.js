const Departments = require("./DepartmentClass");

class StockUsage extends Departments{
  constructor(departmentid,stockid) {
    super(departmentid);
    this.stockid = stockid;
  }
}


module.exports = StockUsage;