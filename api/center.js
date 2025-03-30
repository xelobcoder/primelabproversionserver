const { promisifyQuery } = require("../helper");


const getAllSamplingCenters = async (req, res) => {
   try {
      let query = "SELECT * FROM branch";
      const result = await promisifyQuery(query);
      res.status(200).send(result);
   } catch (err) {
      res.status(500).send(err);
   }
}







module.exports = {
   getAllSamplingCenters
}