const { sendApiResult } = require('../controllers/helper');
const knex = require('../config/database');

const Menu = function () {};

Menu.menuList = function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      const menu_list = await knex
        .select(
          'cr_menu.menu_id',
          'cr_menu.menu_name',
          'cr_menu.parent',
          'cr_menu.menu_url',
          'cr_menu.menu_icon_class',
        )
        .join(
          'APSISIPDC.cr_menu_access',
          'APSISIPDC.cr_menu_access.menu_id',
          'APSISIPDC.cr_menu.menu_id',
        )
        .from('APSISIPDC.cr_menu')
        .where('APSISIPDC.cr_menu.status', 'Active')
        .where('APSISIPDC.cr_menu_access.status', 'Active')
        .where(function () {
          this.orWhere({
            'APSISIPDC.cr_menu_access.user_role_id': req.role_id,
          }).orWhere({ 'APSISIPDC.cr_menu_access.user_id': req.user_id });
        })
        .orderBy('APSISIPDC.cr_menu.menu_order', 'asc');

      if (Object.keys(menu_list).length != 0) {
        const results = await buildTree(menu_list);
        resolve(sendApiResult(true, 'Data Fetched Successfully', results));
      } else {
        reject(sendApiResult(false, 'Data not found'));
      }
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

const buildTree = async function (menu_list, parentId = 0) {
  const branch = [];
  for (let i = 0; i < menu_list.length; i++) {
    if (menu_list[i].parent == parentId) {
      const children = await buildTree(menu_list, menu_list[i].menu_id);
      if (children) {
        menu_list[i].children = children;
      }
      branch.push(menu_list[i]);
    }
  }
  return branch;
};

module.exports = Menu;
