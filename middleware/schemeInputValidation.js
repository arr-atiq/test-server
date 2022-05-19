const Joi = require('joi');
module.exports.schemaValidation = async (req,res,next) =>{
    const { scheme_name, rate_of_interest, loan_tenor_in_days, expiry_date, grace_periods_in_days, penalty_periods, daily_penalty, processing_cost, transaction_fee, collection_fee_sharing_with_agency } = req.body;
    const { user_id } = req;
    const data = {
      scheme_name,
      rate_of_interest,
      loan_tenor_in_days,
      expiry_date,
      grace_periods_in_days,
      penalty_periods,
      daily_penalty,
      processing_cost,
      transaction_fee,
      collection_fee_sharing_with_agency,
      created_by: user_id
    }

    const schema = Joi.object({
        scheme_name: Joi.string().min(3).required(),
        rate_of_interest: Joi.number().required(),
        loan_tenor_in_days: Joi.number(),
        expiry_date: Joi.string(),
        grace_periods_in_days: Joi.number(),
        penalty_periods: Joi.number(),
        daily_penalty: Joi.number(),
        processing_cost: Joi.number(),
        transaction_fee: Joi.number(),
        collection_fee_sharing_with_agency: Joi.number(),
        created_by: Joi.required()
    })

    
    try {
        await schema.validateAsync(data);
        req.data = data;
        next();
    }
    catch (err) { 
        return res.status(500).send({
            "success" : false,
            "message": "Fail :: validation error ",
            "response": err.details
          });
    }
}