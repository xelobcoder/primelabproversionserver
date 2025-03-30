import { Response } from "express";
import InventoryAnalytics from "../inventoryAnalytics/inventoryAnalytics";
import Wastage from "../wastage/wastageInventory";

const analytics = new InventoryAnalytics(null, null);
const wastage = new Wastage(null);

const urgentActions = async (action: string, response: Response) => {
  try {
    if (action === "nearexpiry") {
      let result = await analytics.getNearExpiry();

      const newArray = await Promise.all(
        result.map(async (item) => {
          const { batchnumber, brand, stockid } = item;
          const tt = await wastage.calculateProductInstock(stockid, brand, batchnumber);
          return { ...item, qty_in_stock: tt };
        })
      );

      // Ensure unique stocks
      const uniqueArray = newArray.filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.batchnumber === item.batchnumber && t.brand === item.brand && t.stockid === item.stockid)
      );

      response.send({ result: uniqueArray, status: "success" });
    } else if (action === "expired") {
      let result = await analytics.getExpiredCount();

      result = await Promise.all(
        result.map(async (item) => {
          const { batchnumber, stockid, brand, receiveddate, expirydate, quantityReceived, name, expiredDisposed } = item;
          let amtInstock = 0;

          if (expiredDisposed === 1) {
            amtInstock = await wastage.calcalulateWastageTotal(stockid, brand, batchnumber);
          } else {
            const tt = await wastage.calculateProductInstock(stockid, brand, batchnumber);
            amtInstock = tt;
          }

          return { receiveddate, batchnumber, expirydate, quantityReceived, name, expiredqty: amtInstock, expiredDisposed };
        })
      );
      response.send({ result, status: "success" });
    } else if (action === "belowalert") {
      const result = await analytics.getBelowAlert();
      response.send({ result, status: "success" });
    } else if (action === "uncompletedorders") {
      const result = await analytics.getIncompOrdersCount(false);
      response.send({ result, status: "success" });
    } else if (action === "completedorders") {
      const result = await analytics.completeOrdersCount(false);
      response.send({ result, status: "success" });
    } else {
      response.send({ result: [], status: "warning" });
    }
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
};

export default urgentActions;
