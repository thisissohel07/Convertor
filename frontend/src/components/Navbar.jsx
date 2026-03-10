import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

const Navbar = () => {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="bg-primary-500 p-2 rounded-xl text-white group-hover:bg-primary-600 transition-colors">
                            <Layers size={24} />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-gray-900">
                            Convert<span className="text-primary-500">Pro</span>
                        </span>
                    </Link>
                    
                    <nav className="hidden md:flex gap-8">
                        <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
                        <a href="/#tools" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Tools</a>
                        <Link to="/about" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">About</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <a href="/#tools" className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
                            Get Started
                        </a>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
