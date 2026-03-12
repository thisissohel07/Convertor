import React, { useState, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, X, ArrowRight, Loader2, CheckCircle2, AlertCircle, Shield, FileDown } from 'lucide-react';
import axios from 'axios';
import { TOOLS } from '../utils/tools';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import JSZip from 'jszip';
import { PDFDocument as PDFLibDoc } from 'pdf-lib';
import { jsPDF } from 'jspdf';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import pptxgen from 'pptxgenjs';
import { Document, Packer, Paragraph } from 'docx';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://convertor-fvfb.onrender.com/api/convert';

const Converter = () => {
    const { type } = useParams();
    const navigate = useNavigate();
    const tool = TOOLS.find(t => t.id === type);

    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultUrl, setResultUrl] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!tool) {
            navigate('/');
        }
        // Reset state on tool change
        setFiles([]);
        setIsUploading(false);
        setProgress(0);
        setResultUrl(null);
        setError(null);
    }, [tool, navigate]);

    const onDrop = useCallback(acceptedFiles => {
        if (tool.singleMode) {
            setFiles([acceptedFiles[0]]);
        } else {
            setFiles(prev => [...prev, ...acceptedFiles]);
        }
        setError(null);
        setResultUrl(null);
    }, [tool]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop,
        accept: tool && tool.accepts ? tool.accepts.split(',').reduce((acc, curr) => ({ ...acc, [curr]: [] }), {}) : undefined,
        multiple: tool ? !tool.singleMode : false
    });

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const stripExtension = (name) => {
        return name.substring(0, name.lastIndexOf('.')) || name;
    };

    const handleDownload = async () => {
        if (!resultUrl) return;

        if (Capacitor.isNativePlatform()) {
            try {
                // Convert blob URL back to binary/base64 for Capacitor
                const response = await fetch(resultUrl.url);
                const blob = await response.blob();
                
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                    const base64Data = reader.result.split(',')[1];
                    
                    // 1. Save to temporary directory
                    const savedFile = await Filesystem.writeFile({
                        path: resultUrl.filename,
                        data: base64Data,
                        directory: Directory.Cache
                    });

                    // 2. Share it (this opens Android save/share dialog)
                    await Share.share({
                        title: 'Download Finished',
                        text: 'Save your converted file',
                        url: savedFile.uri,
                        dialogTitle: 'Save File'
                    });
                };
            } catch (err) {
                console.error('Native download error:', err);
                setError('Failed to save file on this device.');
            }
        } else {
            // Standard browser download
            const link = document.createElement('a');
            link.href = resultUrl.url;
            link.download = resultUrl.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleConvert = async () => {
        if (files.length === 0) return;
        
        setIsUploading(true);
        setProgress(0);
        setError(null);

        try {
            let resultBlob;
            let filename = `converted-${Date.now()}`;
            const file = files[0];

            switch (tool.id) {
                case 'png-to-jpg':
                case 'jpg-to-png': {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = URL.createObjectURL(file);
                    });
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    const format = tool.id === 'png-to-jpg' ? 'image/jpeg' : 'image/png';
                    const ext = tool.id === 'png-to-jpg' ? '.jpg' : '.png';
                    resultBlob = await new Promise(resolve => canvas.toBlob(resolve, format, 0.9));
                    filename = file.name.split('.')[0] + ext;
                    setProgress(100);
                    break;
                }

                case 'pdf-to-jpg': {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    const zip = new JSZip();
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: 2.0 });
                        const canvas = document.createElement('canvas');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
                        zip.file(`page-${i}.jpg`, blob);
                        setProgress(Math.round((i / pdf.numPages) * 100));
                    }
                    if (pdf.numPages === 1) {
                        resultBlob = await zip.file('page-1.jpg').async('blob');
                        filename = stripExtension(file.name) + '.jpg';
                    } else {
                        resultBlob = await zip.generateAsync({ type: 'blob' });
                        filename = stripExtension(file.name) + '-images.zip';
                    }
                    break;
                }

                case 'pdf-to-text': {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    let text = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        text += content.items.map(item => item.str).join(' ') + '\n';
                        setProgress(Math.round((i / pdf.numPages) * 100));
                    }
                    resultBlob = new Blob([text], { type: 'text/plain' });
                    filename = stripExtension(file.name) + '.txt';
                    break;
                }

                case 'text-to-pdf': {
                    const text = await file.text();
                    const doc = new jsPDF();
                    const lines = doc.splitTextToSize(text, 180);
                    doc.text(lines, 10, 10);
                    resultBlob = doc.output('blob');
                    filename = stripExtension(file.name) + '.pdf';
                    setProgress(100);
                    break;
                }

                case 'merge-pdf': {
                    const mergedPdf = await PDFLibDoc.create();
                    for (let i = 0; i < files.length; i++) {
                        const bytes = await files[i].arrayBuffer();
                        const pdf = await PDFLibDoc.load(bytes);
                        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                        pages.forEach(p => mergedPdf.addPage(p));
                        setProgress(Math.round(((i + 1) / files.length) * 100));
                    }
                    const mergedBytes = await mergedPdf.save();
                    resultBlob = new Blob([mergedBytes], { type: 'application/pdf' });
                    filename = 'merged.pdf';
                    break;
                }

                case 'split-pdf': {
                    const bytes = await file.arrayBuffer();
                    const pdfDoc = await PDFLibDoc.load(bytes);
                    const zip = new JSZip();
                    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
                        const newPdf = await PDFLibDoc.create();
                        const [page] = await newPdf.copyPages(pdfDoc, [i]);
                        newPdf.addPage(page);
                        const pdfBytes = await newPdf.save();
                        zip.file(`page-${i + 1}.pdf`, pdfBytes);
                        setProgress(Math.round(((i + 1) / pdfDoc.getPageCount()) * 100));
                    }
                    resultBlob = await zip.generateAsync({ type: 'blob' });
                    filename = file.name.replace('.pdf', '') + '-split.zip';
                    break;
                }

                case 'jpg-to-pdf': {
                    const pdfDoc = await PDFLibDoc.create();
                    for (let i = 0; i < files.length; i++) {
                        const imgBytes = await files[i].arrayBuffer();
                        let image;
                        if (files[i].type === 'image/png') image = await pdfDoc.embedPng(imgBytes);
                        else image = await pdfDoc.embedJpg(imgBytes);
                        const page = pdfDoc.addPage([image.width, image.height]);
                        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
                        setProgress(Math.round(((i + 1) / files.length) * 100));
                    }
                    const pdfBytes = await pdfDoc.save();
                    resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
                    filename = 'converted.pdf';
                    break;
                }

                case 'compress-pdf': {
                    const bytes = await file.arrayBuffer();
                    const pdfDoc = await PDFLibDoc.load(bytes);
                    const optimizedBytes = await pdfDoc.save({ useObjectStreams: false });
                    resultBlob = new Blob([optimizedBytes], { type: 'application/pdf' });
                    filename = file.name.replace('.pdf', '') + '-compressed.pdf';
                    setProgress(100);
                    break;
                }

                case 'word-to-pdf': {
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    const doc = new jsPDF();
                    const lines = doc.splitTextToSize(result.value || "No text found", 180);
                    doc.text(lines, 10, 10);
                    resultBlob = doc.output('blob');
                    filename = stripExtension(file.name) + '.pdf';
                    setProgress(100);
                    break;
                }

                case 'ppt-to-pdf': {
                    const zip = new JSZip();
                    const data = await file.arrayBuffer();
                    const content = await zip.loadAsync(data);
                    let text = '';
                    
                    // Simple slide text extractor (best effort offline)
                    const slideFiles = Object.keys(content.files).filter(name => name.startsWith('ppt/slides/slide'));
                    for (let i = 0; i < slideFiles.length; i++) {
                        const xml = await content.file(slideFiles[i]).async('text');
                        const matches = xml.match(/<a:t>([^<]*)<\/a:t>/g);
                        if (matches) {
                            text += matches.map(m => m.replace(/<[^>]*>/g, '')).join(' ') + '\n';
                        }
                        setProgress(Math.round(((i + 1) / slideFiles.length) * 100));
                    }
                    
                    const doc = new jsPDF();
                    const lines = doc.splitTextToSize(text || "No text could be extracted from this PowerPoint.", 180);
                    doc.text(lines, 10, 10);
                    resultBlob = doc.output('blob');
                    filename = stripExtension(file.name) + '.pdf';
                    break;
                }

                case 'excel-to-pdf': {
                    const data = await file.arrayBuffer();
                    const workbook = xlsx.read(data);
                    let text = '';
                    workbook.SheetNames.forEach(name => {
                        const sheet = workbook.Sheets[name];
                        const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
                        json.forEach(row => { text += row.join(' | ') + '\n'; });
                    });
                    const doc = new jsPDF();
                    const lines = doc.splitTextToSize(text, 180);
                    doc.text(lines, 10, 10);
                    resultBlob = doc.output('blob');
                    filename = stripExtension(file.name) + '.pdf';
                    setProgress(100);
                    break;
                }

                case 'pdf-to-word': {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    let text = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        text += content.items.map(item => item.str).join(' ') + '\n';
                    }
                    
                    const doc = new Document({
                        sections: [{
                            children: text.split('\n').filter(Boolean).map(line => new Paragraph(line))
                        }]
                    });
                    
                    resultBlob = await Packer.toBlob(doc);
                    filename = stripExtension(file.name) + '.docx';
                    setProgress(100);
                    break;
                }

                case 'pdf-to-excel': {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    let text = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        text += content.items.map(item => item.str).join(' ') + '\n';
                    }
                    const rows = text.split('\n').map(line => [line]);
                    const worksheet = xlsx.utils.aoa_to_sheet(rows);
                    const workbook = xlsx.utils.book_new();
                    xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
                    const wbout = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
                    resultBlob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    filename = stripExtension(file.name) + '.xlsx';
                    setProgress(100);
                    break;
                }

                case 'pdf-to-ppt': {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    const pres = new pptxgen();
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        const text = content.items.map(item => item.str).join(' ');
                        const slide = pres.addSlide();
                        slide.addText(text, { x: 0.5, y: 0.5, w: '90%', h: '90%', fontSize: 12 });
                        setProgress(Math.round((i / pdf.numPages) * 100));
                    }
                    const pptout = await pres.write('blob');
                    resultBlob = pptout;
                    filename = stripExtension(file.name) + '.pptx';
                    break;
                }

                default:
                    // Fallback to API if not implemented locally (should not happen for core tools)
                    const formData = new FormData();
                    if (tool.singleMode) formData.append('file', files[0]);
                    else files.forEach(f => formData.append('files', f));

                    const response = await axios.post(`${API_BASE}${tool.api}`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        responseType: 'blob',
                        onUploadProgress: (progressEvent) => {
                            setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                        }
                    });
                    resultBlob = response.data;
                    break;
            }

            const url = window.URL.createObjectURL(resultBlob);
            setResultUrl({ url, filename });
        } catch (err) {
            console.error(err);
            setError('Conversion failed. Please try again with a valid file.');
        } finally {
            setIsUploading(false);
        }
    };

    if (!tool) return null;

    const Icon = tool.icon;

    return (
        <div className="min-h-[80vh] bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <div className={`w-16 h-16 mx-auto ${tool.bg} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                        <Icon className={tool.color} size={32} />
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{tool.name}</h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">{tool.desc}</p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-primary-500/5 border border-gray-100 overflow-hidden">
                    {!resultUrl ? (
                        <div className="p-8 md:p-12">
                            <div 
                                {...getRootProps()} 
                                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300
                                ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-400 hover:bg-gray-50'}
                                ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
                            >
                                <input {...getInputProps()} />
                                <UploadCloud className={`mx-auto h-16 w-16 mb-4 ${isDragActive ? 'text-primary-500' : 'text-gray-400'}`} />
                                <p className="text-xl font-medium text-gray-700 mb-2">
                                    {isDragActive ? "Drop files here..." : "Drag & drop files here"}
                                </p>
                                <p className="text-sm text-gray-500 mb-6">or click to browse from your computer</p>
                                <div className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors">
                                    Select Files
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3"
                                    >
                                        <AlertCircle size={20} />
                                        <span>{error}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {files.length > 0 && (
                                <div className="mt-8">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Selected Files</h4>
                                    <div className="space-y-3">
                                        {files.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <File className="text-gray-400 flex-shrink-0" size={20} />
                                                    <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
                                                    <span className="text-xs text-gray-400 flex-shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                </div>
                                                {!isUploading && (
                                                    <button onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                                        <X size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 text-center border-t border-gray-100 pt-8">
                                        {isUploading ? (
                                            <div className="w-full max-w-md mx-auto">
                                                <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                                                    <span>Processing...</span>
                                                    <span>{progress}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                                    <div className="bg-primary-600 h-3 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={handleConvert}
                                                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-all shadow-lg w-full sm:w-auto hover:-translate-y-0.5"
                                            >
                                                Convert Now <ArrowRight size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="p-8 md:p-16 text-center"
                        >
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="text-green-500" size={40} />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Conversion Successful!</h2>
                            <p className="text-gray-500 mb-10 max-w-md mx-auto">Your file has been processed and is ready for download. It will be securely deleted from our servers.</p>
                            
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={handleDownload}
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all shadow-lg hover:-translate-y-0.5"
                                >
                                    <FileDown size={20} /> Download File
                                </button>
                                <button 
                                    onClick={() => { setResultUrl(null); setFiles([]); }}
                                    className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    Convert Another
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
                
                <div className="mt-8 text-center flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Shield size={16} className="text-green-500" />
                    <span>Files are securely encrypted and automatically deleted after 30 minutes.</span>
                </div>
            </div>
        </div>
    );
};

export default Converter;
