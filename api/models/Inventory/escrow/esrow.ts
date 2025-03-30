import { promisifyQuery, rowAffected } from "../../../../helper"; // Adjust the path as per your project structure
import * as queries from "./queries";

class Escrow {
  requisitionid: number;

  constructor(requisitionid: number) {
    this.requisitionid = requisitionid;
  }

  async getEsrowReqt() {
    if (!this.requisitionid) throw new Error("Requisition id is required");
    return await promisifyQuery(queries.q_getEsrowReqt, [this.requisitionid]);
  }

  async pushNewGenDebitHx(record: any) {
    const { stockid, brandid, productordersid, debitqty, batchnumber, departmentid } = record;
    const query = queries.q_pushNewGenDebitHx;
    const values = [stockid, batchnumber, brandid, productordersid, debitqty, departmentid];
    const result = await promisifyQuery(query, values);
    return rowAffected(result);
  }

  async updateEscrow(requisitionid: number, status: string) {
    if (!requisitionid || !status) {
      throw new Error("Requisition id and status are required");
    }

    let query = queries.q_updateEscrow.replace("{{ifReceived}}", status === "received" ? ", receivedon = NOW()" : "");
    return rowAffected(await promisifyQuery(query, [status, requisitionid]));
  }
}

export default Escrow;
