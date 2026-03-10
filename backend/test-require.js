const pdfParse = require('pdf-parse');
console.log('TYPEOF pdfParse:', typeof pdfParse);
if (typeof pdfParse === 'object') {
    console.log('KEYS:', Object.keys(pdfParse));
}
