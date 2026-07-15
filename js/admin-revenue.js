// ===== BharatVoice Admin Revenue =====

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

    // Dynamic avatar initials (was hardcoded "SA")
    const adminProfile = JSON.parse(localStorage.getItem('registeredUser') || '{}');
    const displayName = adminProfile.name || 'Admin';
    const avatarEl = document.querySelector('.profile-btn .avatar');
    if (avatarEl) {
        const initials = displayName.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
        avatarEl.textContent = initials || 'A';
    }

    fetch(`${API_ADMIN}/revenue/metrics`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    })
    .then(res => res.json())
    .then(payload => {
        if (payload.status === 'success') {
            const data = payload.data;

            document.getElementById('admMRR').textContent = '₹' + parseFloat(data.mrr || 0).toLocaleString('en-IN');
            document.getElementById('admARR').textContent = '₹' + parseFloat(data.arr || 0).toLocaleString('en-IN');
            document.getElementById('admSubs').textContent = parseInt(data.active_subscriptions || 0).toLocaleString();
            document.getElementById('admARPU').textContent = '₹' + parseFloat(data.arpu || 0).toLocaleString('en-IN');

            if (data.insights) {
                document.getElementById('admChartTrend').textContent = data.insights.trend || 'No trend data yet';
                document.getElementById('admChartPlan').textContent = data.insights.plan_dist || 'No plan distribution yet';
            }

            // Backend doesn't calculate churn yet -- showing an honest placeholder
            // instead of a fabricated percentage.
            document.getElementById('admChartChurn').textContent = 'Churn tracking not yet implemented.';
        } else {
            alert('❌ Error: ' + (payload.message || 'Failed to load revenue'));
        }
    })
    .catch(function (err) {
        console.error("Revenue fetch error:", err);
        alert("❌ Connection error. Is the backend running?");
    });
});