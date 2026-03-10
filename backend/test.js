const fs = require('fs');

async function test() {
    try {
        const dummyPdf = Buffer.from(
            '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >>\nendobj\n4 0 obj\n<< /Length 21 >>\nstream\nBT /F1 12 Tf (Hello) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000216 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n288\n%%EOF',
            'utf8'
        );
        fs.writeFileSync('test.pdf', dummyPdf);

        const form = new FormData();
        const blob = new Blob([dummyPdf], { type: 'application/pdf' });
        form.append('file', blob, 'test.pdf');

        const res = await fetch('http://localhost:5000/api/convert/pdf-to-text', {
            method: 'POST',
            body: form
        });
        console.log('STATUS:', res.status);
        if (!res.ok) {
            const err = await res.text();
            console.error('ERROR RESPONSE:', err);
        } else {
            console.log('SUCCESS');
        }
    } catch (e) {
        console.error('ERROR MESSAGE:', e.message);
    }
}
test();
