import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Predict from './pages/Predict';
import History from './pages/History';
import Dashboard from './pages/Dashboard';
import RiskMap from './pages/RiskMap';
import About from './pages/About';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-100 via-slate-100 to-slate-300 dark:from-storm-900 dark:via-storm-900 dark:to-slate-900">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/predict" element={<Predict />} />
        <Route path="/history" element={<History />} />
        <Route path="/risk-map" element={<RiskMap />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/about" element={<About />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

