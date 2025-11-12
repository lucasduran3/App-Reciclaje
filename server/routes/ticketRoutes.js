import express from "express";
import ticketController from "../controllers/ticketController.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import {
  createTicketValidator,
  validateTicketValidator,
  addCommentValidator,
} from "../validators/ticketValidator.js";
import validateRequest from "../middleware/validateRequest.js";

const router = express.Router();

// Rutas públicas (con auth opcional para likes, etc)
router.get("/", optionalAuth, ticketController.getAll.bind(ticketController));
router.post(
  "/",
  requireAuth,
  createTicketValidator,
  validateRequest,
  ticketController.create.bind(ticketController)
);
router.get(
  "/:id",
  optionalAuth,
  ticketController.getById.bind(ticketController)
);

// Rutas protegidas (requieren autenticación)
router.put("/:id", requireAuth, ticketController.update.bind(ticketController));
router.delete(
  "/:id",
  requireAuth,
  ticketController.delete.bind(ticketController)
);
router.post(
  "/:id/accept",
  requireAuth,
  ticketController.accept.bind(ticketController)
);
router.post(
  "/:id/complete",
  requireAuth,
  ticketController.complete.bind(ticketController)
);
router.post(
  "/:id/validate",
  requireAuth,
  validateTicketValidator,
  validateRequest,
  ticketController.validate.bind(ticketController)
);
router.post(
  "/:id/like",
  requireAuth,
  ticketController.like.bind(ticketController)
);
router.post(
  "/:id/comments",
  requireAuth,
  addCommentValidator,
  validateRequest,
  ticketController.addComment.bind(ticketController)
);

export default router;
