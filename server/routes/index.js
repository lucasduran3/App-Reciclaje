/**
 * Routes Index - Agregador de todas las rutas
 */

import express from "express";
import userRoutes from "./userRoutes.js";
import ticketRoutes from "./ticketRoutes.js";
import missionRoutes from "./missionRoutes.js";
import commentRoutes from "./commentRoutes.js";
import leaderboardRoutes from "./leaderboardRoutes.js";
import authRoutes from "./authRoutes.js";

const router = express.Router();

// Montar rutas
router.use("/users", userRoutes);
router.use("/tickets", ticketRoutes);
router.use("/missions", missionRoutes);
router.use("/comments", commentRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use('/comments', commentRoutes);
router.use('/auth', authRoutes);

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Ruta raíz de API con documentación
router.get("/", (req, res) => {
  res.json({
    message: "Eco-Game API",
    version: "1.0.0",
    endpoints: {
      health: "GET /api/health",
      users: {
        getAll: "GET /api/users",
        getById: "GET /api/users/:id",
        getStats: "GET /api/users/:id/stats",
        create: "POST /api/users",
        update: "PUT /api/users/:id",
        delete: "DELETE /api/users/:id",
        addPoints: "POST /api/users/:id/add-points",
      },
      tickets: {
        getAll: "GET /api/tickets",
        getById: "GET /api/tickets/:id",
        create: "POST /api/tickets",
        update: "PUT /api/tickets/:id",
        delete: "DELETE /api/tickets/:id",
        accept: "POST /api/tickets/:id/accept",
        complete: "POST /api/tickets/:id/complete",
        validate: "POST /api/tickets/:id/validate",
        like: "POST /api/tickets/:id/like",
      },
      missions: {
        getAll: "GET /api/missions",
        getById: "GET /api/missions/:id",
        update: "PUT /api/missions/:id",
        increment: "POST /api/missions/:id/increment",
        regenerate: "POST /api/missions/regenerate",
      },
      comments: {
        getAll: "GET /api/comments",
        getById: "GET /api/comments/:id",
        create: "POST /api/comments",
        update: "PUT /api/comments/:id",
        delete: "DELETE /api/comments/:id",
        like: "POST /api/comments/:id/like",
      },
      leaderboard: {
        get: "GET /api/leaderboard",
        getUserPosition: "GET /api/leaderboard/user/:id",
        regenerate: "POST /api/leaderboard/regenerate",
      },
    },
  });
});
export default router;
