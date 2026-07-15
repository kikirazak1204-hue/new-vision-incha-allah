import React, { useEffect, useState } from 'react';
import { X, Calendar } from 'lucide-react'; // Installe lucide-react si tu ne l'as pas

const MovieBoxNotification = ({ notification, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (notification) {
            setVisible(true);
            // Ferme automatiquement la notification après 6 secondes
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onClose, 500); // Laisse le temps à l'animation de fin
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [notification, onClose]);

    if (!notification) return null;

    return (
        <div
            className={`fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-950/90 backdrop-blur-md border border-slate-800 text-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-4 flex gap-4 transition-all duration-500 transform ${visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'
                }`}
        >
            {/* Image miniature style affiche de film */}
            <div className="w-16 h-20 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700/50">
                {notification.image ? (
                    <img src={notification.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-600">
                        <Calendar className="w-6 h-6" />
                    </div>
                )}
            </div>

            {/* Texte et bouton fermer */}
            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                            {notification.categorie || "Notification"}
                        </span>
                        <button onClick={() => { setVisible(false); setTimeout(onClose, 500); }} className="text-slate-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <h4 className="text-xs font-bold mt-1 text-white">{notification.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{notification.body}</p>
                </div>
            </div>
        </div>
    );
};

export default MovieBoxNotification;