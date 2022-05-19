const logger = require('pino')();
const knex = require('../config/database');
const Joi = require('joi');

module.exports.createScheme = async (req, res) => {
  const { data } = req;
  try {
    const schemaAvailable = await knex.from('APSISIPDC.cr_schema').select('id').where('scheme_name', data.scheme_name)
    const schemaId = schemaAvailable[0].id;
    if (!schemaId) {
      const createScheme = await knex(
        'APSISIPDC.cr_schema',
      ).insert(data);
      return res.status(201).send({
        "success": true,
        "message": "Success :: scheme created!",
        "response": createScheme
      });
    }
    else {
      return res.status(400).send({
        "success": false,
        "message": "Fail :: scheme not created ",
        "response": "Schema name already Available"
      });
    }

  }
  catch (error) {
    return res.status(500).send({
      "success": false,
      "message": "Fail :: scheme not created ",
      "response": error
    });
  }

}