const logger = require('pino')();
const knex = require('../config/database');
const Joi = require('joi');
const { sendApiResult } = require('./helper');

module.exports.createScheme = async (req, res) => {
  const { data } = req;
  const schemaAvailable = await knex.from('APSISIPDC.cr_schema').select('id').where('scheme_name', data.scheme_name)
  try {
    const schemaId = schemaAvailable[0]?.id ?? false;
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

module.exports.getSchemes = async (req, res) => {
  const schemas = await knex.from('APSISIPDC.cr_schema').select();
  return res.status(200).send({
    "success": true,
    "message": "Success :: Available scheme list ",
    "data": schemas
  });

}

module.exports.getSchemeDetails = async (req, res) => {
  const { id } = req.params;
  const schemaDeatils = await knex.from('APSISIPDC.cr_schema').select().where("id", id);
  return res.status(200).send({
    "success": true,
    "message": "Success :: scheme details ",
    "data": schemaDeatils
  });

}

module.exports.createParameter = async (req, res) => {
  const { data } = req;
  const schemaParamsAvailable = await knex.from('APSISIPDC.cr_scheme_parameter').select('id').where('scheme_id', data.scheme_id)
  const schemaParamsId = schemaParamsAvailable[0]?.id ?? false;
  if(!schemaParamsId){
    const createParameterForScheme = await knex(
      'APSISIPDC.cr_scheme_parameter',
    ).insert(data);
    return res.status(201).send({
      "success": true,
      "message": "Success :: scheme Parameter Added!",
      "response": createParameterForScheme
    });    
  }
  else{
    return res.status(400).send({
      "success": false,
      "message": "Success :: scheme Parameter already available!",
      "response": "Please selecta different Scheme"
    }); 
  }


}


module.exports.getParameterDetails = async (req, res) => {
  const { scheme_id } = req.params;
  const schemaParameterDeatils = await knex.from('APSISIPDC.cr_scheme_parameter').select().where("scheme_id", scheme_id);
  return res.status(200).send({
    "success": true,
    "message": "Success :: scheme parameter details ",
    "data": schemaParameterDeatils
  });

}

module.exports.temp = async (req, res) => {
  const {
   status,
  } = req.body;


    try {
      if(req.body.RN == 1 ){
          knex.transaction(async (trx) => {
          const updateData = await trx('APSISIPDC.cr_retailer')
            .where("id", req.params.id )
            .update({
             status: status
            });
            //.toSQL().toNative()
          if (updateData <= 0){
            res.send(sendApiResult(false, 'Could not Found temp')) ;
          } else{
            res.send(sendApiResult(
                true,
                'Temp updated Successfully',
                updateData,
              ))
          }
          
      })
     }
      else{
         knex.transaction(async (trx) => {
            const updateData = await trx('APSISIPDC.cr_retailer_manu_dist_mapping')
              .where({ id: req.params.id })
              .update({
               status : status
              });
            
            if (updateData <= 0) res.send(sendApiResult(false, 'Could not Found temp'));
            res.send(
              sendApiResult(
                true,
                'Temp updated Successfully',
                updateData,
              ),
            );
         })
      }
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
     
}

