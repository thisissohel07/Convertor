import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { TOOLS } from '../utils/tools';
import { Zap, Shield, Sparkles } from 'lucide-react';

const Home = () => {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-50 via-white to-white -z-10" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight mb-8">
                            Convert Files with <br className="hidden md:block"/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">
                                Unmatched Speed
                            </span>
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 mb-10">
                            The ultimate, professional platform to convert, merge, and edit your files securely. Completely free and runs securely.
                        </p>
                        <div className="flex justify-center gap-4">
                            <a href="#tools" className="px-8 py-4 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-1">
                                Explore Tools
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Tools Section */}
            <section id="tools" className="py-24 bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Conversion Tools</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">Select a tool below to start securely processing your files immediately.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {TOOLS.map((tool) => {
                            const Icon = tool.icon;
                            return (
                                <Link 
                                    to={tool.comingSoon ? '#' : `/convert/${tool.id}`} 
                                    key={tool.id}
                                    className={`group relative bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all duration-300 ${tool.comingSoon ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    <div className={`w-12 h-12 rounded-xl ${tool.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                        <Icon className={`${tool.color}`} size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{tool.name}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{tool.desc}</p>
                                    {tool.comingSoon && (
                                        <span className="absolute top-4 right-4 bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-1 rounded-md">Soon</span>
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                                <Zap size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
                            <p className="text-gray-600">Our powerful cloud servers process your files in seconds, not minutes.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-6">
                                <Shield size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">100% Secure</h3>
                            <p className="text-gray-600">All uploaded and converted files are automatically deleted after 30 minutes.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-6">
                                <Sparkles size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Premium Quality</h3>
                            <p className="text-gray-600">Enjoy high-fidelity conversions without losing original formatting or quality.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
