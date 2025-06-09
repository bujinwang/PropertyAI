"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCache = exports.getCache = exports.setCache = void 0;
const cache = new Map();
const setCache = (key, value, ttl) => {
    const expires = Date.now() + ttl;
    cache.set(key, { value, expires });
};
exports.setCache = setCache;
const getCache = (key) => {
    const data = cache.get(key);
    if (data && Date.now() < data.expires) {
        return data.value;
    }
    cache.delete(key);
    return null;
};
exports.getCache = getCache;
const clearCache = (key) => {
    cache.delete(key);
};
exports.clearCache = clearCache;
//# sourceMappingURL=cache.js.map