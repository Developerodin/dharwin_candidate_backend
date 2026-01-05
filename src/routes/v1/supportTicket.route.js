import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as supportTicketValidation from '../../validations/supportTicket.validation.js';
import * as supportTicketController from '../../controllers/supportTicket.controller.js';

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(supportTicketValidation.createSupportTicket), supportTicketController.create)
  .get(auth(), validate(supportTicketValidation.getSupportTickets), supportTicketController.list);

router
  .route('/:ticketId')
  .get(auth(), validate(supportTicketValidation.getSupportTicket), supportTicketController.get)
  .patch(auth(), validate(supportTicketValidation.updateSupportTicket), supportTicketController.update)
  .delete(auth('manageUsers'), validate(supportTicketValidation.deleteSupportTicket), supportTicketController.remove);

router
  .route('/:ticketId/comments')
  .post(auth(), validate(supportTicketValidation.addComment), supportTicketController.addComment);

export default router;

