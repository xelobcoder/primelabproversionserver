"use strict";
// src/expenseRoutes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const node_path_1 = __importDefault(require("node:path"));
const expenseHandlers_1 = require("./expenseHandlers");
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "api/uploads/receipts");
    },
    filename: function (req, file, cb) {
        cb(null, req.query.id + "-" + Date.now() + node_path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({ storage: storage });
router.post("/api/v1/expenses", expenseHandlers_1.generateNewExpense);
router.get("/api/v1/expenses/records", expenseHandlers_1.getExpensesRecord);
router.get("/api/v1/expenses/record/single", expenseHandlers_1.getSingleExpense);
router.post("/api/v1/expenses/receipt/upload", upload.array("images", 10), expenseHandlers_1.uploadReceipts);
router.get("/api/v1/expenses/receipt/upload/images", expenseHandlers_1.getReceiptImage);
router.get("/api/v1/expenses/receipt/uploaded/images/list", expenseHandlers_1.getExpenseImageList);
router.delete("/api/v1/expenses/receipt/uploaded/images", expenseHandlers_1.deleteReceiptsList);
router.post("/api/v1/expense/pending/decision", expenseHandlers_1.updateExpenseDecision);
router.post("/api/v1/expense/new/category", expenseHandlers_1.createExpenseCategory);
router.put("/api/v1/expense/new/category", expenseHandlers_1.updateExpenseCategory);
router.get("/api/v1/expense/get/category", expenseHandlers_1.getAllExpenseCategory);
exports.default = router;
