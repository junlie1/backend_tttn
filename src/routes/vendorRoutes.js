const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");

router.get("/", vendorController.getAllVendors);     
router.put("/:id", vendorController.updateVendor);     
router.delete("/:id", vendorController.deleteVendor);  

module.exports = router;
