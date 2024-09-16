import { Router } from 'express';
import { uploadData, getStatus, imageProcessor, getCsvFile } from '../controllers/media';
import multerConfig from '../utils/multer';

const router = Router();

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
router.post('/media', multerConfig.single('file'), uploadData);

router.post('/image', imageProcessor);

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
router.get('/getcsv/:requestId', getCsvFile);

export default router;
