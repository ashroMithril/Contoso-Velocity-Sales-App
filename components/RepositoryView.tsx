
import React, { useState } from 'react';
import { getProducts, getAssets, getTeamActivity } from '../services/dataService';
import { 
    Search, 
    Box, 
    Tag, 
    FileText, 
    Download, 
    Clock, 
    Users, 
    File, 
    Presentation, 
    Shield, 
    Cpu, 
    Cloud, 
    Zap,
    TrendingUp
} from 'lucide-react';

const RepositoryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'ASSETS' | 'TEAM'>('PRODUCTS');
  const [searchQuery, setSearchQuery] = useState('');

  const products = getProducts();
  const assets = getAssets();
  const activity = getTeamActivity();

  // Filter Logic
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredAssets = assets.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.owner.toLowerCase().includes(searchQuery.toLowerCase()));

  const getProductIcon = (category: string) => {
      switch(category) {
          case 'Cloud Infrastructure': return <Cloud className="w-5 h-5 text-blue-500" />;
          case 'Cybersecurity': return <Shield className="w-5 h-5 text-red-500" />;
          case 'AI & Automation': return <Zap className="w-5 h-5 text-purple-500" />;
          case 'IoT': return <Cpu className="w-5 h-5 text-green-500" />;
          default: return <Box className="w-5 h-5 text-gray-500" />;
      }
  };

  const getAssetIcon = (type: string) => {
      switch(type) {
          case 'Proposal': return <FileText className="w-4 h-4 text-indigo-600" />;
          case 'Presentation': return <Presentation className="w-4 h-4 text-orange-600" />;
          default: return <File className="w-4 h-4 text-gray-500" />;
      }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
             <div className="max-w-6xl mx-auto">
                 <div className="flex items-center justify-between mb-6">
                      <div>
                          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Knowledge Base</h1>
                          <p className="text-sm text-gray-500 mt-1">Company products, sales assets, and team collaboration stream.</p>
                      </div>
                      <div className="flex items-center gap-4 bg-gray-100 p-1 rounded-lg">
                          <button 
                             onClick={() => setActiveTab('PRODUCTS')}
                             className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'PRODUCTS' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                              Company & Products
                          </button>
                          <button 
                             onClick={() => setActiveTab('ASSETS')}
                             className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'ASSETS' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                              Sales Assets
                          </button>
                          <button 
                             onClick={() => setActiveTab('TEAM')}
                             className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'TEAM' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                              Team Pulse
                          </button>
                      </div>
                 </div>

                 {/* Search Bar (Hidden for Team Tab) */}
                 {activeTab !== 'TEAM' && (
                     <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                         <input 
                            type="text" 
                            placeholder={activeTab === 'PRODUCTS' ? "Search products..." : "Search document repository..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm"
                         />
                     </div>
                 )}
             </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-6xl mx-auto">
                
                {/* TAB 1: PRODUCTS */}
                {activeTab === 'PRODUCTS' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-indigo-900 rounded-2xl p-8 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold mb-2">Contoso Enterprise Solutions</h2>
                                <p className="text-indigo-200 max-w-xl">Empowering businesses with cloud-native infrastructure, advanced AI agents, and banking-grade security since 2010.</p>
                            </div>
                            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none"></div>
                            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts.map((p) => (
                                <div key={p.sku} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-indigo-200 transition-all group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                                            {getProductIcon(p.category)}
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded uppercase tracking-wider">{p.sku}</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1">{p.name}</h3>
                                    <p className="text-xs text-indigo-600 font-semibold mb-3">{p.category}</p>
                                    <p className="text-sm text-gray-500 mb-6 min-h-[40px]">{p.desc}</p>
                                    <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                                        <span className="text-lg font-bold text-gray-900">${p.price.toLocaleString()}</span>
                                        <span className="text-xs text-gray-400">/ year</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 2: ASSETS */}
                {activeTab === 'ASSETS' && (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Asset Name</th>
                                    <th className="px-6 py-4 font-semibold">Type</th>
                                    <th className="px-6 py-4 font-semibold">Owner</th>
                                    <th className="px-6 py-4 font-semibold">Date Modified</th>
                                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredAssets.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 flex items-center gap-2">
                                                {getAssetIcon(asset.type)}
                                                {asset.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                {asset.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{asset.owner}</td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{asset.date}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-full transition-colors">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredAssets.length === 0 && (
                             <div className="p-12 text-center text-gray-400">No assets found matching your search.</div>
                        )}
                    </div>
                )}

                {/* TAB 3: TEAM PULSE */}
                {activeTab === 'TEAM' && (
                    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-2 mb-6 text-gray-900 font-bold text-lg">
                            <TrendingUp className="w-5 h-5 text-green-600" /> Recent Activity
                        </div>
                        <div className="space-y-4">
                            {activity.map((item, idx) => (
                                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                    {/* Connecting Line for Feed Effect */}
                                    {idx !== activity.length - 1 && (
                                        <div className="absolute left-[2.25rem] top-14 bottom-[-1rem] w-px bg-gray-100 z-0"></div>
                                    )}
                                    
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md z-10">
                                        {item.avatar}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm text-gray-900">
                                                <span className="font-bold">{item.user}</span> {item.action} <span className="font-semibold text-indigo-600">{item.target}</span>
                                            </p>
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {item.time}
                                            </span>
                                        </div>
                                        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3 hover:bg-white transition-colors cursor-pointer">
                                            <div className="p-2 bg-white rounded border border-gray-100 shadow-sm text-indigo-600">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="text-xs font-medium text-gray-600">Click to view artifact preview</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default RepositoryView;