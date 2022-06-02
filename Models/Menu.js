const { sendApiResult } = require("../controllers/helper");
const knex = require("../config/database");

const Menu = function () {};

Menu.userWiseMenuList = function (req, res) {
  return new Promise(async (resolve, reject) => {
    try {
      const menu_list = await knex
        .select(
          "cr_menu.menu_id",
          "cr_menu.menu_name",
          "cr_menu.parent_menu_id AS parent",
          "cr_menu.menu_url",
          "cr_menu.menu_icon_class"
        )
        .join(
          "APSISIPDC.cr_menu_access",
          "cr_menu_access.menu_id",
          "cr_menu.menu_id"
        )
        .from("APSISIPDC.cr_menu")
        .where("cr_menu.status", "Active")
        .where("cr_menu_access.status", "Active")
        .where(function () {
          this.orWhere({
            "cr_menu_access.user_role_id": req.role_id,
          }).orWhere({ "cr_menu_access.user_id": req.user_id });
        })
        .orderBy("cr_menu.menu_order", "asc");

      if (Object.keys(menu_list).length != 0) {
        const results = await buildTree(menu_list);
        resolve(sendApiResult(true, "Data Fetched Successfully", results));
      } else {
        reject(sendApiResult(false, "Data not found"));
      }
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

Menu.addMenu = function (req, res) {  
  return new Promise(async (resolve, reject) => {
    try {
      const insertMenu = {
        menu_name : req.menu_name,
        menu_type : req.menu_type,
        parent_menu_id : req.parent_menu_id,
        menu_url : req.menu_url,
        menu_icon_class : req.menu_icon_class,
        created_by : req.created_by
      };
      const menuInsertLog = await knex("APSISIPDC.cr_menu").insert(insertMenu).returning("menu_id");

      const menuInsertLogUpdate = await knex("APSISIPDC.cr_menu")
          .where({ menu_id: parseInt(menuInsertLog[0])})
          .update({
            menu_order: parseInt(menuInsertLog[0]),
            updated_by : req.created_by,
            updated_at: new Date(),
          });

      if (Object.keys(req.user_level).length !== 0) {
          var menuAccessLog = [];
          for (const [key, value] of Object.entries(req.user_level)) {
            var tempLog = {
              menu_id : parseInt(menuInsertLog[0]),
              user_role_id : parseInt(value),
              created_by: req.created_by
            }
            menuAccessLog.push(tempLog);
          }
          await knex("APSISIPDC.cr_menu_access").insert(menuAccessLog);
      }
      
      if (Object.keys(req.user).length !== 0) {
          var menuAccessLog = [];
          for (const [key, value] of Object.entries(req.user)) {
            var tempLog = {
              menu_id : parseInt(menuInsertLog[0]),
              user_id : parseInt(value),
              created_by: req.created_by
            }
            menuAccessLog.push(tempLog);
          }
          await knex("APSISIPDC.cr_menu_access").insert(menuAccessLog);
      }
      resolve(sendApiResult(true, "Menu Added Successful."));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

Menu.menuList = function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      var data = await knex("APSISIPDC.cr_menu")
        .leftJoin(
          "APSISIPDC.cr_menu AS parent_menu",
          "parent_menu.menu_id",
          "cr_menu.parent_menu_id"
        )
        // .where(function() {
           // this.where({ 'parent_menu.status': 'Active' })                                
        // })
        .where("cr_menu.status", "Active")
        .select(
          'cr_menu.menu_name',
          'parent_menu.menu_name AS parent_menu_name',
          knex.raw(`CASE "cr_menu"."menu_type" WHEN 1 THEN 'Root Menu' WHEN 2 THEN 'Main Menu' WHEN 3 THEN 'Child Menu' END AS "menu_type"`),
          'cr_menu.menu_url',
          'cr_menu.status'
        )
        .paginate({
          perPage: req.per_page,
          currentPage: req.page,
          isLengthAware: true,
        });

      if (data == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
}

Menu.menuDetails = function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      var menuDetails = await knex("APSISIPDC.cr_menu")
        .leftJoin(
          "APSISIPDC.cr_menu AS parent_menu",
          "parent_menu.menu_id",
          "cr_menu.parent_menu_id"
        )
        .where("cr_menu.menu_id", req.id)
        .where("cr_menu.status", "Active")
        .select(
          'cr_menu.menu_id',
          'cr_menu.menu_name',
          'parent_menu.menu_name AS parent_menu_name',
          knex.raw(`CASE "cr_menu"."menu_type" WHEN 1 THEN 'root_menu' WHEN 2 THEN 'main_menu' WHEN 3 THEN 'child_menu' END AS "menu_type"`),
          'cr_menu.menu_url',
          'cr_menu.status'
        ).first();
      
      var userLevelAccessSql = await knex("APSISIPDC.cr_menu_access")
        .innerJoin(
          "APSISIPDC.cr_user_roles",
          "cr_user_roles.id",
          "cr_menu_access.user_role_id"
        )
        .where("cr_menu_access.menu_id", req.id)
        .where("cr_menu_access.status", "Active")
        .select(
          'cr_user_roles.name',
        ).distinct();
        
      var userLevelAccess = [];
      if (Object.keys(userLevelAccessSql).length !== 0) {
        for (const [key, value] of Object.entries(userLevelAccessSql)) {
          userLevelAccess.push(value.name);
        }
      }
      menuDetails.userLevelAccess = userLevelAccess;
      
      var userAccessSql = await knex("APSISIPDC.cr_menu_access")
        .innerJoin(
          "APSISIPDC.cr_users",
          "cr_users.id",
          "cr_menu_access.user_id"
        )
        .where("cr_menu_access.menu_id", req.id)
        .where("cr_menu_access.status", "Active")
        .where("cr_users.status", "Active")
        .select(
          'cr_users.email as username',
        ).distinct();
        
      var userAccess = [];
      if (Object.keys(userAccessSql).length !== 0) {
        for (const [key, value] of Object.entries(userAccessSql)) {
          userAccess.push(value.username);
        }
      }
      menuDetails.userAccess = userAccess;

      if (menuDetails == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", menuDetails));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
}

Menu.menuDelete = function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async (trx) => {
        const menu_delete = await trx("APSISIPDC.cr_menu")
          .where("cr_menu.menu_id", req.id)
          .delete();

        await trx("APSISIPDC.cr_menu_access")
          .where("cr_menu_access.menu_id", req.id)
          .delete();

        if (menu_delete <= 0)
          reject(sendApiResult(false, "Could not Found Menu"));
        else
          resolve(sendApiResult(true, "Menu Deleted successfully", menu_delete));
      });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
}

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
