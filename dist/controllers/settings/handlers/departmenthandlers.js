"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDeleteDepartment = exports.handleUpdateDepartment = exports.handleAddNewDepartment = exports.handleGetDepartments = void 0;
const settings_1 = require("../models/settings");
const handleGetDepartments = async (req, res) => {
    await (0, settings_1.getDepartments)(req, res);
};
exports.handleGetDepartments = handleGetDepartments;
const handleAddNewDepartment = async (req, res) => {
    await (0, settings_1.addNewDepartment)(req, res);
};
exports.handleAddNewDepartment = handleAddNewDepartment;
const handleUpdateDepartment = async (req, res) => {
    await (0, settings_1.updateDepartment)(req, res);
};
exports.handleUpdateDepartment = handleUpdateDepartment;
const handleDeleteDepartment = async (req, res) => {
    await (0, settings_1.deleteDepartment)(req, res);
};
exports.handleDeleteDepartment = handleDeleteDepartment;
// export const handleGetSpecificDepartment = async (req: Request, res: Response) => {
//   await getSpecificDepartment(req, res);
// };
