import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Converter from './pages/Converter';
import Legal from './pages/Legal';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen selection:bg-primary-500 selection:text-white">
        <Navbar />
        <main className="flex-grow bg-white">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/convert/:type" element={<Converter />} />
            <Route path="/about" element={<Legal page="about" />} />
            <Route path="/contact" element={<Legal page="contact" />} />
            <Route path="/privacy" element={<Legal page="privacy" />} />
            <Route path="/terms" element={<Legal page="terms" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
