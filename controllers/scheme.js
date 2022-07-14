const knex = require("../config/database");
const Joi = require("joi");
const { sendApiResult } = require("./helperController");

module.exports.createScheme = async (req, res) => {
  const { data } = req;
  const schemaAvailable = await knex
    .from("APSISIPDC.cr_schema")
    .select("id")
    .where("scheme_name", data.scheme_name);

  try {
    const schemaId = schemaAvailable[0]?.id ?? false;
    if (!schemaId) {
      const createScheme = await knex("APSISIPDC.cr_schema").insert(data);
      return res.status(201).send({
        success: true,
        message: "Success :: scheme created!",
        response: createScheme,
      });
    } else {
      return res.status(400).send({
        success: false,
        message: "Fail :: scheme not created",
        response: "Schema name already Available",
      });
    }
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Fail :: scheme not created ",
      response: error,
    });
  }
};

module.exports.getSchemes = async (req, res) => {
  const schemas = await knex.from("APSISIPDC.cr_schema").select();
  return res.status(200).send({
    success: true,
    message: "Success :: Available scheme list ",
    data: schemas,
  });
};


module.exports.getSchemesListSlab = async (req, res) => {
  // return await knex.from("APSISIPDC.cr_schema").select().where("id", id);
  // console.log("helllooo allll")
  const schemas = await knex.from("APSISIPDC.cr_schema").select("id","scheme_name").where("transaction_type","SLAB");
  return res.status(200).send({
    success: true,
    message: "Success :: Available scheme list ",
    data: schemas,
  });
};

module.exports.getSlabListSchme = async (req, res) => {
  const { id } = req.params;
  const schemas = await knex.from("APSISIPDC.cr_slab").select().where("scheme_id",id);
  return res.status(200).send({
    success: true,
    message: "Success :: Available scheme list ",
    data: schemas,
  });
};


module.exports.getSchemeDetails = async (req, res) => {
  const { id } = req.params;
  const schemaDeatils = await knex
    .from("APSISIPDC.cr_schema")
    .select()
    .where("id", id);
  return res.status(200).send({
    success: true,
    message: "Success :: scheme details ",
    data: schemaDeatils,
  });
};

module.exports.createParameter = async (req, res) => {
  const { data } = req;
  const schemaParamsAvailable = await knex
    .from("APSISIPDC.cr_scheme_parameter")
    .select("id")
    .where("scheme_id", data.scheme_id);
  const schemaParamsId = schemaParamsAvailable[0]?.id ?? false;
  if (!schemaParamsId) {
    const createParameterForScheme = await knex(
      "APSISIPDC.cr_scheme_parameter"
    ).insert(data);
    return res.send({
      success: true,
      message: "Success :: scheme Parameter Added!",
      response: createParameterForScheme,
    });
  } else {
    return res.send({
      success: false,
      message: "Success :: scheme Parameter already available!",
      response: "Please selecta different Scheme",
    });
  }
};

module.exports.getParameterDetails = async (req, res) => {
  const { scheme_id } = req.params;
  const schemaParameterDeatils = await getParameterDetailsbyID(scheme_id);
  return res.send({
    success: true,
    message: schemaParameterDeatils == null? "No details found" : "Success :: scheme parameter details ",
    data: schemaParameterDeatils,
  });
};

module.exports.getSchemeDetailsById = async function (scheme_id) {
  const schemaDeatils = await getParameterDetailsbyID(scheme_id);
  return schemaDeatils;
};


module.exports.updateScheme = async (req, res) => {
  const { value } = req.body;
   delete value.id;
   delete value.created_at;
   delete value.updated_at;
  try {
    await knex.transaction(async (trx) => {
      const schema_update = await trx("APSISIPDC.cr_schema")
        .where({ id: req.params.id })
        .update(value);
      console.log('schema_update',schema_update)
      if (schema_update <= 0){
        return res.send({
          success: false,
          message: "Could not Found schema",
          response: "Could not Found schema",
        });
      }else{
        return res.send({
          success: true,
          message: "Schema updated Successfully",
          response: "Schema updated Successfully",
        });
      }
    });
  } catch (error) {
    reject(sendApiResult(false, error.message));
  }
};


module.exports.updateSchemeParameter = async (req, res) => {
  const { value } = req.body;
  // console.log('req.body',req.body.value)
  // console.log('Datatatattata',req.body.value)
   delete value.id;
   delete value.created_at;
   delete value.updated_at;

   console.log('valuevalue',value)

  try {
    await knex.transaction(async (trx) => {
      const schema_update_parameter = await trx("APSISIPDC.cr_scheme_parameter")
        .where({ id: req.params.id })
        .update(value);
        console.log('schema_update_parameter',schema_update_parameter)
      
      if (schema_update_parameter <= 0)
      {
        // sendApiResult(false, "Could not Found schema parameter");
        return res.send({
          success: false,
          message: "Could not Found schema parameter",
          response: "Please selecta different Scheme",
        });
      }
      else{
        return res.send({
          success: true,
          message: "Schema parameter updated Successfully",
          response: schema_update_parameter,
        });
      }       
    });
  } catch (error) {
    console.log('error', error)
    sendApiResult(false, error.message);
  }
};


const getParameterDetailsbyID = async function (scheme_id) {
  const schemaParameterDeatils = await knex
    .from("APSISIPDC.cr_scheme_parameter")
    .select()
    .where("scheme_id", scheme_id)
    .first();
  return schemaParameterDeatils?schemaParameterDeatils:null;
};
