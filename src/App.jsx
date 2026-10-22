import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Search, PlusCircle, AlertCircle, FileSearch, 
  CheckCircle, Bell, Settings, Shield, MapPin, 
  Clock, Package, Lock, Fingerprint, Image as ImageIcon,
  Check, X, AlertTriangle, Eye, ChevronRight
} from 'lucide-react';

// --- CANVAS PLACEHOLDER COMPONENT ---
// Renders a pseudo-3D perspective grid and floating nodes representing spatial items.
const SpatialCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let offset = 0;

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw horizon
      ctx.strokeStyle = '#1e293b'; // slate-800
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, cy - 100);
      ctx.lineTo(canvas.width, cy - 100);
      ctx.stroke();

      // Perspective Grid lines
      ctx.strokeStyle = '#0d948833'; // teal with opacity
      ctx.lineWidth = 1;
      
      // Vertical converging lines
      for (let i = -20; i <= 20; i++) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - 100);
        ctx.lineTo(cx + i * 100, canvas.height);
        ctx.stroke();
      }

      // Horizontal moving lines (pseudo 3D effect)
      offset = (offset + 0.5) % 50;
      for (let i = 0; i < 30; i++) {
        const yPos = cy - 100 + Math.pow(i, 1.5) * 10 + (offset * Math.pow(i, 0.5));
        if (yPos > cy - 100 && yPos < canvas.height) {
          ctx.beginPath();
          ctx.moveTo(0, yPos);
          ctx.lineTo(canvas.width, yPos);
          ctx.stroke();
        }
      }

      // Draw Placeholder Nodes
      const time = Date.now() * 0.001;
      const nodes = [
        { x: cx - 200, y: cy + 50 + Math.sin(time) * 10, color: '#0d9488', label: 'Item 1 (Match)' },
        { x: cx + 300, y: cy + 150 + Math.cos(time) * 15, color: '#f59e0b', label: 'Pending Claim' },
        { x: cx + 50, y: cy + 250 + Math.sin(time * 1.5) * 20, color: '#64748b', label: 'Report #89' }
      ];

      nodes.forEach(node => {
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = node.color + '44'; // glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, 16 + Math.sin(time*3)*4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(node.label, node.x + 20, node.y + 4);
      });

      // Big Title Placeholder
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.font = 'bold 48px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('3D SPATIAL INTERFACE (PLACEHOLDER)', cx, cy - 200);
      ctx.textAlign = 'left';

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0 pointer-events-none" />;
};

// --- UI COMPONENTS ---
const FloatingPanel = ({ title, children, className = "", right = false, center = false }) => (
  <div className={`
    pointer-events-auto flex flex-col bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 
    rounded-2xl shadow-2xl overflow-hidden transition-all duration-300
    ${right ? 'ml-auto' : ''} 
    ${center ? 'mx-auto' : ''}
    ${className}
  `}>
    <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
    </div>
    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
      {children}
    </div>
  </div>
);

// --- VIEWS ---

const DashboardView = ({ setView }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto mt-8 pointer-events-none">
    <FloatingPanel title="Welcome to eMilap" className="h-64 col-span-1 md:col-span-2 pointer-events-auto">
      <div className="flex flex-col h-full justify-between">
        <p className="text-slate-400">Your community lost and found. Fast matching, secure claims.</p>
        <div className="flex gap-4 mt-6">
          <button onClick={() => setView('report_lost')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition">
            <AlertCircle size={18} /> I lost something
          </button>
          <button onClick={() => setView('report_found')} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20 transition">
            <CheckCircle size={18} /> I found something
          </button>
        </div>
      </div>
    </FloatingPanel>

    <FloatingPanel title="Action Items" className="h-64 pointer-events-auto">
      <ul className="space-y-4">
        <li className="flex items-center gap-3 p-3 rounded-lg bg-teal-900/20 border border-teal-800/30 cursor-pointer hover:bg-teal-900/40 transition">
          <div className="p-2 bg-teal-500/20 rounded-full text-teal-400"><FileSearch size={16} /></div>
          <div>
            <p className="text-sm text-slate-200 font-medium">New Match Suggestion</p>
            <p className="text-xs text-slate-500">For your "Black Backpack"</p>
          </div>
        </li>
        <li className="flex items-center gap-3 p-3 rounded-lg bg-amber-900/20 border border-amber-800/30 cursor-pointer hover:bg-amber-900/40 transition">
          <div className="p-2 bg-amber-500/20 rounded-full text-amber-400"><AlertTriangle size={16} /></div>
          <div>
            <p className="text-sm text-slate-200 font-medium">Claim Needs Review</p>
            <p className="text-xs text-slate-500">Someone claimed your found AirPods</p>
          </div>
        </li>
      </ul>
    </FloatingPanel>
  </div>
);

const ReportFormView = ({ type }) => (
  <div className="w-full max-w-2xl mx-auto mt-8 pointer-events-none h-[80vh] flex flex-col">
    <FloatingPanel title={`Report ${type === 'lost' ? 'Lost' : 'Found'} Item`} className="pointer-events-auto flex-1">
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Eye size={16} /> Public Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Title</label>
              <input type="text" placeholder="e.g. Blue Hydroflask" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-teal-500 transition" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Public Description</label>
              <textarea placeholder="Describe the item visibly..." className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 h-24 focus:outline-none focus:border-teal-500 transition"></textarea>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Category</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-teal-500 transition">
                <option>Electronics</option><option>Water Bottles</option><option>Bags</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Color</label>
              <input type="text" placeholder="Primary color" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-teal-500 transition" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <h3 className="text-sm font-medium text-amber-500 uppercase tracking-wider flex items-center gap-2">
            <Lock size={16} /> Private Ownership Clues
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            These details stay private and are only shown to human reviewers to verify ownership (e.g., lock screen wallpaper, specific scratches, unique contents).
          </p>
          <textarea placeholder="Hidden identifying marks or contents..." className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-200 h-20 focus:outline-none focus:border-amber-500 transition"></textarea>
        </div>

        <button className="w-full bg-teal-600 hover:bg-teal-500 text-white font-medium py-4 rounded-xl shadow-lg transition">
          Submit Report & Queue Matching
        </button>
      </form>
    </FloatingPanel>
  </div>
);

const BrowseView = () => (
  <div className="w-full max-w-5xl mx-auto mt-8 pointer-events-none h-[80vh] flex flex-col gap-4">
    <div className="flex gap-4 pointer-events-auto">
      <div className="flex-1 bg-slate-900/80 backdrop-blur-md rounded-xl p-2 border border-slate-700 flex items-center px-4">
        <Search className="text-slate-400 mr-3" size={20} />
        <input type="text" placeholder="Search community reports..." className="bg-transparent border-none outline-none text-slate-200 w-full" />
      </div>
      <button className="px-6 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-700 transition">Filters</button>
    </div>
    
    <FloatingPanel title="Recent Community Reports" className="flex-1 pointer-events-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-500 cursor-pointer transition flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className={`text-xs px-2 py-1 rounded bg-slate-900 font-medium ${i%2===0 ? 'text-teal-400' : 'text-slate-300'}`}>
                {i%2===0 ? 'FOUND' : 'LOST'}
              </span>
              <span className="text-xs text-slate-500">2h ago</span>
            </div>
            <h4 className="text-slate-200 font-medium">Apple AirPods Pro</h4>
            <p className="text-slate-400 text-sm line-clamp-2">Found near the library second floor seating area. White case.</p>
            <div className="flex items-center gap-2 mt-auto pt-2 text-xs text-slate-500">
              <MapPin size={12}/> Library
              <div className="w-1 h-1 rounded-full bg-slate-600"></div>
              <Clock size={12}/> Today, 2pm
            </div>
          </div>
        ))}
      </div>
    </FloatingPanel>
  </div>
);

const MatchesView = () => (
  <div className="w-full max-w-4xl mx-auto mt-8 pointer-events-none h-[80vh] flex flex-col">
    <FloatingPanel title="Candidate Matches" className="flex-1 pointer-events-auto">
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-slate-800/40 border border-teal-900/50 flex flex-col md:flex-row gap-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-bl-full blur-xl"></div>
           
           <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-teal-400 text-sm font-semibold tracking-wide">
                <CheckCircle size={16}/> Strong Potential Match
              </div>
              <h3 className="text-lg text-slate-100">Found: Black Northface Backpack</h3>
              <p className="text-sm text-slate-400">Reported found at Student Union • 1 hour after your loss report.</p>
              
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs bg-slate-900 border border-slate-700 text-slate-300 px-2 py-1 rounded">Similar Description (85%)</span>
                <span className="text-xs bg-slate-900 border border-slate-700 text-slate-300 px-2 py-1 rounded">Category: Bags</span>
                <span className="text-xs bg-slate-900 border border-slate-700 text-slate-300 px-2 py-1 rounded">Color: Black</span>
              </div>
           </div>

           <div className="flex flex-row md:flex-col gap-2 justify-center">
              <button className="flex-1 bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition">Review & Claim</button>
              <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2 rounded-lg text-sm transition">Dismiss</button>
           </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/50 flex flex-col md:flex-row gap-6">
           <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                <FileSearch size={16}/> Moderate Candidate
              </div>
              <h3 className="text-lg text-slate-300">Found: Generic Black Bag</h3>
              <p className="text-sm text-slate-500">Reported found at Library • Category and color match, location differs.</p>
           </div>
           <div className="flex flex-row md:flex-col gap-2 justify-center">
              <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition">View Details</button>
           </div>
        </div>
      </div>
    </FloatingPanel>
  </div>
);

const ClaimsView = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto mt-8 pointer-events-none h-[80vh]">
    <FloatingPanel title="Pending Claims" className="col-span-1 pointer-events-auto h-full hidden md:flex">
      <div className="space-y-2">
        <div className="p-3 bg-slate-800 rounded-lg border-l-2 border-amber-500 cursor-pointer">
          <p className="text-sm text-slate-200">Claim #1024</p>
          <p className="text-xs text-slate-400">Found: Calculator</p>
          <span className="inline-block mt-2 text-[10px] uppercase bg-amber-500/20 text-amber-500 px-2 py-1 rounded">Under Review</span>
        </div>
      </div>
    </FloatingPanel>
    
    <FloatingPanel title="Claim Review Workspace" className="col-span-1 md:col-span-2 pointer-events-auto h-full">
      <div className="h-full flex flex-col">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg text-slate-100">Claim for "TI-84 Calculator"</h3>
              <p className="text-sm text-slate-400">Submitted by Member_8492</p>
            </div>
            <div className="bg-slate-900 px-3 py-1 rounded border border-slate-700 text-xs text-slate-300 flex items-center gap-2">
              <Clock size={12}/> 2 days ago
            </div>
          </div>
          
          <hr className="border-slate-700" />
          
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2"><Lock size={14}/> Claimant's Private Message</h4>
            <div className="p-3 bg-slate-900 rounded-lg text-sm text-slate-300 font-mono">
              "It has a small scratch on the top right of the screen, and my initials (JD) are written in silver sharpie on the battery cover inside."
            </div>
          </div>

          <div>
             <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2"><Fingerprint size={14}/> Reporter's Verification Note</h4>
             <div className="p-3 bg-slate-900 rounded-lg text-sm text-slate-300">
              "I checked the battery cover, and JD is indeed written there."
             </div>
          </div>
        </div>

        <div className="mt-auto pt-6 flex gap-3">
          <button className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl shadow transition font-medium flex justify-center items-center gap-2">
            <Check size={18}/> Approve Handover
          </button>
          <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl border border-slate-600 transition font-medium">
            Request Info
          </button>
          <button className="bg-red-900/40 hover:bg-red-900/60 text-red-400 px-6 py-3 rounded-xl border border-red-900/50 transition font-medium flex justify-center items-center">
            <X size={18}/> Reject
          </button>
        </div>
      </div>
    </FloatingPanel>
  </div>
);

const AdminView = () => (
  <div className="w-full max-w-5xl mx-auto mt-8 pointer-events-none h-[80vh] flex flex-col gap-6">
    <FloatingPanel title="Moderation Overview" className="pointer-events-auto shrink-0">
       <div className="flex gap-4">
         <div className="flex-1 bg-slate-800 rounded-lg p-4 text-center border border-slate-700">
           <p className="text-3xl text-teal-400 font-light">1,402</p>
           <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">Active Users</p>
         </div>
         <div className="flex-1 bg-slate-800 rounded-lg p-4 text-center border border-slate-700">
           <p className="text-3xl text-amber-500 font-light">4</p>
           <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">Flagged Reports</p>
         </div>
         <div className="flex-1 bg-slate-800 rounded-lg p-4 text-center border border-slate-700">
           <p className="text-3xl text-red-400 font-light">1</p>
           <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">Pending Disputes</p>
         </div>
       </div>
    </FloatingPanel>

    <FloatingPanel title="Moderation Queue" className="flex-1 pointer-events-auto">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="text-xs text-slate-500 uppercase bg-slate-900/50 border-b border-slate-700">
          <tr>
            <th className="px-4 py-3 font-medium">Target ID</th>
            <th className="px-4 py-3 font-medium">Reason</th>
            <th className="px-4 py-3 font-medium">Reporter</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-800 hover:bg-slate-800/30">
            <td className="px-4 py-4 font-mono text-xs">rep_938a1</td>
            <td className="px-4 py-4"><span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded text-xs">Suspicious Content</span></td>
            <td className="px-4 py-4">usr_moderator1</td>
            <td className="px-4 py-4 text-right">
              <button className="text-teal-400 hover:text-teal-300 mr-3 text-xs">Review</button>
              <button className="text-red-400 hover:text-red-300 text-xs">Remove</button>
            </td>
          </tr>
          <tr className="hover:bg-slate-800/30">
            <td className="px-4 py-4 font-mono text-xs">clm_bb42x</td>
            <td className="px-4 py-4"><span className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs">Dispute Escalation</span></td>
            <td className="px-4 py-4">usr_2910</td>
            <td className="px-4 py-4 text-right">
              <button className="text-teal-400 hover:text-teal-300 mr-3 text-xs">Review</button>
              <button className="text-slate-400 hover:text-slate-300 text-xs">Ignore</button>
            </td>
          </tr>
        </tbody>
      </table>
    </FloatingPanel>
  </div>
);

const EmptyPlaceholder = ({ title }) => (
  <div className="w-full max-w-2xl mx-auto mt-8 pointer-events-none">
     <FloatingPanel title={title} className="pointer-events-auto">
        <div className="flex flex-col items-center justify-center h-48 text-slate-500">
          <Package size={48} className="mb-4 opacity-20" />
          <p>This module is currently empty or under construction.</p>
        </div>
     </FloatingPanel>
  </div>
);

// --- MAIN APP ---
export default function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'report_lost', icon: AlertCircle, label: 'Report Lost' },
    { id: 'report_found', icon: CheckCircle, label: 'Report Found' },
    { id: 'browse', icon: Search, label: 'Browse' },
    { id: 'matches', icon: FileSearch, label: 'Matches' },
    { id: 'claims', icon: Lock, label: 'Claims' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'admin', icon: Shield, label: 'Admin' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView setView={setActiveView} />;
      case 'report_lost': return <ReportFormView type="lost" />;
      case 'report_found': return <ReportFormView type="found" />;
      case 'browse': return <BrowseView />;
      case 'matches': return <MatchesView />;
      case 'claims': return <ClaimsView />;
      case 'admin': return <AdminView />;
      default: return <EmptyPlaceholder title={navItems.find(i => i.id === activeView)?.label || "View"} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-teal-500/30">
      
      {/* Sidebar Navigation */}
      <nav className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 z-10 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-300 flex items-center gap-2">
            <MapPin className="text-teal-400" /> eMilap
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-medium">Community Lost &amp; Found</p>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium
                ${activeView === item.id 
                  ? 'bg-teal-900/30 text-teal-400 border border-teal-800/50 shadow-inner' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                }
              `}
            >
              <item.icon size={18} />
              {item.label}
              {/* Fake notification badges */}
              {item.id === 'matches' && <span className="ml-auto bg-teal-500 text-slate-900 text-[10px] px-2 py-0.5 rounded-full font-bold">1</span>}
              {item.id === 'claims' && <span className="ml-auto bg-amber-500 text-slate-900 text-[10px] px-2 py-0.5 rounded-full font-bold">2</span>}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center font-bold text-sm">
              JD
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">Jane Doe</p>
              <p className="text-xs text-slate-500 truncate">Engineering Quad</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col">
        {/* The 3D Canvas Background */}
        <SpatialCanvas />

        {/* Top Header (Floating above canvas) */}
        <header className="h-16 flex items-center px-8 z-10 pointer-events-none">
          <div className="ml-auto pointer-events-auto flex items-center gap-4">
             <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-full px-4 py-1.5 flex items-center gap-2 text-xs font-medium text-slate-300">
               <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
               Community Active
             </div>
          </div>
        </header>

        {/* Dynamic Views (Floating Panels) */}
        <div className="flex-1 p-6 relative z-10 overflow-hidden flex flex-col pointer-events-none">
          {renderView()}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #334155;
          border-radius: 10px;
        }
      `}} />
    </div>
  );
}
