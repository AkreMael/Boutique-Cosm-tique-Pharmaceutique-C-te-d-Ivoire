import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Send, 
  User, 
  MessageSquare, 
  ShieldCheck, 
  Clock, 
  Phone, 
  Search,
  Compass,
  Link as LinkIcon
} from 'lucide-react';
import { Message, User as AppUser } from '../types';
import { collection, onSnapshot, addDoc, query, where, db, getDocs } from '../lib/firebase';

interface P2PMessagingModuleProps {
  currentUser: AppUser | null;
  onRequireLogin: () => void;
}

export default function P2PMessagingModule({ currentUser, onRequireLogin }: P2PMessagingModuleProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string>('usr-admin-mael'); // Default to Admin Maël (Cocody)
  const [partnerDetails, setPartnerDetails] = useState<{name: string, role: string, phone?: string}>({
    name: "Maël (Admin)",
    role: "admin",
    phone: "07 05 05 26 32"
  });

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [members, setMembers] = useState<{id: string, name: string, role: string, phone?: string}[]>([]);
  const [searchMember, setSearchMember] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load all peer-to-peer / omnichannel messages from `/messages`
  useEffect(() => {
    if (!currentUser) return;

    // Load messages where user is either sender or receiver
    const unsub = onSnapshot(collection(db, "messages"), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      // Filter list representing conversations involving currentUser
      const conversations = list.filter(m => 
        (m.senderId === currentUser.id && m.receiverId === activePartnerId) ||
        (m.senderId === activePartnerId && m.receiverId === currentUser.id)
      );
      conversations.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setMessages(conversations);
    });

    return () => unsub();
  }, [currentUser, activePartnerId]);

  // Load database members/active users for dynamic peer picking
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const list = snap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name || "Client Anonyme",
            role: d.role || "client",
            phone: d.phone
          };
        }).filter(u => currentUser ? u.id !== currentUser.id : true);
        
        setMembers(list);
      } catch (err) {
        console.error("Error reading platform users:", err);
      }
    };
    loadMembers();
  }, [currentUser]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    if (!inputText.trim()) return;
    setIsSending(true);

    try {
      const msgPayload = {
        senderId: currentUser.id,
        senderName: currentUser.name,
        receiverId: activePartnerId,
        content: inputText.trim(),
        timestamp: new Date().toISOString()
      };

      // Push message
      await addDoc(collection(db, "messages"), msgPayload);

      // System notification to peer
      await addDoc(collection(db, "notifications"), {
        userId: activePartnerId,
        title: `Nouveau message de ${currentUser.name}`,
        message: inputText.trim().substring(0, 80) + (inputText.trim().length > 80 ? '...' : ''),
        timestamp: new Date().toISOString(),
        read: false
      });

      setInputText('');
    } catch (err) {
      console.error("Message dispatch crash:", err);
    } finally {
      setIsSending(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchMember.toLowerCase()) ||
    (m.phone && m.phone.includes(searchMember))
  );

  return (
    <div id="p2p-chat-module" className="bg-rose-50/10 min-h-[82vh] max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-4 min-h-[680px]">
        
        {/* Left Sidebar - Channels & Platform Users */}
        <div className="bg-zinc-50 border-r border-zinc-150 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-black text-rose-950 uppercase tracking-wider">Messagerie Omnicanal</h2>
              <p className="text-[10px] text-zinc-400 mt-0.5">Discussions sécurisées entre utilisateurs</p>
            </div>

            {/* Keyword Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                placeholder="Rechercher utilisateur ou conseiller..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-400 transition"
              />
            </div>

            {/* List of active Channels */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              
              {/* Permanent Admin Channel */}
              <button
                onClick={() => {
                  setActivePartnerId('usr-admin-mael');
                  setPartnerDetails({
                    name: "Maël (Admin)",
                    role: "admin",
                    phone: "07 05 05 26 32"
                  });
                }}
                className={`w-full text-left p-3 rounded-2xl border transition flex items-center gap-3 ${
                  activePartnerId === 'usr-admin-mael'
                    ? 'bg-rose-950 text-white border-rose-950 shadow-sm'
                    : 'bg-white hover:bg-zinc-10 border-zinc-200 text-zinc-700'
                }`}
              >
                <div className="h-9 w-9 rounded-full bg-zinc-900 flex items-center justify-center font-bold text-xs shrink-0 text-white">
                  M
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black">Maël (Pharmacie)</span>
                    <ShieldCheck className={`h-3.5 w-3.5 ${activePartnerId === 'usr-admin-mael' ? 'text-rose-350' : 'text-rose-600'}`} />
                  </div>
                  <p className="text-[9px] font-mono opacity-70">Conseiller Dermo-esthétique</p>
                </div>
              </button>

              {/* Dynamic list of peers */}
              {filteredMembers.length > 0 && (
                <div className="pt-2 border-t border-zinc-200">
                  <p className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-400 mb-2">Autres Utilisateurs</p>
                  
                  {filteredMembers.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePartnerId(item.id);
                        setPartnerDetails({
                          name: item.name,
                          role: item.role,
                          phone: item.phone
                        });
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2.5 mb-1.5 border ${
                        activePartnerId === item.id
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                          : 'bg-white hover:bg-zinc-100 border-zinc-150 text-zinc-700'
                      }`}
                    >
                      <span className="h-7 w-7 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center font-bold text-[10px] text-rose-950 shrink-0">
                        {item.name.substring(0, 1).toUpperCase()}
                      </span>
                      <div className="overflow-hidden">
                        <span className="text-[11px] font-bold block truncate">{item.name}</span>
                        <span className="text-[8px] opacity-75 inline-block uppercase bg-zinc-150 px-1 rounded-sm text-zinc-650 mt-0.5">
                          {item.role === 'admin' ? 'Coordinateur' : 'Client'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

            </div>
          </div>

          <div className="p-3 bg-rose-500/10 border border-rose-200/50 rounded-2xl text-[10px] text-rose-950 leading-relaxed font-normal">
            🛡️ Les messages échangés sont chiffrés et transmis en base de données. Respectez la charte d'utilisation de la Côte d'Ivoire.
          </div>
        </div>

        {/* Right Active Dialog Pane */}
        <div className="lg:col-span-3 flex flex-col justify-between h-full bg-white">
          
          {/* Active dialogue header */}
          <div className="p-4 md:p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 text-white bg-rose-950 rounded-full flex items-center justify-center font-bold font-sans">
                {partnerDetails.name.substring(0, 1).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xs font-bold text-rose-950">{partnerDetails.name}</h3>
                <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 mt-0.5 font-mono">
                  <Clock className="h-3 w-3" />
                  <span>En veille d'assistance • {partnerDetails.phone}</span>
                </div>
              </div>
            </div>

            {partnerDetails.role === 'admin' && (
              <span className="bg-rose-50 border border-rose-150 text-rose-900 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 select-none">
                <ShieldCheck className="h-3.5 w-3.5 text-rose-600" />
                <span>Pharmacie Agréée</span>
              </span>
            )}
          </div>

          {/* Messages Sequence Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[460px] bg-rose-50/5">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-2">
                <MessageSquare className="h-10 w-10 text-rose-100 animate-pulse" />
                <p className="text-xs font-black text-rose-900">Début de la conversation sécurisée</p>
                <p className="text-[11px] text-zinc-400 max-w-xs font-light">
                  Posez vos questions concernant les soins visage, corps, suivi de colis ou faites part de vos propositions.
                </p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = currentUser && msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-1 shadow-2xs ${
                      isMe 
                        ? 'bg-rose-950 text-white rounded-tr-none' 
                        : 'bg-zinc-100 text-zinc-800 rounded-tl-none border border-zinc-200/50'
                    }`}>
                      <div className="flex items-center justify-between gap-4 text-[9px] opacity-75 font-mono">
                        <span className="font-extrabold">{msg.senderName}</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="break-words font-normal">{msg.content}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Active bottom send bar */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-100 flex items-center gap-3">
            <input
              type="text"
              required
              placeholder="Écrire votre message confidentiel ici..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-205 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-400 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="p-3 bg-rose-950 hover:bg-rose-900 border border-rose-950 text-white rounded-xl transition shadow active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
