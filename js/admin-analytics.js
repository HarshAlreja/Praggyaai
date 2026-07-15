// ===== BharatVoice Admin Analytics =====

const API_BASE = 'https://bharatvoice-backend-4t9e.onrender.com';
const API_ADMIN = `${API_BASE}/api/admin`;

function handleLogout() {
    localStorage.clear();
    window.location.href = 'admin-login.html';
}

document.addEventListener('DOMContentLoaded', function () {
    if (localStorage.getItem('adminSessionActive') !== 'true') {
        window.location.href = 'admin-login.html';
        return;
    }

    const token = localStorage.getItem('jwt_token');
    const headers = { 'Authorization': `Bearer ${token}` };

    // Dynamic avatar initials (was hardcoded "SA")
    const adminProfile = JSON.parse(localStorage.getItem('registeredUser') || '{}');
    const displayName = adminProfile.name || 'Admin';
    const avatarEl = document.querySelector('.profile-btn .avatar');
    if (avatarEl) {
        const initials = displayName.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
        avatarEl.textContent = initials || 'A';
    }

    // Fetch analytics data
    fetch(`${API_ADMIN}/analytics/data`, {
        method: 'GET',
        headers: headers,
    })
    .then(res => res.json())
    .then(payload => {
        if (payload.status === 'success') {
            const data = payload.data;
            document.getElementById('admApiTotal').textContent = parseInt(data.total_api_calls || 0).toLocaleString();
            document.getElementById('admLatency').textContent = (data.avg_response_time_ms || 0) + ' ms';
        } else {
            console.error('Analytics data error:', payload.message);
        }
    })
    .catch(function (err) {
        console.error('Analytics data fetch error:', err);
    });

    // Fetch trends
    fetch(`${API_ADMIN}/platform/trends`, {
        method: 'GET',
        headers: headers,
    })
    .then(res => res.json())
    .then(payload => {
        if (payload.status === 'success') {
            const trends = payload.data;
            const totalConv = (trends.daily_conversations || []).reduce((acc, curr) => acc + curr.count, 0);
            const totalBiz = (trends.daily_new_businesses || []).reduce((acc, curr) => acc + curr.count, 0);

            document.getElementById('admTrendsBlock').innerHTML = `
                <strong>Conversations (Past 30 Days):</strong> ${totalConv} interactions<br>
                <strong>New Businesses (Past 30 Days):</strong> ${totalBiz} onboarded<br><br>
                <strong>Top Performing Businesses:</strong><br>
                <ul>
                    ${(trends.top_businesses || []).map(b => `<li>${b.name} — ${b.conversations} conversations</li>`).join('') || '<li>No data yet</li>'}
                </ul>
            `;
        } else {
            document.getElementById('admTrendsBlock').textContent = '❌ ' + (payload.message || 'Failed to load trends');
        }
    })
    .catch(function (err) {
        console.error('Trends fetch error:', err);
        document.getElementById('admTrendsBlock').textContent = '❌ Connection error. Is the backend running?';
    });
});