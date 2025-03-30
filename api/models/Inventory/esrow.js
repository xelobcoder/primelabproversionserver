const {promisifyQuery,rowAffected}  = require('../../../helper')
class Escrow {
  constructor(requisitionid) {
    this.requisitionid = requisitionid;
  }

  async getEsrowReqt() {
    if (!this.requisitionid) throw new Error("requisition id is required")
    return await promisifyQuery(`SELECT * FROM stocksesrow WHERE requisitionid = ?`, [this.requisitionid])
  }


  async pushNewGenDebitHx(record){
    const { stockid, brandid, productordersid, debitqty, batchnumber,departmentid} = record;

    const query = `INSERT INTO 
          generalstoredebithx(stockid,batchnumber,brandid,productordersid,debitqty,departmentid)
          VALUES(?,?,?,?,?,?)`;
    const values = [stockid, batchnumber, brandid, productordersid, debitqty, departmentid];
    const result = await promisifyQuery(query, values);
    return rowAffected(result);
  }


  async updateEscrow(requisitionid, status) {
    if (!requisitionid || !status) {
      return new Error('requisitionid and status not included');
    }
    let query = `UPDATE stocksesrow SET status = ?`
    if (status === 'received') {
      query += ` ,receivedon = NOW()`;
    }
    query += ` WHERE requisitionid = ?`;
    
    return rowAffected(await promisifyQuery(query, [status, requisitionid]));
  }

}


module.exports = Escrow;