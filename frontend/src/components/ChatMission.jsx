import React, { useEffect, useState, useRef } from 'react';

export default function ChatMission({ reservation, currentUserId }) {
    const [messages, setMessages] = useState([]);
    const [contenu, setContenu] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);
    const token = localStorage.getItem('token');

    const fetchMessages = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/messages/${reservation.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            if (data.success) setMessages(data.data || []);
        } catch (err) {
            console.error('Erreur chargement messages:', err);
        } finally {
            setLoading(false);
        }
    };

    // Polling toutes les 5 secondes
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [reservation.id]);

    // Scroll vers le bas automatiquement
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const envoyerMessage = async () => {
        if (!contenu.trim() || sending) return;
        setSending(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ reservationId: reservation.id, contenu })
            });
            const data = await res.json();
            if (data.success) {
                setMessages(prev => [...prev, data.data]);
                setContenu('');
            }
        } catch (err) {
            console.error('Erreur envoi message:', err);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            envoyerMessage();
        }
    };

    const formatHeure = (date) => {
        return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    // Grouper par date
    const messagesGroupes = messages.reduce((groups, msg) => {
        const date = formatDate(msg.createdAt);
        if (!groups[date]) groups[date] = [];
        groups[date].push(msg);
        return groups;
    }, {});

    return (
        <div className="flex flex-col h-96 bg-black/40 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">

            {/* Header */}
            <div className="px-4 py-3 bg-indigo-900/50 border-b border-white/10 flex items-center gap-2">
                <span className="text-lg">💬</span>
                <div>
                    <p className="text-white font-semibold text-sm">
                        Discussion — Mission #{reservation.id}
                    </p>
                    <p className="text-white/40 text-xs">
                        {reservation.service?.nom || 'Service'} · Mise à jour auto toutes les 5s
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center text-white/40 text-sm animate-pulse">Chargement...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-3xl mb-2">💬</p>
                        <p className="text-white/40 text-sm">Aucun message pour l'instant.</p>
                        <p className="text-white/30 text-xs mt-1">Commencez la discussion !</p>
                    </div>
                ) : (
                    Object.entries(messagesGroupes).map(([date, msgs]) => (
                        <div key={date}>
                            {/* Séparateur de date */}
                            <div className="flex items-center gap-3 my-3">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-white/30 text-xs">{date}</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>

                            {msgs.map(msg => {
                                const isMoi = msg.senderId === currentUserId;
                                return (
                                    <div key={msg.id} className={`flex ${isMoi ? 'justify-end' : 'justify-start'} mb-2`}>
                                        <div className={`max-w-xs lg:max-w-md ${isMoi ? 'items-end' : 'items-start'} flex flex-col`}>
                                            {!isMoi && (
                                                <span className="text-white/40 text-xs mb-1 ml-1">
                                                    {msg.expediteur?.nom || 'Utilisateur'}
                                                </span>
                                            )}
                                            <div className={`px-4 py-2 rounded-2xl text-sm ${isMoi
                                                    ? 'bg-indigo-600 text-white rounded-br-sm'
                                                    : 'bg-white/10 text-white rounded-bl-sm'
                                                }`}>
                                                {msg.contenu}
                                            </div>
                                            <span className="text-white/30 text-xs mt-1 mx-1">
                                                {formatHeure(msg.createdAt)}
                                                {isMoi && <span className="ml-1">{msg.lu ? '✓✓' : '✓'}</span>}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10 flex gap-2">
                <textarea
                    value={contenu}
                    onChange={e => setContenu(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Écrire un message... (Entrée pour envoyer)"
                    rows={1}
                    className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2 text-sm outline-none border border-white/10 focus:border-indigo-500 resize-none"
                />
                <button
                    onClick={envoyerMessage}
                    disabled={!contenu.trim() || sending}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${contenu.trim() && !sending
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                        }`}>
                    {sending ? '...' : '➤'}
                </button>
            </div>
        </div>
    );
}