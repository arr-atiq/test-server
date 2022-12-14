const express = require("express");
const router = express.Router();
const scheme = require("../controllers/scheme");
const {
  schemaValidation,
  schemaParameterValidation,
} = require("../middleware/schemeInputValidation");

router.post("/", schemaValidation, scheme.createScheme);
router.get("/SchemelistSlab", scheme.getSchemesListSlab);
router.get("/slabListSchme/:id", scheme.getSlabListSchme);
router.get("/list", scheme.getSchemes);
router.get("/:id", scheme.getSchemeDetails);

router.post("/parameter", schemaParameterValidation, scheme.createParameter);
router.get("/:scheme_id/parameter", scheme.getParameterDetails);

router.put("/:id", scheme.updateScheme);
router.put("/updateSchemeParameter/:id", scheme.updateSchemeParameter);


module.exports = router;
