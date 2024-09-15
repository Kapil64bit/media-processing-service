import { Router } from 'express';
import { uploadData,getStatus, imageProcessor, getCsvFile } from '../controllers/media';
import multerConfig from '../utils/multer';

const router = Router();

router.post('/media', multerConfig.single('file'), uploadData);  
router.get('/:requestId', getStatus);
router.post('/image',imageProcessor)
router.get('/getcsv/:requestId',getCsvFile)

export default router;
