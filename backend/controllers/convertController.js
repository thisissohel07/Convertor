const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const PDFDocument = require('pdfkit');
const { PDFDocument: PDFLibDoc } = require('pdf-lib');
const archiver = require('archiver');
const crypto = require('crypto');
const { Document, Packer, Paragraph } = require('docx');
const { parseOfficeAsync } = require('officeparser');
const xlsx = require('xlsx');
const pptxgen = require('pptxgenjs');

// Helper to generate unique paths
const getOutputPath = (originalName, ext) => {
    const name = path.parse(originalName || 'file').name;
    const unique = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    const outDir = path.join(__dirname, '../converted');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    return path.join(outDir, `${name}-${unique}${ext}`);
};

exports.pngToJpg = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const inputPath = req.file.path;
        const outputPath = getOutputPath(req.file.originalname, '.jpg');

        await sharp(inputPath).jpeg().toFile(outputPath);
        res.download(outputPath, path.basename(outputPath));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Conversion failed', details: error.message });
    }
};

exports.jpgToPng = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const inputPath = req.file.path;
        const outputPath = getOutputPath(req.file.originalname, '.png');

        await sharp(inputPath).png().toFile(outputPath);
        res.download(outputPath, path.basename(outputPath));
    } catch (error) {
        res.status(500).json({ error: 'Conversion failed', details: error.message });
    }
};

exports.pdfToText = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const dataBuffer = fs.readFileSync(req.file.path);
        
        const data = await pdfParse(dataBuffer);
        const outputPath = getOutputPath(req.file.originalname, '.txt');
        fs.writeFileSync(outputPath, data.text);
        
        res.download(outputPath, path.basename(outputPath));
    } catch (error) {
        res.status(500).json({ error: 'Conversion failed', details: error.message });
    }
};

exports.textToPdf = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const textContent = fs.readFileSync(req.file.path, 'utf8');
        const outputPath = getOutputPath(req.file.originalname, '.pdf');
        
        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(outputPath);
        doc.pipe(writeStream);
        doc.text(textContent);
        doc.end();

        writeStream.on('finish', () => {
            res.download(outputPath, path.basename(outputPath));
        });
    } catch (error) {
        res.status(500).json({ error: 'Conversion failed', details: error.message });
    }
};

exports.mergePdf = async (req, res) => {
    try {
        if (!req.files || req.files.length < 2) {
            return res.status(400).json({ error: 'Please upload at least 2 PDF files to merge' });
        }
        
        const mergedPdf = await PDFLibDoc.create();
        for (const file of req.files) {
            const pdfBytes = fs.readFileSync(file.path);
            const pdf = await PDFLibDoc.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();
        const outputPath = getOutputPath('merged', '.pdf');
        fs.writeFileSync(outputPath, mergedPdfBytes);
        
        res.download(outputPath, path.basename(outputPath));
    } catch (error) {
        res.status(500).json({ error: 'Merger failed', details: error.message });
    }
};

exports.splitPdf = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        
        const pdfBytes = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFLibDoc.load(pdfBytes);
        const numberOfPages = pdfDoc.getPageCount();

        const zipOutputPath = getOutputPath(req.file.originalname, '-split.zip');
        const output = fs.createWriteStream(zipOutputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            res.download(zipOutputPath, path.basename(zipOutputPath));
        });

        archive.on('error', (err) => { throw err; });
        archive.pipe(output);

        for (let i = 0; i < numberOfPages; i++) {
            const newPdf = await PDFLibDoc.create();
            const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
            newPdf.addPage(copiedPage);
            const newPdfBytes = await newPdf.save();
            archive.append(Buffer.from(newPdfBytes), { name: `page-${i + 1}.pdf` });
        }

        archive.finalize();
    } catch (error) {
        res.status(500).json({ error: 'Split failed', details: error.message });
    }
};

exports.jpgToPdf = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No file uploaded' });
        
        const pdfDoc = await PDFLibDoc.create();
        for (const file of req.files) {
            const imageBytes = fs.readFileSync(file.path);
            let image;
            if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
                image = await pdfDoc.embedJpg(imageBytes);
            } else if (file.mimetype === 'image/png') {
                image = await pdfDoc.embedPng(imageBytes);
            } else {
                continue;
            }
            const page = pdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }

        const pdfBytes = await pdfDoc.save();
        const outputPath = getOutputPath('images', '.pdf');
        fs.writeFileSync(outputPath, pdfBytes);
        res.download(outputPath, path.basename(outputPath));
    } catch (error) {
        res.status(500).json({ error: 'Conversion failed', details: error.message });
    }
};

exports.pdfToJpg = async (req, res) => {
    res.status(501).json({ error: 'PDF to JPG conversion requires Ghostscript natively installed on this Windows OS machine. Feature disabled.' });
};

exports.compressPdf = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const pdfBytes = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFLibDoc.load(pdfBytes);
        // Simple re-save is native "compression" for unoptimized PDFs
        const optimizedBytes = await pdfDoc.save({ useObjectStreams: false }); 
        const outputPath = getOutputPath(req.file.originalname, '-compressed.pdf');
        fs.writeFileSync(outputPath, optimizedBytes);
        res.download(outputPath, path.basename(outputPath));
    } catch (error) {
        res.status(500).json({ error: 'Compression failed', details: error.message });
    }
};

const extractOfficeToPdf = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const text = await parseOfficeAsync(req.file.path);
        
        const outputPath = getOutputPath(req.file.originalname, '.pdf');
        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(outputPath);
        doc.pipe(writeStream);
        doc.text(text || "No text could be extracted from this document.");
        doc.end();

        writeStream.on('finish', () => {
            res.download(outputPath, path.basename(outputPath));
        });
    } catch (error) {
        res.status(500).json({ error: 'Conversion failed', details: error.message });
    }
};

exports.wordToPdf = extractOfficeToPdf;
exports.pptToPdf = extractOfficeToPdf;

exports.excelToPdf = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const workbook = xlsx.readFile(req.file.path);
        let text = '';
        workbook.SheetNames.forEach(sheetName => {
            const temp = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
            temp.forEach(row => {
               text += row.join(' | ') + '\n';
            });
            text += '\n---\n';
        });

        const outputPath = getOutputPath(req.file.originalname, '.pdf');
        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(outputPath);
        doc.pipe(writeStream);
        doc.text(text || "No text extracted.");
        doc.end();

        writeStream.on('finish', () => {
            res.download(outputPath, path.basename(outputPath));
        });
    } catch (error) {
        res.status(500).json({ error: 'Conversion failed', details: error.message });
    }
};

// PDF to Office
exports.pdfToWord = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(dataBuffer);
        
        const doc = new Document({
            sections: [{
                children: data.text.split('\n').map(line => new Paragraph(line))
            }]
        });

        const buffer = await Packer.toBuffer(doc);
        const outputPath = getOutputPath(req.file.originalname, '.docx');
        fs.writeFileSync(outputPath, buffer);
        res.download(outputPath, path.basename(outputPath));
    } catch (error) {
        res.status(500).json({ error: 'Conversion failed', details: error.message });
    }
};

exports.pdfToExcel = async (req, res) => {
    try {
         if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
         const dataBuffer = fs.readFileSync(req.file.path);
         const data = await pdfParse(dataBuffer);
         
         const rows = data.text.split('\n').map(line => [line]);
         const worksheet = xlsx.utils.aoa_to_sheet(rows);
         const workbook = xlsx.utils.book_new();
         xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
         
         const outputPath = getOutputPath(req.file.originalname, '.xlsx');
         xlsx.writeFile(workbook, outputPath);
         res.download(outputPath, path.basename(outputPath));
    } catch (error) {
        res.status(500).json({ error: 'Conversion failed', details: error.message });
    }
};

exports.pdfToPpt = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(dataBuffer);
        
        const pptx = new pptxgen();
        const lines = data.text.split('\n').filter(Boolean);
        
        // Chunk into slides
        for (let i = 0; i < lines.length; i += 10) {
            let slide = pptx.addSlide();
            slide.addText(lines.slice(i, i+10).join('\n'), { x: 0.5, y: 0.5, w: '90%', h: '90%', fontSize: 14 });
        }
        
        const outputPath = getOutputPath(req.file.originalname, '.pptx');
        await pptx.writeFile({ fileName: outputPath });
        
        res.download(outputPath, path.basename(outputPath));
    } catch (error) {
        res.status(500).json({ error: 'Conversion failed', details: error.message });
    }
};
