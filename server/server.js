import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import supabaseService from "./services/supabaseService.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/logger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL, // Variable para producción
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(requestLogger);

// Inicializar servidor con Supabase
async function initializeServer() {
  try {
    // Inicializar conexión a Supabase
    await supabaseService.initialize();

    // Montar rutas
    app.use("/api", routes);

    // Manejadores de errores (deben ir al final)
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log("   ================================");
      console.log(`   🚀 Server running on port ${PORT}`);
      console.log(`   📡 URL: http://localhost:${PORT}`);
      console.log(`   🗄️  Database: Supabase`);
      console.log(
        `   🌍 Environment: ${process.env.NODE_ENV || "development"}`
      );
      console.log("   ================================\n");
    });
  } catch (error) {
    console.error("❌ Failed to initialize server:", error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on("SIGTERM", () => {
  console.log("\n👋 SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n👋 SIGINT received, shutting down gracefully...");
  process.exit(0);
});

// Iniciar servidor
initializeServer();
