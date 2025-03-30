import ApplicationSettings from "../appsettings/appset"; // Assuming ApplicationSettings is a class
import { promisifyQuery, rowAffected, responseError } from "../../../../helper";
import { GET_RESULT_SETTINGS, INSERT_RESULT_SETTINGS, UPDATE_RESULT_SETTINGS } from "./queries";

class ResultSettings extends ApplicationSettings {
  constructor(id: number) {
    super();
  }

  async getResultSettings(request: any, response: any): Promise<void> {
    try {
      let result = await promisifyQuery(GET_RESULT_SETTINGS);

      if (result.length !== 0) {
        result = result[0]["resultsettings"];
        response.send(result);
      } else {
        response.send({});
      }
    } catch (err) {
      responseError(response);
    }
  }

  async updateResultSettings(request: any, response: any): Promise<void> {
    try {
      const { data } = request.body;

      if (!data) {
        return responseError(response, "data object required", 404);
      }

      if (Object.keys(data).length === 0) {
        return responseError(response, "type object with key values required", 404);
      }

      const jsonify = JSON.stringify(data);

      let result = await promisifyQuery(GET_RESULT_SETTINGS);

      if (result.length === 0) {
        const insert = await promisifyQuery(INSERT_RESULT_SETTINGS, [jsonify]);
        if (rowAffected(insert)) {
          response.send({ status: "success", message: "update successful" });
        } else {
          response.send({ status: "error", message: "update failed" });
        }
      } else {
        const update = await promisifyQuery(UPDATE_RESULT_SETTINGS, [jsonify]);
        if (rowAffected(update)) {
          response.send({ status: "success", message: "update successful" });
        } else {
          response.send({ status: "error", message: "update failed" });
        }
      }
    } catch (err) {
      console.error(err);
      responseError(response);
    }
  }
}

export default ResultSettings;
