const express = require("express");

const companyController = require("./company.controller");

const { createCompanyValidator, updateCompanyValidator, getCompaniesValidator, getCompanyValidator, assignCompanyValidator, getCompanyContactsValidator, deleteCompanyValidator } = require("./company.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");

const { requireBusinessMembership } = require("../../middleware/authorization");

const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

router.get("/business/:businessId", getCompaniesValidator, validate, requireBusinessMembership, requirePermission("companies.view"), companyController.getCompaniesByBusiness);

router.post("/business/:businessId", createCompanyValidator, validate, requireBusinessMembership, requirePermission("companies.create"), companyController.createCompany);

router.get("/business/:businessId/:companyId", getCompanyValidator, validate, requireBusinessMembership, requirePermission("companies.view"), companyController.getCompanyById);

router.get("/business/:businessId/:companyId/contacts", getCompanyContactsValidator, validate, requireBusinessMembership, requirePermission("contacts.view"), companyController.getCompanyContacts);

router.patch("/business/:businessId/:companyId", updateCompanyValidator, validate, requireBusinessMembership, requirePermission("companies.update"), companyController.updateCompany);

router.patch("/business/:businessId/:companyId/assign", assignCompanyValidator, validate, requireBusinessMembership, requirePermission("companies.assign"), companyController.assignCompany);

router.delete("/business/:businessId/:companyId", deleteCompanyValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("companies.delete"), companyController.deleteCompany);

module.exports = router;
