import React from 'react';

const content = {
    about: { title: "About Us", text: "ConvertPro is a premium file conversion platform designed to make your life easier. We believe in fast, secure, and beautiful tools." },
    contact: { title: "Contact Us", text: "Have a question? Reach out to us at support@convertpro.com" },
    privacy: { title: "Privacy Policy", text: "Your files are secure. We automatically delete all uploaded and converted files from our servers within 30 minutes. We do not inspect, sell, or share your data." },
    terms: { title: "Terms of Service", text: "By using ConvertPro, you agree to not use our service for malicious purposes or illegal file distribution." }
};

const Legal = ({ page }) => {
    const data = content[page] || { title: "Page Not Found", text: "" };
    
    return (
        <div className="max-w-3xl mx-auto px-4 py-24 min-h-[60vh]">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">{data.title}</h1>
            <div className="prose prose-lg text-gray-600">
                <p>{data.text}</p>
            </div>
        </div>
    );
};

export default Legal;
