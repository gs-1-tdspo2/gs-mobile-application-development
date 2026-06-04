const renderApiBaseUrl = 'https://gs-java-advanced.onrender.com';
const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL = (configuredApiBaseUrl || renderApiBaseUrl).replace(/\/$/, '');
