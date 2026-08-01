import { useState, useEffect, FormEvent } from "react";
import { UserPlus, Search, ShieldCheck, ShieldAlert, Trash2, Cpu, Users, Network } from "lucide-react";
import { motion } from "motion/react";

type Contact = {
  id: number;
  telegram_id: string;
  name: string;
  nickname: string;
  relationship: string;
  whitelisted: boolean;
  created_at: number;
};

type TelegramDialog = {
  id: string;
  name: string;
  username: string;
  phone: string;
};

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [dialogs, setDialogs] = useState<TelegramDialog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [activeTab, setActiveTab] = useState<'db' | 'telegram'>('db');

  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    telegram_id: "",
    name: "",
    nickname: "",
    relationship: "",
    whitelisted: true
  });

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      const data = await res.json();
      setContacts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDialogs = async () => {
    try {
      const res = await fetch('/api/telegram/dialogs');
      if (res.ok) {
        const data = await res.json();
        setDialogs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    Promise.all([fetchContacts(), fetchDialogs()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      setShowAdd(false);
      setFormData({ telegram_id: "", name: "", nickname: "", relationship: "", whitelisted: true });
      fetchContacts();
    } catch (e) {
      console.error(e);
    }
  };

  const quickAdd = async (dialog: TelegramDialog) => {
    try {
      await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            telegram_id: dialog.id,
            name: dialog.name,
            nickname: "",
            relationship: "Friend",
            whitelisted: true
        })
      });
      fetchContacts();
      setActiveTab('db');
    } catch (e) {
      console.error(e);
    }
  };

  const toggleWhitelist = async (contact: Contact) => {
    try {
      await fetch(`/api/contacts/${contact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contact, whitelisted: !contact.whitelisted })
      });
      fetchContacts();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteContact = async (id: number) => {
    if (!confirm('Purge entity from matrix?')) return;
    try {
      await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      fetchContacts();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.telegram_id.includes(search)
  );

  const filteredDialogs = dialogs.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    (d.username && d.username.toLowerCase().includes(search.toLowerCase())) ||
    (d.phone && d.phone.includes(search))
  );

  return (
    <div className="space-y-8 font-mono">
      <div className="border-b border-cyan-500/20 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-widest uppercase holo-text flex items-center gap-3">
            <Cpu className="w-8 h-8" />
            Contact Subsystem
          </h2>
          <p className="text-cyan-500/70 mt-2 uppercase text-sm tracking-wider">E.V. Whitelist and Recognition Matrices</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-950/50 text-cyan-300 border border-cyan-500/40 rounded hover:bg-cyan-900/60 transition-all uppercase tracking-wider text-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        >
          <UserPlus className="w-4 h-4" />
          Register Entity
        </button>
      </div>

      {showAdd && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
          <h3 className="text-lg font-semibold mb-4 text-cyan-300 uppercase tracking-widest border-b border-cyan-500/20 pb-2">New Entity Registration</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-cyan-500 mb-1">Target Identifier</label>
                <input required type="text" value={formData.telegram_id} onChange={e => setFormData({...formData, telegram_id: e.target.value})} className="w-full px-3 py-2 bg-cyan-950/30 border border-cyan-500/30 rounded text-cyan-100 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] placeholder-cyan-800" placeholder="e.g. @username, +12345678, or ID" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-cyan-500 mb-1">Entity Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-cyan-950/30 border border-cyan-500/30 rounded text-cyan-100 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] placeholder-cyan-800" placeholder="e.g. Prachi" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-cyan-500 mb-1">Known Alias (Optional)</label>
                <input type="text" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} className="w-full px-3 py-2 bg-cyan-950/30 border border-cyan-500/30 rounded text-cyan-100 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] placeholder-cyan-800" placeholder="e.g. Chinki" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-cyan-500 mb-1">Relationship Vector</label>
                <input type="text" value={formData.relationship} onChange={e => setFormData({...formData, relationship: e.target.value})} className="w-full px-3 py-2 bg-cyan-950/30 border border-cyan-500/30 rounded text-cyan-100 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] placeholder-cyan-800" placeholder="e.g. Friend, Colleague" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-6 p-3 bg-cyan-950/40 rounded border border-cyan-500/20">
              <input type="checkbox" id="whitelist" checked={formData.whitelisted} onChange={e => setFormData({...formData, whitelisted: e.target.checked})} className="w-4 h-4 text-cyan-500 border-cyan-500/30 rounded bg-cyan-900/50 focus:ring-cyan-500" />
              <label htmlFor="whitelist" className="text-sm text-cyan-300 uppercase tracking-widest">Enable E.V. Interaction (Whitelist)</label>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-cyan-500/20">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-medium text-cyan-500 hover:text-cyan-300 uppercase tracking-wider">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-cyan-950 bg-cyan-400 hover:bg-cyan-300 rounded hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] uppercase tracking-wider transition-all">Save Entity</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="flex gap-2">
        <button 
          onClick={() => setActiveTab('db')}
          className={`flex-1 py-3 text-sm uppercase tracking-widest font-bold transition-all border-b-2 ${activeTab === 'db' ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30' : 'border-transparent text-cyan-700 hover:text-cyan-500 hover:bg-cyan-950/10'}`}
        >
          <div className="flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4" /> Whitelisted Entities</div>
        </button>
        <button 
          onClick={() => setActiveTab('telegram')}
          className={`flex-1 py-3 text-sm uppercase tracking-widest font-bold transition-all border-b-2 ${activeTab === 'telegram' ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30' : 'border-transparent text-cyan-700 hover:text-cyan-500 hover:bg-cyan-950/10'}`}
        >
          <div className="flex items-center justify-center gap-2"><Network className="w-4 h-4" /> Telegram Dialogs</div>
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-cyan-500/20 bg-cyan-950/40 flex items-center gap-3">
          <Search className="w-5 h-5 text-cyan-500" />
          <input
            type="text"
            placeholder="Search entities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-cyan-100 placeholder-cyan-800 outline-none"
          />
        </div>
        
        <div className="divide-y divide-cyan-500/10">
          {loading ? (
            <div className="p-8 text-center text-cyan-500/50 animate-pulse uppercase tracking-widest text-sm">Scanning databases...</div>
          ) : activeTab === 'db' ? (
             filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-cyan-500/50 uppercase tracking-widest text-sm">No entities found.</div>
              ) : (
                filteredContacts.map(contact => (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={contact.id} 
                    className="p-4 flex items-center justify-between hover:bg-cyan-900/20 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold tracking-wider text-cyan-100 uppercase">
                          {contact.name} {contact.nickname && <span className="text-cyan-500/70 text-xs ml-2 font-normal">[{contact.nickname}]</span>}
                        </h4>
                        <p className="text-xs text-cyan-500/70 uppercase tracking-widest mt-1">
                          ID:{contact.telegram_id} <span className="mx-2">|</span> {contact.relationship}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleWhitelist(contact)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                          contact.whitelisted 
                            ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                            : 'bg-neutral-900/40 text-neutral-500 border border-neutral-700/50 hover:bg-cyan-950 hover:text-cyan-600'
                        }`}
                      >
                        {contact.whitelisted ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                        {contact.whitelisted ? 'Whitelisted' : 'Ignored'}
                      </button>
                      <button
                        onClick={() => deleteContact(contact.id)}
                        className="p-1.5 text-cyan-700 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
             )
          ) : (
              filteredDialogs.length === 0 ? (
                <div className="p-8 text-center text-cyan-500/50 uppercase tracking-widest text-sm">No telegram dialogs found. Ensure you are connected.</div>
              ) : (
                filteredDialogs.map(dialog => (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={dialog.id} 
                    className="p-4 flex items-center justify-between hover:bg-cyan-900/20 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold tracking-wider text-cyan-100 uppercase">
                          {dialog.name}
                        </h4>
                        <p className="text-xs text-cyan-500/70 uppercase tracking-widest mt-1">
                          ID: {dialog.id} {dialog.username ? `| @${dialog.username}` : ''} {dialog.phone ? `| +${dialog.phone}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {contacts.some(c => c.telegram_id === dialog.id) ? (
                        <span className="text-xs font-bold uppercase tracking-widest text-cyan-500 border border-cyan-500/30 px-3 py-1.5 rounded bg-cyan-950/40">Registered</span>
                      ) : (
                        <button
                          onClick={() => quickAdd(dialog)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-all bg-cyan-900/40 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:bg-cyan-800/60"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Whitelist
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )
          )}
        </div>
      </div>
    </div>
  );
}
