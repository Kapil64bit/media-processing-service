import multer from 'multer';

// Configure multer to store the uploaded file in memory (or use disk storage if needed)
const storage = multer.memoryStorage();
const upload = multer({ storage });

export default upload;
