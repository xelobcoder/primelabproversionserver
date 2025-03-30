"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.q_get_test_ascension_name_and_id = exports.update_creation_query = exports._comments_query = exports.getGenderQuery = exports.testCreationRule = void 0;
exports.testCreationRule = "SELECT creationrule FROM customtestcreation WHERE testid = ?";
exports.getGenderQuery = "SELECT gender,age,agetype FROM new_patients WHERE patientid = ?";
exports._comments_query = "SELECT comments FROM result_comments WHERE billingid = ? AND testid = ?";
exports.update_creation_query = "UPDATE customtestcreation SET creationrule = ? WHERE testid = ?";
exports.q_get_test_ascension_name_and_id = `SELECT tp.name,ta.testid FROM test_ascension AS ta INNER JOIN test_panels AS tp ON tp.id = ta.testid WHERE ta.billingid = ?`;
