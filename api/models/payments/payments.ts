import { queries } from "./queries";
import { TransactionRecord, BillingInfo, TransactionData, ClientDebtTransaction } from "./interfaces";
import { customError, promisifyQuery, paginationQuery, rowAffected, responseError } from "../../../helper";
import logger from "../../../logger";

class Payment {
  private patientid: number;

  constructor(patientid: number) {
    this.patientid = patientid;
  }

  getClientTransactionInformation = async (records: TransactionRecord): Promise<TransactionData[]> => {
    try {
      const { patientid, from, to, count = 10, page = 1 } = records;
      const values: any[] = [];
      let modelQuery: string = queries.getClientTransactionInformation;

      if (patientid) {
        modelQuery += ` WHERE np.PATIENTID = ?`;
        values.push(parseInt(patientid.toString()));
      }

      if (from && patientid) {
        values.push(from);
        if (to) {
          modelQuery += ` AND DATE(b.billedon) BETWEEN ? AND ?`;
          values.push(to);
        } else {
          modelQuery += ` AND DATE(b.billedon) BETWEEN ? AND CURRENT_DATE`;
        }
      } else if (!patientid && from) {
        values.push(from);
        if (!to) {
          modelQuery += ` WHERE DATE(b.billedon) BETWEEN ? AND CURRENT_DATE`;
        } else {
          modelQuery += ` WHERE DATE(b.billedon) BETWEEN ? AND ?`;
          values.push(to);
        }
      }

      modelQuery += from || patientid ? ` ORDER BY b.billingid ASC LIMIT ? OFFSET ? ` : ` ORDER BY b.billingid DESC LIMIT ? OFFSET ? `;
      const result = await paginationQuery({ count, page }, modelQuery, values);
      return result as TransactionData[];
    } catch (err) {
      logger.error(err);
      throw new Error(err);
    }
  };

  getClientFullOutstanding = async (patientid: number, billingid: number): Promise<number> => {
    if (!billingid || !patientid) {
      throw new Error("patientid and billingid are required");
    }
    const modelQuery: string = queries.getClientFullOutstanding;
    const result = await promisifyQuery<BillingInfo[]>(modelQuery, [patientid]);
    if (result.length > 0) {
      const { total, paid } = result[0];
      return total - paid;
    }
    return 0;
  };

  getTransactionData = async (patientid: number): Promise<TransactionData[]> => {
    if (!patientid) {
      throw new Error("patientid not included");
    }
    const modelQuery: string = queries.getTransactionData;
    return promisifyQuery<TransactionData[]>(modelQuery, [patientid]);
  };

  allClientDebtTransactions = async (patientid: number): Promise<ClientDebtTransaction[]> => {
    if (!patientid) {
      throw new Error("patientid is required");
    }
    const modelQuery: string = queries.allClientDebtTransactions;
    return promisifyQuery<ClientDebtTransaction[]>(modelQuery, [patientid]);
  };

  updateSingleTransactionDebt = async (billingid: number, paid: number, outstanding: number): Promise<any> => {
    const model: string = queries.updateSingleTransactionDebt;
    try {
      return promisifyQuery<any>(model, [paid, outstanding, billingid]);
    } catch (err) {
      return err;
    }
  };

  updateTransactionHx = async (billingid: number, payment: string, amount: number, employeeid: number): Promise<any> => {
    const model: string = queries.updateTransactionHx;
    return promisifyQuery<any>(model, [billingid, payment, amount, employeeid]);
  };

  clearClientDebtBulk = async (patientid: number, amount: number, pymode: string, employeeid: number): Promise<boolean | string> => {
    try {
      if (!patientid) {
        throw new Error("patientid is required");
      }
      const debts = await this.allClientDebtTransactions(patientid);
      if (debts.length === 0) {
        return "No debts found for the patient"
      }
      const totalDebt = debts.reduce((total, item) => total + item.outstanding, 0);
      if (totalDebt === amount) {
        const result = await Promise.all(
          debts.map(async (item) => {
            const { outstanding, payable, billingid } = item;
            const dd = rowAffected(await this.updateSingleTransactionDebt(billingid, payable, 0));
            const tt = rowAffected(await this.updateTransactionHx(billingid, pymode, outstanding, employeeid));
            return dd && tt;
          })
        );
        return !result.some((a) => !a);
      }
      let balance = amount;
      for (const item of debts) {
        if (balance <= 0) break;
        const { outstanding, paid, payable, discount, billingid } = item;
        if (outstanding > balance) {
          const paidAmount = parseFloat(paid) + balance;
          const newOutstanding = parseFloat(payable) - (parseFloat(discount) + parseFloat(paid) + parseFloat(balance));
          await this.updateSingleTransactionDebt(billingid, paidAmount, newOutstanding);
          await this.updateTransactionHx(billingid, pymode, balance, employeeid);
          balance = 0;
        } else {
          await this.updateSingleTransactionDebt(billingid, payable, 0);
          await this.updateTransactionHx(billingid, pymode, outstanding, employeeid);
          balance -= outstanding;
        }
      }
      return true;
    } catch (err) {
      throw new Error(err);
    }
  };

  updatePayment = async (request: any, response: any): Promise<void> => {
    try {
      const { billingid, pay, paymentMode } = request.body;
      const result = await promisifyQuery(queries.updatePayment, [billingid]);
      if (result.length === 0) {
        throw new Error("No such transaction found");
      }
      const { paid_amount, discount, outstanding, payable } = result[0];
      if (outstanding <= 0) {
        response.send({ status: "success", statusCode: 200, message: "Client is in good standing" });
        return;
      }
      const newAmount = paid_amount + parseInt(pay);
      const notOutstanding = payable - newAmount - discount;
      const updateQuery = queries.updatePaymentUpdate;
      const values = [notOutstanding, newAmount, billingid];
      const updateInfo = await promisifyQuery(updateQuery, values);
      if (!rowAffected(updateInfo)) {
        throw new Error("Failed to update payment");
      }
      const inserted = await promisifyQuery(queries.insertBillingHx, [billingid, paymentMode, pay]);
      if (!rowAffected(inserted)) {
        throw new Error("Failed to insert payment history");
      }
      response.send({ message: "Payment updated successfully", statusCode: 200, status: "success" });
    } catch (err) {
      customError(err.message || "Something went wrong", 500, response);
    }
  };

  paymentMode = async (request: any, response: any): Promise<void> => {
    try {
      const result = await promisifyQuery(queries.paymentMode);
      response.send({ data: result || [], status: "success", statusCode: 200 });
    } catch (err) {
      customError("Something went wrong", 500, response);
    }
  };

  specificBillTransactionHx = async (request: any, response: any): Promise<void> => {
    try {
      const { billingid } = request.query;
      if (!billingid) {
        customError("billingid is required as a query parameter", 401, response);
        return;
      }
      const result = await promisifyQuery(queries.specificBillTransactionHx, [billingid]);
      response.send(result);
    } catch (err) {
      customError("Something went wrong", 500, response);
    }
  };
}

export default Payment;
