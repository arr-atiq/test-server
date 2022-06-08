const Joi = require("joi");
module.exports.schemaValidation = async (req, res, next) => {
  const {
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
    charge,
    other_charge,
    overdue_amount,
    penal_charge,
    transaction_type
  } = req.body;
  const { user_id } = req;
  const data = {
    scheme_name,
    rate_of_interest,
    loan_tenor_in_days,
    expiry_date: new Date(expiry_date),
    grace_periods_in_days,
    penalty_periods,
    daily_penalty,
    processing_cost,
    transaction_fee,
    collection_fee_sharing_with_agency,
    charge,
    other_charge,
    overdue_amount,
    penal_charge,
    transaction_type,
    created_by: user_id,
  };

  const schema = Joi.object({
    scheme_name: Joi.string().min(3).required(),
    transaction_type: Joi.string().required(),
    rate_of_interest: Joi.number().required(),
    loan_tenor_in_days: Joi.number(),
    expiry_date: Joi.date(),
    grace_periods_in_days: Joi.number(),
    penalty_periods: Joi.number(),
    daily_penalty: Joi.number(),
    processing_cost: Joi.number(),
    transaction_fee: Joi.number(),
    charge: Joi.number(),
    other_charge: Joi.number(),
    overdue_amount: Joi.number(),
    penal_charge: Joi.number(),
    collection_fee_sharing_with_agency: Joi.number(),
    created_by: Joi.required(),
  });

  try {
    await schema.validateAsync(data);
    req.data = data;
    next();
  } catch (err) {
    return res.status(500).send({
      success: false,
      message: "Fail :: validation error ",
      response: err.details,
    });
  }
};

module.exports.schemaParameterValidation = async (req, res, next) => {
  const {
    scheme_id,
    uninterrupted_sales,
    intrvl_check_uninterrupt_sales,
    max_credit_limit_all,
    max_credit_limit_by_manufacturer,
    min_avg_sales_manufacturer,
    avg_sales_duration,
    interval_checking_avg_sales_duration,
    max_limit_no_trade_license,
    max_limit_no_security_cheque,
    multiplying_factor,
    interest_capitalisaion_period,
  } = req.body;
  const { user_id } = req;
  const data = {
    scheme_id,
    uninterrupted_sales,
    intrvl_check_uninterrupt_sales,
    max_credit_limit_all,
    max_credit_limit_by_manufacturer,
    min_avg_sales_manufacturer,
    avg_sales_duration,
    interval_checking_avg_sales_duration,
    max_limit_no_trade_license,
    max_limit_no_security_cheque,
    multiplying_factor,
    interest_capitalisaion_period,
    created_by: user_id,
  };

  const schema = Joi.object({
    scheme_id: Joi.number().required(),
    uninterrupted_sales: Joi.number().required(),
    intrvl_check_uninterrupt_sales: Joi.number(),
    max_credit_limit_all: Joi.number(),
    max_credit_limit_by_manufacturer: Joi.number(),
    min_avg_sales_manufacturer: Joi.number(),
    avg_sales_duration: Joi.number(),
    interval_checking_avg_sales_duration: Joi.number(),
    max_limit_no_trade_license: Joi.number(),
    max_limit_no_security_cheque: Joi.number(),
    multiplying_factor: Joi.number(),
    interest_capitalisaion_period: Joi.number(),
    created_by: Joi.required(),
  });

  try {
    await schema.validateAsync(data);
    req.data = data;
    next();
  } catch (err) {
    return res.status(500).send({
      success: false,
      message: "Fail :: validation error ",
      response: err.details,
    });
  }
};
