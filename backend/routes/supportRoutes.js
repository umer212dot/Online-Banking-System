import express from "express";
import {
  createTicket,
  getUserTickets,
  adminGetTickets,
  getResponses,
  addResponse,
  updateStatus
} from "../controllers/supportController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// USER ROUTES
router.post("/tickets", protect, createTicket);
router.get("/tickets", protect, getUserTickets);
router.get("/tickets/:ticket_id/responses", protect, getResponses);

// ADMIN ROUTES
router.get("/admin/tickets", adminOnly, adminGetTickets);
router.post("/tickets/:ticket_id/responses", adminOnly, addResponse);
router.patch("/tickets/:ticket_id", adminOnly, updateStatus);

export default router;
