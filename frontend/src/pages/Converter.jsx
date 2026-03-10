import React, { useState, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, X, ArrowRight, Loader2, CheckCircle2, AlertCircle, Shield, FileDown } from 'lucide-react';
import axios from 'axios';
import { TOOLS } from '../utils/tools';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/convert';

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

    const handleConvert = async () => {
        if (files.length === 0) return;
        
        setIsUploading(true);
        setProgress(0);
        setError(null);

        if (tool.id === 'pdf-to-jpg') {
            try {
                const file = files[0];
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const numPages = pdf.numPages;
                
                const zip = new JSZip();
                
                for (let i = 1; i <= numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 }); 
                    
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport,
                    };
                    
                    await page.render(renderContext).promise;
                    
                    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
                    zip.file(`page-${i}.jpg`, blob);
                    
                    setProgress(Math.round((i / numPages) * 100));
                }
                
                if (numPages === 1) {
                    const singleBlob = await zip.file('page-1.jpg').async('blob');
                    const singleUrl = window.URL.createObjectURL(singleBlob);
                    setResultUrl({ url: singleUrl, filename: `${file.name.replace('.pdf', '')}.jpg` });
                } else {
                    const zipBlob = await zip.generateAsync({ type: 'blob' });
                    const url = window.URL.createObjectURL(zipBlob);
                    setResultUrl({ url, filename: `${file.name.replace('.pdf', '')}-images.zip` });
                }
                setIsUploading(false);
                return;
            } catch (err) {
                console.error(err);
                setError('Failed to extract images from PDF.');
                setIsUploading(false);
                return;
            }
        }

        const formData = new FormData();
        if (tool.singleMode) {
            formData.append('file', files[0]);
        } else {
            files.forEach(f => formData.append('files', f));
        }

        try {
            const response = await axios.post(`${API_BASE}${tool.api}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            
            // Determine fallback extension
            let fallbackExt = tool.id.split('-').pop(); // e.g., 'jpg', 'pdf', 'png'
            if (fallbackExt === 'text') fallbackExt = 'txt';
            if (fallbackExt === 'word') fallbackExt = 'docx';
            if (fallbackExt === 'excel') fallbackExt = 'xlsx';
            if (fallbackExt === 'ppt') fallbackExt = 'pptx';
            
            let filename = `converted-${Date.now()}.${fallbackExt}`;
            
            // Try to extract filename from header if present
            const disposition = response.headers['content-disposition'];
            if (disposition && disposition.indexOf('attachment') !== -1) {
                var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                var matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) { 
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            setResultUrl({ url, filename });

        } catch (err) {
            console.error(err);
            if (err.response && err.response.data instanceof Blob) {
                // Parse blob error
                const errorText = await err.response.data.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    setError(errorJson.error || 'Conversion failed. Please check file formats.');
                } catch(e) {
                     setError('Conversion failed. Server issue.');
                }
            } else {
                 setError('Conversion failed. Please try again with a valid file.');
            }
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
                                <a 
                                    href={resultUrl.url} 
                                    download={resultUrl.filename}
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all shadow-lg hover:-translate-y-0.5"
                                >
                                    <FileDown size={20} /> Download File
                                </a>
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
