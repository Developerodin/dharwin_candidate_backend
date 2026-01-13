import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as subRoleValidation from '../../validations/subRole.validation.js';
import * as subRoleController from '../../controllers/subRole.controller.js';

const router = express.Router();

router
  .route('/')
  .post(auth('manageUsers'), validate(subRoleValidation.createSubRole), subRoleController.create)
  .get(auth('manageUsers'), validate(subRoleValidation.getSubRoles), subRoleController.list);

router
  .route('/:subRoleId')
  .get(auth('manageUsers'), validate(subRoleValidation.getSubRole), subRoleController.get)
  .patch(auth('manageUsers'), validate(subRoleValidation.updateSubRole), subRoleController.update)
  .delete(auth('manageUsers'), validate(subRoleValidation.deleteSubRole), subRoleController.remove);

export default router;
