"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inventoryAnalytics_1 = __importDefault(require("../inventoryAnalytics/inventoryAnalytics"));
const wastageInventory_1 = __importDefault(require("../wastage/wastageInventory"));
const analytics = new inventoryAnalytics_1.default(null, null);
const wastage = new wastageInventory_1.default(null);
const urgentActions = async (action, response) => {
    try {
        if (action === "nearexpiry") {
            let result = await analytics.getNearExpiry();
            const newArray = await Promise.all(result.map(async (item) => {
                const { batchnumber, brand, stockid } = item;
                const tt = await wastage.calculateProductInstock(stockid, brand, batchnumber);
                return Object.assign(Object.assign({}, item), { qty_in_stock: tt });
            }));
            // Ensure unique stocks
            const uniqueArray = newArray.filter((item, index, self) => index === self.findIndex((t) => t.batchnumber === item.batchnumber && t.brand === item.brand && t.stockid === item.stockid));
            response.send({ result: uniqueArray, status: "success" });
        }
        else if (action === "expired") {
            let result = await analytics.getExpiredCount();
            result = await Promise.all(result.map(async (item) => {
                const { batchnumber, stockid, brand, receiveddate, expirydate, quantityReceived, name, expiredDisposed } = item;
                let amtInstock = 0;
                if (expiredDisposed === 1) {
                    amtInstock = await wastage.calcalulateWastageTotal(stockid, brand, batchnumber);
                }
                else {
                    const tt = await wastage.calculateProductInstock(stockid, brand, batchnumber);
                    amtInstock = tt;
                }
                return { receiveddate, batchnumber, expirydate, quantityReceived, name, expiredqty: amtInstock, expiredDisposed };
            }));
            response.send({ result, status: "success" });
        }
        else if (action === "belowalert") {
            const result = await analytics.getBelowAlert();
            response.send({ result, status: "success" });
        }
        else if (action === "uncompletedorders") {
            const result = await analytics.getIncompOrdersCount(false);
            response.send({ result, status: "success" });
        }
        else if (action === "completedorders") {
            const result = await analytics.completeOrdersCount(false);
            response.send({ result, status: "success" });
        }
        else {
            response.send({ result: [], status: "warning" });
        }
    }
    catch (error) {
        response.status(500).send({ error: error.message });
    }
};
exports.default = urgentActions;
