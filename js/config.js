// Yeh code check karega ki website local computer par chal rahi hai ya live internet par
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const CONFIG = {
    // 1. Backend API Base URL
    API_BASE_URL: isLocalhost 
        ? 'http://127.0.0.1:5000' 
        : 'https://bharatvoice-backend-4t9e.onrender.com',

    // 2. Meta App ID (Public key - isko yahan rakhna safe hai)
    META_APP_ID: 'YOUR_META_APP_ID_HERE',

    // 3. Koi aur public config variable (e.g., Environment Type)
    ENV: isLocalhost ? 'development' : 'production'
};

// Window object me inject kar rahe hain taaki har JS file me mile
window.APP_CONFIG = CONFIG;