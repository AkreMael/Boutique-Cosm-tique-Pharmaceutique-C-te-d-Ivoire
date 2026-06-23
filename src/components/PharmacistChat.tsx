import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, MessageSquare, ShoppingBag, Plus, BookOpen, User, CheckCheck, Compass, Info } from 'lucide-react';
import { ChatMessage, ChatSession, Product, User as AppUser, BeautyProfile } from '../types';

interface PharmacistChatProps {
  currentUser: AppUser;
  products: Product[];
  currentProfile?: BeautyProfile;
  chats: ChatSession[];
  messages: ChatMessage[];
  onSendMessage: (chatId: string, message: string) => Promise<void>;
  onSelectChatSession?: (chatId: string) => void;
  onSendPharmacistPrescription?: (chatId: string, productId: string) => void;
  onAddToCart?: (product: Product) => void;
  defaultSelectedChatId?: string;
  onSelectProductDetails?: (product: Product) => void;
}

export default function PharmacistChat({
  currentUser,
  products,
  currentProfile,
  chats,
  messages,
  onSendMessage,
  onSelectChatSession,
  onSendPharmacistPrescription,
  onAddToCart,
  defaultSelectedChatId,
  onSelectProductDetails
}: PharmacistChatProps) {
  const [inputText, setInputText] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string>(defaultSelectedChatId || currentUser.id);
  const [sending, setSending] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Sync state if defaultSelectedChatId prop changes
  useEffect(() => {
    if (defaultSelectedChatId) {
      setSelectedChatId(defaultSelectedChatId);
    }
  }, [defaultSelectedChatId]);

  // If role is client, chat is bound to currentUser.id. If admin, it selects the active session of the list
  useEffect(() => {
    if (currentUser.role === 'client') {
      setSelectedChatId(currentUser.id);
    } else if (currentUser.role === 'admin' && chats.length > 0 && selectedChatId === currentUser.id) {
      setSelectedChatId(chats[0].id);
    }
  }, [currentUser, chats]);

  // Scroll to bottom of chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChatId]);

  const activeMessages = messages.filter((m) => m.chatId === selectedChatId);
  const activeSessionDetails = chats.find((c) => c.id === selectedChatId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !receiptImage) return;

    setSending(true);
    const msgToSend = inputText + (receiptImage ? " [Photo de peau incluse]" : "");
    setInputText('');
    setReceiptImage(null);

    try {
      await onSendMessage(selectedChatId, msgToSend);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleRecommendProduct = (productId: string) => {
    if (onSendPharmacistPrescription) {
      onSendPharmacistPrescription(selectedChatId, productId);
    }
  };

  const simulateAttachImage = () => {
    const urls = [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=150&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=150&auto=format&fit=crop"
    ];
    const picked = urls[Math.floor(Math.random() * urls.length)];
    setReceiptImage(picked);
  };

  return (
    <div id="beauty-advising-board" className="py-8 bg-zinc-50 min-h-[calc(100vh-80px)] flex flex-col justify-between">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Chat list panel (Only visible for Admin role) */}
        {currentUser.role === 'admin' && (
          <div className="md:col-span-4 bg-white rounded-3xl border border-rose-100 p-5 shadow-sm space-y-4 flex flex-col h-[580px]">
            <div className="flex items-center space-x-2.5 border-b border-rose-50 pb-3">
              <MessageSquare className="h-5 w-5 text-rose-500 animate-pulse" />
              <div>
                <h3 className="font-bold text-rose-950 text-sm">Discussions Clients</h3>
                <p className="text-[10px] text-zinc-400 font-mono">Boîte de réception Abidjan</p>
              </div>
            </div>

            {/* Sessions Scroll List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {chats.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    setSelectedChatId(session.id);
                    if (onSelectChatSession) {
                      onSelectChatSession(session.id);
                    }
                  }}
                  className={`w-full p-3.5 rounded-2xl text-left border transition ${
                    selectedChatId === session.id
                      ? 'bg-rose-50/50 border-rose-250 text-rose-950 font-semibold shadow-xs'
                      : 'border-zinc-150 hover:bg-zinc-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold truncate pr-2">{session.clientName}</p>
                    <span className="text-[9px] text-zinc-400 font-mono">
                      {new Date(session.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 truncate leading-tight">
                    {session.lastMessage}
                  </p>
                  <div className="flex justify-between items-center mt-2 border-t border-dotted border-zinc-150 pt-1.5 text-[9px] text-zinc-400 font-mono">
                    <span>Tél: {session.clientPhone}</span>
                    {session.unreadCount && session.unreadCount > 0 ? (
                      <span className="px-1.5 py-0.5 bg-rose-500 text-white font-bold rounded-full text-[8px] animate-pulse">
                        Nouveau
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}

              {chats.length === 0 && (
                <div className="text-center py-12 text-zinc-400">
                  <span className="text-2xl">📥</span>
                  <p className="text-xs mt-2">Aucune demande active</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Core active discussion window (8 cols or 12 depending on layout) */}
        <div className={`flex flex-col h-[580px] bg-white rounded-3xl border border-rose-100 p-6 shadow-sm shadow-zinc-100 ${
          currentUser.role === 'admin' ? 'md:col-span-8' : 'md:col-span-8'
        }`}>
          
          {/* Header Advisor Info */}
          <div className="flex items-center justify-between pb-4 border-b border-rose-50">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 font-bold border border-rose-100/70 overflow-hidden shadow-xs">
                <Sparkles className="h-4.5 w-4.5 text-rose-500 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-950 leading-tight">
                  {currentUser.role === 'client' ? 'Votre Conseillère Beauté (Omi\'i Institut)' : `Discussion avec ${activeSessionDetails?.clientName || 'Client'}`}
                </h4>
                <p className="text-[10px] text-rose-600 flex items-center gap-1 mt-0.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse"></span>
                  <span>Conseils Beauté & Soins • En ligne</span>
                </p>
              </div>
            </div>
          </div>

          {/* Active Messages Area */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            
            {/* System Welcome Message */}
            <div className="p-4 bg-rose-50/20 border border-rose-100 rounded-3xl text-[11px] text-zinc-650 leading-relaxed space-y-1">
              <p className="font-bold text-rose-900 flex items-center gap-1.5 text-xs">
                <Sparkles className="h-4 w-4 text-rose-500" />
                <span>Conseil & Coaching Beauté Personnalisé</span>
              </p>
              <p>
                Bonjour et bienvenue dans l'espace conseil d'Omi'i Institut. Le climat de Côte d'Ivoire (milieu humide d'Abidjan ou sécheresse de l'Harmattan) nécessite de préserver l'éclat de votre peau avec des soins adaptés. Décrivez vos besoins à notre conseillère beauté pour obtenir des recommandations parfaites.
              </p>
            </div>

            {activeMessages.map((msg) => {
              const isMe = msg.sender === (currentUser.role === 'client' ? 'client' : 'admin');
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-3xl p-4 text-xs leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-rose-950 text-white rounded-br-none'
                      : 'bg-zinc-100 text-zinc-800 rounded-bl-none'
                  }`}>
                    <p className="font-bold font-mono text-[9px] text-rose-450 capitalize mb-1">{msg.senderName}</p>
                    <p className="whitespace-pre-line text-xs font-normal leading-relaxed">{msg.message}</p>
                    
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="Skin attachment" className="h-32 w-full object-cover rounded-xl mt-3" />
                    )}

                    {/* Prescribed products suggestions inserted in chat */}
                    {msg.suggestedProductIds && msg.suggestedProductIds.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-zinc-200/40 space-y-2">
                        <p className="text-[10px] uppercase tracking-wide font-extrabold text-rose-400">Suggestions d'Articles de Soins :</p>
                        
                        {msg.suggestedProductIds.map((pId) => {
                          const pObj = products.find((p) => p.id === pId);
                          if (!pObj) return null;
                          return (
                            <div 
                              key={pId} 
                              onClick={() => onSelectProductDetails && onSelectProductDetails(pObj)}
                              className="p-3 bg-white text-zinc-800 rounded-2xl flex flex-col sm:flex-row gap-3 border border-zinc-150 shadow-sm transition hover:border-rose-300 hover:shadow-md cursor-pointer group text-left"
                            >
                              <img 
                                src={pObj.images?.[0] || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=150&auto=format&fit=crop'} 
                                alt={pObj.name} 
                                className="h-20 w-20 object-cover rounded-xl shrink-0 border border-zinc-100 group-hover:scale-102 transition-transform self-center" 
                              />
                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-bold text-xs text-rose-950 group-hover:text-rose-700 transition-colors line-clamp-1">{pObj.name}</h4>
                                  <p className="text-[9px] text-zinc-400 font-medium">{pObj.brand} • {pObj.category}</p>
                                  {pObj.description && (
                                    <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{pObj.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-2 gap-2">
                                  <p className="text-xs font-black text-rose-800">
                                    {pObj.promoPrice ? (
                                      <span className="flex items-center gap-1.5">
                                        <span>{pObj.promoPrice} CFA</span>
                                        <span className="text-[9px] text-zinc-400 line-through font-normal">{pObj.price} CFA</span>
                                      </span>
                                    ) : (
                                      <span>{pObj.price} CFA</span>
                                    )}
                                  </p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // prevent opening details modal
                                      if (onAddToCart) onAddToCart(pObj);
                                    }}
                                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] rounded-lg flex items-center space-x-1 cursor-pointer shrink-0 transition shadow-xs"
                                  >
                                    <ShoppingBag className="h-3 w-3" />
                                    <span>Ajouter</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-zinc-400 font-mono mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            <div ref={bottomRef}></div>
          </div>

          {/* Form write input */}
          <form onSubmit={handleSend} className="pt-4 border-t border-rose-50 flex items-center space-x-3">
            {/* Attachment Sim Button */}
            <button
              type="button"
              onClick={simulateAttachImage}
              className={`p-2.5 border rounded-xl hover:bg-zinc-50 transition cursor-pointer relative ${
                receiptImage ? 'border-rose-450 bg-rose-50 text-rose-700' : 'border-zinc-200 text-zinc-400'
              }`}
              title="Ajouter une image de votre peau"
            >
              <Compass className="h-4.5 w-4.5" />
              {receiptImage && <span className="absolute -top-1 -right-1 bg-rose-500 rounded-full w-2.5 h-2.5"></span>}
            </button>
            
            <input
              type="text"
              placeholder={receiptImage ? "Ajouter un commentaire..." : "Posez votre question cosmétique ou routine..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-300 focus:bg-white transition"
              disabled={sending}
            />

            <button
              type="submit"
              disabled={sending || (!inputText.trim() && !receiptImage)}
              className="p-3 bg-rose-950 hover:bg-rose-900 border border-rose-950 text-white rounded-xl disabled:opacity-50 transition-transform cursor-pointer shadow active:scale-95 shrink-0"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>

        </div>

        {/* CLIENT INFO ON SIDEBAR OR QUICK PRESETS (Only shown in Chat Tab) */}
        <div className="md:col-span-4 bg-white rounded-3xl border border-rose-100 p-6 shadow-sm space-y-6 max-h-[580px] overflow-y-auto">
          {currentUser.role === 'admin' ? (
            // ADMIN ADVICE DRAWER: list of product recommend triggers
            <div className="space-y-4">
              <div className="border-b border-rose-50 pb-2">
                <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-zinc-400 mb-1 block">Conseiller des Articles :</span>
                <p className="text-[11px] text-zinc-500">Insérez d'un clic un produit du stock d'Abidjan pour conseiller le client.</p>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {products.map((prod) => (
                  <div key={prod.id} className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl flex items-center justify-between gap-2.5">
                    <img src={prod.images[0]} alt={prod.name} className="h-9 w-9 object-cover rounded-xl shrink-0 border border-zinc-200" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-rose-950 truncate">{prod.name}</p>
                      <p className="text-[9px] text-zinc-400 mt-0.5">{prod.promoPrice ? prod.promoPrice : prod.price} CFA • Stock: {prod.stock}</p>
                    </div>
                    <button
                      onClick={() => handleRecommendProduct(prod.id)}
                      className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl transition cursor-pointer"
                      title="Suggérer au client"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // CLIENT ADVICE DRAWER: shows beauty questionnaire result synopsis
            <div className="space-y-4">
              <div className="border-b border-rose-50 pb-2">
                <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-zinc-400 mb-1 block">Votre Profil Beauté :</span>
                <h4 className="font-extrabold text-rose-950 text-sm">Fiche Diagnostic</h4>
              </div>

              {currentProfile ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-zinc-50 border border-zinc-150 rounded-lg">
                      <p className="text-zinc-400">Âge / Genre</p>
                      <p className="font-bold text-rose-950 mt-0.5">{currentProfile.age} ans • {currentProfile.gender}</p>
                    </div>
                    <div className="p-2 bg-zinc-50 border border-zinc-150 rounded-lg">
                      <p className="text-zinc-400">Type de peau</p>
                      <p className="font-bold text-rose-950 mt-0.5">{currentProfile.skinType}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/20 border border-rose-100 rounded-xl">
                    <p className="text-[10px] uppercase font-mono tracking-wider font-bold text-rose-900">Préoccupations :</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {currentProfile.concerns.map((con) => (
                        <span key={con} className="px-2 py-0.5 bg-white border border-rose-100 text-[10px] text-rose-950 font-bold rounded-md shadow-xs">
                          {con}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-400 text-center leading-normal">
                    Ces informations sont utilisées confidentiellement par notre assistante conseil pour ajuster intelligemment vos diagnostics personnalisés.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 bg-zinc-50 border border-dashed rounded-3xl p-4">
                  <span className="text-2xl">⚡</span>
                  <p className="text-xs font-bold text-rose-950 mt-2">Aucun profil enregistré</p>
                  <p className="text-[10px] text-zinc-400 mt-1">Complétez notre Questionnaire Beauté pour formuler des conseils automatiques ciblés.</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
