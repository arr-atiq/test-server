const { sendApiResult } = require("../controllers/helper");
const knex = require("../config/database");

const User = function () {};

User.userList = function (req, res) {
  return new Promise(async (resolve, reject) => {
    try {
      const userList = await knex
        .select(
          "cr_users.id",
          "cr_users.name",
          "cr_users.email AS username",
          "cr_user_wise_role.role_id AS user_level_id",
          "cr_user_roles.name AS user_level_name"
        )
        .leftJoin(
          "APSISIPDC.cr_user_wise_role",
          "cr_user_wise_role.user_id",
          "cr_users.id"
        )
        .leftJoin(
          "APSISIPDC.cr_user_roles",
          "cr_user_roles.id",
          "cr_user_wise_role.role_id"
        )
        .from("APSISIPDC.cr_users")
        .where("cr_users.status", "Active")                
        .orderBy("cr_users.id", "asc");

      const userLevelList = await knex
        .select(
          "cr_user_roles.id AS user_level_id",
          "cr_user_roles.name AS user_level_name"
        )
        .from("APSISIPDC.cr_user_roles")
        .where("cr_user_roles.status", "Active") 

      if (Object.keys(userList).length != 0) {
        resolve(sendApiResult(true, "User List Fetched Successfully", {userLevelList : userLevelList, userlist : userList}));
      } else {
        reject(sendApiResult(false, "Data not found"));
      }
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

module.exports = User;
