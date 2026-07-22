import React, { createContext, useContext, useMemo, useState } from 'react';
import MovieBoxNotification from '../components/MovieBoxNotification.jsx';

const NotificationContext = createContext(null);

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.exponentialRampToValueAtTime(260, now + 0.25);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(720, now);
    filter.Q.setValueAtTime(10, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.35);
    oscillator.onended = () => audioCtx.close();
  } catch (err) {
    console.warn('⚠️ Son de notification impossible :', err);
  }
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const showNotification = ({ title, body, categorie, image }) => {
    setNotification({ title, body, categorie, image });
    playNotificationSound();
  };

  const clearNotification = () => setNotification(null);

  const value = useMemo(
    () => ({ notification, showNotification, clearNotification }),
    [notification]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <MovieBoxNotification notification={notification} onClose={clearNotification} />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
