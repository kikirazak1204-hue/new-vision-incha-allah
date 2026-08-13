// ============================================================
// Fichier : src/util/geolocationManager.js
// ============================================================

export const getGlobalLocationState = () => {
    try {
        const saved = localStorage.getItem('kanari_global_geo');
        return saved ? JSON.parse(saved) : { enabled: false, lat: null, lon: null, address: '' };
    } catch {
        return { enabled: false, lat: null, lon: null, address: '' };
    }
};

export const setGlobalLocationState = (state) => {
    try {
        localStorage.setItem('kanari_global_geo', JSON.stringify(state));
        window.dispatchEvent(new Event('kanariGeoChanged'));
    } catch (e) {
        console.error(e);
    }
};