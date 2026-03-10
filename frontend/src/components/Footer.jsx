import { Link } from 'react-router-dom';
import { Layers, Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 pt-16 pb-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div className="col-span-1 md:col-span-1">
                    <Link to="/" className="flex items-center gap-2 group mb-4">
                        <div className="bg-primary-500 p-1.5 rounded-lg text-white group-hover:bg-primary-600 transition-colors">
                            <Layers size={20} />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-gray-900">
                            Convert<span className="text-primary-500">Pro</span>
                        </span>
                    </Link>
                    <p className="text-gray-500 text-sm mb-6">
                        Fast, secure, and free file conversion tools for everyone. Premium design, built for productivity.
                    </p>
                    <div className="flex gap-4 text-gray-400">
                        <a href="#" className="hover:text-primary-500 transition-colors"><Twitter size={20} /></a>
                        <a href="#" className="hover:text-primary-500 transition-colors"><Github size={20} /></a>
                        <a href="#" className="hover:text-primary-500 transition-colors"><Linkedin size={20} /></a>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Popular Tools</h3>
                    <ul className="space-y-3 text-sm text-gray-500">
                        <li><Link to="/convert/pdf-to-word" className="hover:text-primary-500 transition-colors">PDF to Word</Link></li>
                        <li><Link to="/convert/jpg-to-pdf" className="hover:text-primary-500 transition-colors">JPG to PDF</Link></li>
                        <li><Link to="/convert/merge-pdf" className="hover:text-primary-500 transition-colors">Merge PDF</Link></li>
                        <li><Link to="/convert/pdf-to-jpg" className="hover:text-primary-500 transition-colors">PDF to JPG</Link></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
                    <ul className="space-y-3 text-sm text-gray-500">
                        <li><Link to="/about" className="hover:text-primary-500 transition-colors">About Us</Link></li>
                        <li><Link to="/contact" className="hover:text-primary-500 transition-colors">Contact</Link></li>
                        <li><a href="/#faq" className="hover:text-primary-500 transition-colors">FAQ</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
                    <ul className="space-y-3 text-sm text-gray-500">
                        <li><Link to="/privacy" className="hover:text-primary-500 transition-colors">Privacy Policy</Link></li>
                        <li><Link to="/terms" className="hover:text-primary-500 transition-colors">Terms of Service</Link></li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-gray-400 text-sm">© {new Date().getFullYear()} ConvertPro. All rights reserved.</p>
                <div className="flex gap-4 text-sm text-gray-400">
                    <span>Secure & Private</span>
                </div>
            </div>
        </footer>
    );
};
export default Footer;
