"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const media_1 = require("../controllers/media");
const multer_1 = __importDefault(require("../utils/multer"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * /media:
 *   post:
 *     summary: Upload a CSV file
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post('/media', multer_1.default.single('file'), media_1.uploadData);
router.post('/image', media_1.imageProcessor);
/**
 * @swagger
 * /getcsv/{requestId}:
 *   get:
 *     summary: Get CSV file
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV file retrieved successfully
 */
router.get('/getcsv/:requestId', media_1.getCsvFile);
exports.default = router;
