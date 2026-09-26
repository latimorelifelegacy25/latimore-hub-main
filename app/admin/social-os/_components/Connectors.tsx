'use client'


import React from 'react';
import { Connector } from '../types';

const INITIAL_CONNECTORS: Connector[] = [
  // Agency / GFI
  { id: 'gfi', name: 'Global Financial Impact', description: 'GFI Enterprise Portal & Hierarchy Data', icon: 'fa-solid fa-building-shield', category: 'Agency', isConnected: true, lastSync: 'Real-time', color: 'bg-slate-900', brandColor: '#2C3E50' },
  
  // Carriers
  { id: 'nac', name: 'North American', description: 'IUL Underwriting & Builder Plus Sync', icon: 'fa-solid fa-shield-halved', category: 'Carrier', isConnected: true, lastSync: '10 mins ago', color: 'bg-blue-900', brandColor: '#004c8c' },
  { id: 'fg', name: 'F&G Annuities', description: 'Fixed Indexed Annuities & Income Advantage', icon: 'fa-solid fa-vault', category: 'Carrier', isConnected: false, color: 'bg-[#c5a059]', brandColor: '#c5a059' },
  { id: 'ethos', name: 'Ethos Velocity', description: 'Instant Decision Term Underwriting', icon: 'fa-solid fa-bolt-lightning', category: 'Carrier', isConnected: true, lastSync: 'Active', color: 'bg-emerald-600', brandColor: '#10b981' },
  { id: 'aig', name: 'American General', description: 'Broad Market Protection Products', icon: 'fa-solid fa-landmark', category: 'Carrier', isConnected: false, color: 'bg-indigo-700', brandColor: '#303f9f' },
  { id: 'aec', name: 'American Equity', description: 'Asset Preservation & FIA Portfolio', icon: 'fa-solid fa-coins', category: 'Carrier', isConnected: false, color: 'bg-amber-600', brandColor: '#d97706' },

  // Social
  { id: 'li', name: 'LinkedIn', description: 'B2B Strategy & Central PA Outreach', icon: 'fa-brands fa-linkedin', category: 'Social', isConnected: false, color: 'bg-blue-800' },
  { id: 'facebook', name: 'Facebook Business', description: 'Community Legacy Storytelling', icon: 'fa-brands fa-facebook', category: 'Social', isConnected: false, color: 'bg-blue-600' },
  { id: 'instagram', name: 'Instagram', description: 'Visual Legacy Narrative', icon: 'fa-brands fa-instagram', category: 'Social', isConnected: false, color: 'bg-pink-600' },
  { id: 'twitter', name: 'X / Twitter', description: 'Real-time Industry Insights', icon: 'fa-brands fa-x-twitter', category: 'Social', isConnected: false, color: 'bg-black' },
];

const SOCIAL_PROVIDER_MAP: Record<string, 'facebook' | 'instagram' | 'linkedin' | 'twitter'> = {
  li: 'linkedin',
  facebook: 'facebook',
  instagram: 'instagram',
  twitter: 'twitter',
};

const Connectors: React.FC = () => {
  const [connectors, setConnectors] = React.useState<Connector[]>(INITIAL_CONNECTORS);
  const [syncingId, setSyncingId] = React.useState<string | null>(null);
  const [vaultModal, setVaultModal] = React.useState<Connector | null>(null);
  const [agentIdInput, setAgentIdInput] = React.useState('');
  const [tokenInput, setTokenInput] = React.useState('');
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const fetchAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      if (response.ok) {
        const status = await response.json();
        setConnectors(prev => prev.map(c => {
          const provider = SOCIAL_PROVIDER_MAP[c.id];
          if (!provider) return c;
          return { ...c, isConnected: Boolean(status[provider]), lastSync: status[provider] ? c.lastSync ?? 'Connected' : undefined };
        }));
      }
    } catch (err) {
      console.error('Failed to fetch auth status', err);
    }
  };

  React.useEffect(() => {
    fetchAuthStatus();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchAuthStatus();
      }
    };
    const handleFocus = () => fetchAuthStatus();
    window.addEventListener('message', handleMessage);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleConnect = async (connector: Connector) => {
    if (connector.category === 'Social') {
      if (connector.id === 'facebook' || connector.id === 'instagram') {
        window.open('/api/social/facebook/connect', 'oauth_popup', 'width=600,height=700');
        return;
      }
      // No first-party OAuth app registered for LinkedIn/Twitter — collect a
      // provider-issued token and store it directly via the admin API.
      setSaveError(null);
      setTokenInput('');
      setVaultModal(connector);
      return;
    }
    setAgentIdInput(connector.agentId || '');
    setVaultModal(connector);
  };

  const saveVaultCredentials = async () => {
    if (!vaultModal) return;

    if (vaultModal.category === 'Social') {
      const provider = SOCIAL_PROVIDER_MAP[vaultModal.id];
      if (!provider || !tokenInput.trim()) {
        setSaveError('Access token is required.');
        return;
      }
      setSaving(true);
      setSaveError(null);
      try {
        const response = await fetch('/api/admin/social-connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            accountName: vaultModal.name,
            accessToken: tokenInput.trim(),
            status: 'connected',
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to save connection');
        }
        setConnectors(prev => prev.map(c =>
          c.id === vaultModal.id ? { ...c, isConnected: true, lastSync: 'Just now' } : c
        ));
        setVaultModal(null);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save connection');
      } finally {
        setSaving(false);
      }
      return;
    }

    // Carrier / agency connectors have no live API yet — store the agent ID locally.
    setConnectors(prev => prev.map(c =>
      c.id === vaultModal.id ? { ...c, isConnected: true, lastSync: 'Just now', agentId: agentIdInput } : c
    ));
    setVaultModal(null);
  };

  const toggleConnection = (id: string) => {
    const connector = connectors.find(c => c.id === id);
    if (connector?.category === 'Social') {
      const provider = SOCIAL_PROVIDER_MAP[id];
      if (provider) {
        fetch('/api/admin/social-connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, status: 'disconnected' }),
        }).catch(err => console.error('Failed to disconnect', err));
      }
    }
    setConnectors(prev => prev.map(c => {
      if (c.id === id) {
        if (c.isConnected) return { ...c, isConnected: false, lastSync: undefined, agentId: undefined };
        return c; // If connecting, we open vault modal instead
      }
      return c;
    }));
  };

  const runSync = (id: string) => {
    setSyncingId(id);
    if (connectors.find(c => c.id === id)?.category === 'Social') {
      fetchAuthStatus().finally(() => {
        setSyncingId(null);
        setConnectors(prev => prev.map(c => c.id === id ? { ...c, lastSync: 'Just now' } : c));
      });
      return;
    }
    setTimeout(() => {
      setSyncingId(null);
      setConnectors(prev => prev.map(c => c.id === id ? { ...c, lastSync: 'Just now' } : c));
    }, 2000);
  };

  const categories = ['Agency', 'Carrier', 'Social'];

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fadeIn pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Enterprise Integrations</h1>
          <p className="text-slate-500 font-medium tracking-wide mt-2">Connecting Latimore Life & Legacy to GFI and elite insurance carriers.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-sm">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
              Carrier Grid Synchronized
           </div>
        </div>
      </header>

      {categories.map(cat => (
        <section key={cat} className="space-y-6">
           <div className="flex items-center gap-4">
              <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">{cat} Protocols</h2>
              <div className="h-[1px] flex-1 bg-slate-100"></div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connectors.filter(c => c.category === cat).map((connector) => (
                <div key={connector.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col">
                   <div className="p-8 flex-1 space-y-6">
                      <div className="flex justify-between items-start">
                         <div 
                           className={`w-16 h-16 rounded-[1.5rem] ${connector.color} flex items-center justify-center text-white text-3xl shadow-2xl shadow-slate-200 transition-transform group-hover:scale-110 duration-500`}
                           style={connector.brandColor ? { backgroundColor: connector.brandColor } : {}}
                         >
                            <i className={connector.icon}></i>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                              connector.isConnected 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-slate-50 text-slate-400 border-slate-100'
                            }`}>
                               {connector.isConnected ? 'Active' : 'Disconnected'}
                            </span>
                            {connector.lastSync && (
                              <span className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">
                                <i className="fa-solid fa-clock-rotate-left mr-1"></i> {connector.lastSync}
                              </span>
                            )}
                         </div>
                      </div>

                      <div className="space-y-2">
                         <h3 className="text-xl font-black text-slate-900 tracking-tight">{connector.name}</h3>
                         <p className="text-sm text-slate-500 font-medium leading-relaxed">{connector.description}</p>
                      </div>

                      {connector.agentId && (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent ID</span>
                           <span className="text-xs font-black text-slate-700">{connector.agentId}</span>
                        </div>
                      )}
                   </div>

                   <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                       {connector.isConnected ? (
                        <>
                          <button 
                            onClick={() => toggleConnection(connector.id)}
                            className="flex-1 py-3.5 rounded-xl bg-white text-rose-500 border border-rose-100 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                          >
                            Disconnect Protocol
                          </button>
                          <button 
                            onClick={() => runSync(connector.id)}
                            disabled={syncingId === connector.id}
                            className="w-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#c5a059] transition-all shadow-sm"
                          >
                            <i className={`fa-solid fa-rotate ${syncingId === connector.id ? 'fa-spin text-[#c5a059]' : ''}`}></i>
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleConnect(connector)}
                          className="w-full py-4 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#c5a059] shadow-xl shadow-slate-900/10 transition-all font-bold"
                        >
                          Establish Protocol
                        </button>
                      )}
                   </div>
                </div>
              ))}
              
              {cat === 'Carrier' && (
                <div className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center gap-4 bg-slate-50/20 group hover:border-[#c5a059] transition-all cursor-pointer">
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-200 group-hover:text-[#c5a059] transition-colors shadow-inner">
                      <i className="fa-solid fa-plus text-2xl"></i>
                   </div>
                   <div>
                      <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Add Carrier</p>
                      <p className="text-[11px] text-slate-400 mt-1 font-medium">Request custom API hook for additional life or annuity providers.</p>
                   </div>
                </div>
              )}
           </div>
        </section>
      ))}

      {/* Authorization Vault Modal */}
      {vaultModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3.5rem] p-12 max-w-md w-full shadow-2xl animate-slideUp border border-slate-100 text-center">
              <div 
                className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl text-white text-4xl ${vaultModal.color}`}
                style={vaultModal.brandColor ? { backgroundColor: vaultModal.brandColor } : {}}
              >
                 <i className={vaultModal.icon}></i>
              </div>
              
              <h2 className="text-2xl font-black text-slate-900 mb-2">Authorize {vaultModal.name}</h2>
              <p className="text-slate-500 text-sm mb-10 font-medium leading-relaxed">
                 {vaultModal.category === 'Social'
                   ? `Paste a valid ${vaultModal.name} access token to enable live publishing from the Latimore Legacy Hub.`
                   : `Enter your Agent Credentials to synchronize your ${vaultModal.name} contract data with the Latimore Legacy Hub.`}
              </p>

              {vaultModal.category === 'Social' ? (
                <div className="space-y-6 text-left">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Access Token</label>
                      <textarea
                        rows={3}
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        placeholder="Paste provider access token here"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#c5a059] outline-none font-bold text-slate-800 text-sm"
                      />
                   </div>
                   {saveError && (
                     <p className="text-rose-500 text-xs font-bold">{saveError}</p>
                   )}
                </div>
              ) : (
                <div className="space-y-6 text-left">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Agent / Producer ID</label>
                      <input
                        type="text"
                        value={agentIdInput}
                        onChange={(e) => setAgentIdInput(e.target.value)}
                        placeholder="e.g. 1029485"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#c5a059] outline-none font-bold text-slate-800"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Enterprise Access Key (NIPR)</label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#c5a059] outline-none font-bold text-slate-800"
                      />
                   </div>
                </div>
              )}

              {vaultModal.category === 'Social' && (
                <p className="text-[11px] text-slate-400 mt-6 text-left">
                  {vaultModal.id === 'facebook' || vaultModal.id === 'instagram'
                    ? 'Prefer OAuth? Close this and use "Establish Protocol" again to open the Facebook popup instead.'
                    : `${vaultModal.name} has no first-party OAuth app registered yet — generate a token from ${vaultModal.name}'s developer console and paste it above.`}
                </p>
              )}

              <div className="flex flex-col gap-3 mt-10">
                 <button
                   onClick={saveVaultCredentials}
                   disabled={saving}
                   className="w-full py-5 rounded-[1.5rem] font-black bg-slate-900 text-white hover:bg-[#c5a059] transition-all text-xs uppercase tracking-widest shadow-2xl shadow-slate-900/20 disabled:opacity-50"
                 >
                    {saving ? 'Saving…' : 'Establish Secure Link'}
                 </button>
                 <button
                   onClick={() => setVaultModal(null)}
                   className="w-full py-4 font-black text-[10px] text-slate-400 uppercase hover:text-rose-500 transition-colors"
                 >
                    Cancel Protocol
                 </button>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-center gap-3">
                 <i className="fa-solid fa-lock text-slate-300 text-xs"></i>
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Enterprise-Grade Encryption Active</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Connectors;
