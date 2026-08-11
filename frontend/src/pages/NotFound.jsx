import { Link } from 'react-router-dom';
import { Home, Zap } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-brand to-electric rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Zap size={28} className="text-white" />
        </div>
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand to-electric mb-3">404</h1>
        <p className="text-xl text-white font-semibold mb-2">Page not found</p>
        <p className="text-slate-500 mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2"><Home size={16} /> Back to Home</Link>
      </div>
    </div>
  );
}
