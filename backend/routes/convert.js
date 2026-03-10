const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const convertController = require('../controllers/convertController');

// Image Conversions
router.post('/png-to-jpg', upload.single('file'), convertController.pngToJpg);
router.post('/jpg-to-png', upload.single('file'), convertController.jpgToPng);
router.post('/pdf-to-jpg', upload.single('file'), convertController.pdfToJpg);
router.post('/jpg-to-pdf', upload.array('files', 20), convertController.jpgToPdf);

// PDF/Text Conversions
router.post('/pdf-to-text', upload.single('file'), convertController.pdfToText);
router.post('/text-to-pdf', upload.single('file'), convertController.textToPdf);

// PDF Utilities
router.post('/merge-pdf', upload.array('files', 20), convertController.mergePdf);
router.post('/split-pdf', upload.single('file'), convertController.splitPdf);
router.post('/compress-pdf', upload.single('file'), convertController.compressPdf);

// Document Conversions
router.post('/word-to-pdf', upload.single('file'), convertController.wordToPdf);
router.post('/pdf-to-word', upload.single('file'), convertController.pdfToWord);
router.post('/ppt-to-pdf', upload.single('file'), convertController.pptToPdf);
router.post('/pdf-to-ppt', upload.single('file'), convertController.pdfToPpt);
router.post('/excel-to-pdf', upload.single('file'), convertController.excelToPdf);
router.post('/pdf-to-excel', upload.single('file'), convertController.pdfToExcel);

module.exports = router;
