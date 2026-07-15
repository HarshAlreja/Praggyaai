// dashboard-page.js
// Dashboard-ONLY logic: metrics cards + the clientLogoutBtn button.
// Sidebar toggle, profile dropdown, avatar initials, and the session guard
// are already handled by dashboard.js (loaded before this file).

const API_BASE = 'https://bharatvoice-backend-4t9e.onrender.com';

function handleLogout() {
    if (confirm('Logout from BharatVoice?')) {
        localStorage.clear();
        window.location.href = '../login.html';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const logoutBtn = document.getElementById('clientLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    const token = localStorage.getItem('jwt_token');
    const businessId = localStorage.getItem('selected_business_id');

    // dashboard.js already redirects to login if there's no token, but this
    // guard keeps the fetch from firing with a missing businessId regardless.
    if (!token || !businessId) return;

    fetch(`${API_BASE}/api/dashboard/overview`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'X-Business-ID': businessId,
        },
    })
    .then(res => res.json())
    .then(payload => {
        if (payload.status === 'success') {
            const data = payload.data;
            document.getElementById('totalConversations').textContent = data.conversations_30_days;
            document.getElementById('totalDocuments').textContent = data.documents_count;
            document.getElementById('whatsappStatus').textContent =
                data.whatsapp_connected ? '● Connected' : '● Not Connected';
            document.getElementById('tokensUsed').textContent = data.tokens_used.toLocaleString();
        } else {
            console.error('Dashboard load error:', payload.message);
        }
    })
    .catch(function (err) {
        console.error('Dashboard fetch error:', err);
    });
});