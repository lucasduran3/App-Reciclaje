import { body } from "express-validator";

// Constantes reusables
const TYPES = [
  "general",
  "recyclable",
  "organic",
  "electronic",
  "hazardous",
  "bulky",
];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const SIZES = ["small", "medium", "large", "xlarge"];

export const createTicketValidator = [
  // TITLE
  body("title")
    .exists({ checkFalsy: true })
    .withMessage("El título es obligatorio")
    .bail()
    .trim()
    .isLength({ min: 10, max: 50 })
    .withMessage("El título debe tener entre 10 y 50 caracteres"),

  // DESCRIPTION
  body("description")
    .exists({ checkFalsy: true })
    .withMessage("La descripción es obligatoria")
    .bail()
    .trim()
    .isLength({ min: 20, max: 300 })
    .withMessage("La descripción debe tener entre 20 y 300 caracteres"),

  // LOCATION (objeto)
  body("location")
    .exists({ checkFalsy: true })
    .withMessage("La ubicación es obligatoria")
    .bail()
    .custom((value) => {
      if (typeof value !== "object" || value === null) {
        throw new Error("La ubicación debe ser un objeto con lat y lng");
      }
      return true;
    }),

  // LAT
  body("location.lat")
    .exists({ checkFalsy: true })
    .withMessage("La latitud es obligatoria")
    .bail()
    .toFloat()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitud fuera de rango (-90..90)"),

  // LNG
  body("location.lng")
    .exists({ checkFalsy: true })
    .withMessage("La longitud es obligatoria")
    .bail()
    .toFloat()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitud fuera de rango (-180..180)"),

  // TYPE
  body("type")
    .exists({ checkFalsy: true })
    .withMessage("El tipo es obligatorio")
    .bail()
    .trim()
    .toLowerCase()
    .isIn(TYPES)
    .withMessage(
      `El tipo es inválido. Valores permitidos: ${TYPES.join(", ")}`
    ),

  // PRIORITY
  body("priority")
    .exists({ checkFalsy: true })
    .withMessage("La prioridad es obligatoria")
    .bail()
    .trim()
    .toLowerCase()
    .isIn(PRIORITIES)
    .withMessage(
      `Prioridad inválida. Valores permitidos: ${PRIORITIES.join(", ")}`
    ),

  // ESTIMATED_SIZE
  body("estimated_size")
    .exists({ checkFalsy: true })
    .withMessage("El tamaño estimado es obligatorio")
    .bail()
    .trim()
    .toLowerCase()
    .isIn(SIZES)
    .withMessage(
      `Tamaño estimado inválido. Valores permitidos: ${SIZES.join(", ")}`
    ),

  // ADDRESS
  body("address")
    .exists({ checkFalsy: true })
    .withMessage("La dirección es requerida")
    .bail()
    .trim()
    .isLength({ min: 5 })
    .withMessage("La dirección es demasiado corta"),
];

export const validateTicketValidator = [
  body("approved")
    .exists({ checkFalsy: true })
    .withMessage("El campo approved es requerido")
    .bail()
    .isBoolean()
    .withMessage("El campo approved debe ser booleano"),
  body("validation_message")
    .exists({ checkFalsy: true })
    .withMessage("Mensaje de validación requerido")
    .bail()
    .trim()
    .isLength({ max: 200 })
    .withMessage(
      "El mensaje de validación no puede exceder los 200 carácteres"
    ),
];

export const addCommentValidator = [
  body("text")
    .exists({ checkFalsy: true })
    .withMessage("El comentario no puede estar vacío")
    .bail()
    .isString()
    .withMessage("El comentario debe ser un string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("El comentario no puede superar los 500 carácteres"),
];
