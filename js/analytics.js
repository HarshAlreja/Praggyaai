// analytics.js
// Real backend-driven analytics summary.

const API_BASE = 'https://bharatvoice-backend-4t9e.onrender.com';

function handleLogout() {
    if (confirm('Logout from BharatVoice?')) {
        localStorage.clear();
        window.location.href = '../../pages/login.html';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('jwt_token');
    const businessId = localStorage.getItem('selected_business_id');

    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    const userData = JSON.parse(localStorage.getItem('registeredUser') || '{}');

    // Set avatar
    const displayName = userData.name || userData.full_name || 'User';
    document.getElementById('analyticsAvatar').textContent = displayName.charAt(0).toUpperCase();

    // Sidebar toggle
    const sidebar = document.getElementById('sidebar');
    const hamburgerToggle = document.getElementById('hamburgerToggle');
    const sidebarClose = document.getElementById('sidebarClose');

    if (hamburgerToggle && sidebar) {
        hamburgerToggle.addEventListener('click', () => {
            sidebar.classList.add('show-sidebar');
        });
    }

    if (sidebarClose && sidebar) {
        sidebarClose.addEventListener('click', () => {
            sidebar.classList.remove('show-sidebar');
        });
    }

    // Profile dropdown
    const profileBtn = document.querySelector('.profile-btn');
    const profileDropdown = document.querySelector('.profile-dropdown');

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('show-dropdown');
        });

        document.addEventListener('click', () => {
            profileDropdown.classList.remove('show-dropdown');
        });
    }

    // Load real analytics from the backend
    function loadAnalytics() {
        fetch(`${API_BASE}/api/analytics/summary/${businessId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Business-ID': businessId,
            },
        })
        .then(res => res.json())
        .then(payload => {
            if (payload.status !== 'success') {
                console.error('Analytics error:', payload.message);
                return;
            }

            const data = payload.data;
            document.getElementById('anTotalConv').textContent = data.total_conversations;
            document.getElementById('anUniqueCust').textContent = data.unique_customers;

            document.getElementById('anAvgResponse').textContent =
                data.avg_response_time !== null ? data.avg_response_time.toFixed(1) + 's' : '—';

            // accuracy_rate isn't computable yet (no feedback/rating mechanism) --
            // showing an honest "N/A" instead of a fabricated percentage.
            document.getElementById('anAccuracy').textContent =
                data.accuracy_rate !== null ? data.accuracy_rate + '%' : 'N/A';
        })
        .catch(function (err) {
            console.error('Analytics fetch error:', err);
        });
    }

    loadAnalytics();
});