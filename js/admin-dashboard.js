// ===== BharatVoice Admin Dashboard =====

const API_BASE = 'https://bharatvoice-backend-4t9e.onrender.com';
const API_ADMIN = `${API_BASE}/api/admin`;

function updateTelemetryUI(data) {
    if (!data) return;
    document.getElementById('adTotalUsers').textContent = data.users?.total || 0;
    document.getElementById('adTotalBusinesses').textContent = data.businesses?.total || 0;
    document.getElementById('adActiveWhatsapp').textContent = data.whatsapp?.active || 0;
    document.getElementById('adTotalDocs').textContent = data.documents?.total || 0;
    document.getElementById('adRecentConversations').textContent = data.conversations?.recent_30_days || 0;

    document.getElementById('adTotalTokens').textContent = parseInt(data.ai_usage?.total_tokens_used || 0).toLocaleString();
    document.getElementById('adRecentTokens').textContent = parseInt(data.ai_usage?.recent_30_days_tokens || 0).toLocaleString();
}

function setIndicatorState(status) {
    const indicator = document.getElementById('wsStatusIndicator');
    const text = document.getElementById('wsStatusText');
    if (indicator && text) {
        indicator.className = 'ws-status-indicator ' + status;
        text.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    if (localStorage.getItem('adminSessionActive') !== 'true') {
        window.location.href = 'admin-login.html';
        return;
    }

    const token = localStorage.getItem('jwt_token');

    // Dynamic avatar initials from the logged-in admin's actual name
    // (was hardcoded "SA" before)
    const adminProfile = JSON.parse(localStorage.getItem('registeredUser') || '{}');
    const displayName = adminProfile.name || 'Admin';
    const avatarEl = document.querySelector('.profile-btn .avatar');
    if (avatarEl) {
        const initials = displayName
            .split(' ')
            .map(w => w.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
        avatarEl.textContent = initials || 'A';
    }

    setIndicatorState('connecting');

    fetch(`${API_ADMIN}/dashboard/summary`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    })
    .then(res => res.json())
    .then(payload => {
        if (payload.status === 'success') {
            updateTelemetryUI(payload.data);
            setIndicatorState('connected');
        } else {
            console.error('Dashboard summary error:', payload.message);
            setIndicatorState('disconnected');
        }
    })
    .catch(function (err) {
        console.error('Dashboard summary fetch error:', err);
        setIndicatorState('disconnected');
    });

    // Logout execution
    function handleAdminLogout() {
        if (confirm('Terminate Master Super Admin session?')) {
            localStorage.clear();
            window.location.href = 'admin-login.html';
        }
    }

    const logoutBtn = document.getElementById('adminLogoutBtn');
    const dropDownAdminLogout = document.getElementById('dropdownAdminLogout');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleAdminLogout);
    }
    if (dropDownAdminLogout) {
        dropDownAdminLogout.addEventListener('click', function (e) {
            e.preventDefault();
            handleAdminLogout();
        });
    }
});