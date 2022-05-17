const jwt = require('jsonwebtoken');
const md5 = require('md5');
const knex = require('../config/database');

exports.refreshToken = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400);
  }
  const data = await knex('cr_users')
    .select(
      'id',
      'name',
      'email',
      'phone',
      'cr_user_type',
      'password',
      'id_fi',
      'remember_token',
    )
    .where({ email })
    .first();
  logger.info(data);
  if (data.remember_token != req.body.refreshToken) {
    return res.sendStatus(401);
  }
  delete data.remember_token;
  const payload = { data };
  const options = { expiresIn: process.env.JWT_EXPIRES_IN };
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign(payload, secret, options);
  const refreshOptions = { expiresIn: process.env.REFRESH_TOKEN_LIFE };
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
  const refreshToken = jwt.sign(payload, refreshSecret, refreshOptions);
  await knex('cr_users').where('id', data.id).update({
    remember_token: refreshToken,
  });
  const output = { token, refreshToken };
  return res.json(output);
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  if (!email || !password) {
    return res.status(400);
  }

  const data = await knex('APSISIPDC.cr_users')
    .select(
      'id',
      'name',
      'email',
      'phone',
      'cr_user_type',
      'password',
      'id_fi',
      'setting_menu',
    )
    .where({ email, activation_status: 'Active' })
    .first();

  console.log(data);

  if (!data || !(md5(`++${password}--`) == data.password)) {
    res.json({
      result: false,
      message: 'Invalid email or password',
    });
  } else {
    delete data.password;

    const payload = { data };
    const options = { expiresIn: process.env.JWT_EXPIRES_IN };
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(payload, secret, options);
    const refreshOptions = { expiresIn: process.env.REFRESH_TOKEN_LIFE };
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    const refreshToken = jwt.sign(payload, refreshSecret, refreshOptions);
    await knex('APSISIPDC.cr_users').where('id', data.id).update({
      remember_token: refreshToken,
    });

    const permitted_menues = await knex('APSISIPDC.cr_menus')
      .select(
        'cr_menus.id',
        'cr_menus.parent_menu_id',
        'cr_menus.name',
        'cr_menus.icon',
        'cr_menus.url',
      )
      .leftJoin(
        'APSISIPDC.cr_menu_vs_role',
        'cr_menu_vs_role.id_cr_menu',
        'cr_menus.id',
      )
      .leftJoin(
        'APSISIPDC.cr_user_roles',
        'cr_user_roles.id',
        'cr_menu_vs_role.id_cr_role',
      )
      .leftJoin(
        'APSISIPDC.cr_role_vs_user',
        'cr_role_vs_user.id_cr_role',
        'cr_user_roles.id',
      )
      .leftJoin(
        'APSISIPDC.cr_users',
        'cr_users.id',
        'cr_role_vs_user.id_cr_user',
      )
      .where('cr_menus.activation_status', 'Active')
      .where('cr_users.id', data.id)
      .orderBy('cr_menus.sorting_order', 'asc');

    let dp_id_not = [];
    dh_id_not = [];
    if (data.cr_user_type != 'apsis_support') {
      dp_id_not = [334, 344];
      dh_id_not = [57];
    }

    if (data.cr_user_type == 'bat') {
      const dh_id = await knex('APSISIPDC.cr_dh_user')
        .select('dh_id')
        .where('cr_user_id', data.id)
        .whereNotIn('dh_id', dh_id_not)
        .pluck('dh_id');
      var dpids = await knex('APSISIPDC.distributorspoint')
        .select('id')
        .whereIn('dsid', dh_id)
        .whereNotIn('dsid', dh_id_not)
        .whereNotIn('id', dp_id_not)
        .where('stts', 1)
        .pluck('id');
      data.dpids = dpids;
      data.dh_id = dh_id;
    } else if (
      data.cr_user_type == 'superadmin'
      || data.cr_user_type == 'apsis_support'
    ) {
      const dh_id = await knex('APSISIPDC.company')
        .select('id')
        .where('stts', 1)

        .pluck('id');
      var dpids = await knex('APSISIPDC.distributorspoint')
        .select('id')
        .whereIn('dsid', dh_id)
        .whereNotIn('dsid', dh_id_not)
        .whereNotIn('id', dp_id_not)
        .where('stts', 1)
        .pluck('id');
      data.dpids = dpids;
      data.dh_id = dh_id;
    } else if (data.cr_user_type == 'admin') {
      const dh_id = await knex('APSISIPDC.cr_dh_user')
        .select('dh_id')
        .where('cr_user_id', data.id)
        .pluck('dh_id');
      var dpids = await knex('APSISIPDC.distributorspoint')
        .select('id')
        .whereIn('dsid', dh_id)
        .whereNotIn('dsid', dh_id_not)
        .whereNotIn('id', dp_id_not)
        .where('stts', 1)
        .pluck('id');
      data.dpids = dpids;
      data.dh_id = dh_id;
    } else {
      const dh_id = await knex('APSISIPDC.cr_dh_fi')
        .select('id_dh')
        .where({
          id_fi: data.id_fi,
          activation_status: 'Active',
        })
        .whereNotIn('id_dh', dh_id_not)
        .pluck('id_dh');

      dpids = await knex('APSISIPDC.distributorspoint')
        .select('id')
        .whereIn('dsid', dh_id)
        .whereNotIn('dsid', dh_id_not)
        .whereNotIn('id', dp_id_not)
        .where('stts', 1)
        .pluck('id');
      data.dh_id = dh_id;
      data.dpids = dpids;
    }

    // console.log(data.dh_id.dh_id)
    // data.permitted_menues = permitted_menues;
    data.permitted_menu_tree = menuTree(permitted_menues);
    data.token = token;
    data.refreshToken = refreshToken;
    data.result = true;
    return res.json(data);
  }
};

function menuTree(menus, parent_menu_id = 0) {
  const branch = [];
  for (let i = 0; i < menus.length; i++) {
    const temp = menus[i];
    if (menus[i].parent_menu_id == parent_menu_id) {
      const children = menuTree(menus, menus[i].id);
      if (children) {
        temp.children = children;
      }
      branch.push(temp);
    }
  }
  return JSON.stringify(branch);
}
