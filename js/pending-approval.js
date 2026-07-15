// pending-approval.js
// Polls the backend to see if admin has approved this business yet.
// Redirects to the dashboard automatically once approved.

const API_BASE = 'https://bharatvoice-backend-4t9e.onrender.com';
const API_AUTH = `${API_BASE}/api/auth`;

let pollInterval = null;

document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        // No session at all -- send them back to log in
        window.location.href = '../login.html';
        return;
    }

    // Business name isn't in the backend's check-status response, so we use
    // what was captured client-side during signup and stashed in localStorage.
    const registeredUser = JSON.parse(localStorage.getItem('registeredUser') || '{}');
    document.getElementById('boxBusinessName').textContent = registeredUser.business_name || 'Your Business';
    document.getElementById('boxEmailAddress').textContent = registeredUser.email || '—';

    function checkStatus(showFeedback) {
        fetch(`${API_AUTH}/check-status`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        })
        .then(res => res.json())
        .then(payload => {
            if (payload.status === 'success') {
                const data = payload.data;

                if (data.is_approved) {
                    if (pollInterval) clearInterval(pollInterval);
                    alert('✅ Your account has been approved!');
                    window.location.href = 'dashboard.html';
                    return;
                }

                if (data.status === 'suspended') {
                    document.getElementById('statusText').textContent = 'Account Suspended';
                } else if (showFeedback) {
                    alert('⏳ Still pending approval. We\'ll keep checking automatically.');
                }
            } else if (showFeedback) {
                alert('❌ ' + (payload.message || 'Could not check status'));
            }
        })
        .catch(err => {
            console.error('Check status error:', err);
            if (showFeedback) {
                alert('❌ Connection error. Is the backend running?');
            }
        });
    }

    // Manual "Check Approval Status" button
    const btnCheckStatus = document.getElementById('btnCheckStatus');
    if (btnCheckStatus) {
        btnCheckStatus.addEventListener('click', function () {
            const originalText = btnCheckStatus.textContent;
            btnCheckStatus.disabled = true;
            btnCheckStatus.textContent = 'Checking...';

            checkStatus(true);

            setTimeout(function () {
                btnCheckStatus.disabled = false;
                btnCheckStatus.textContent = originalText;
            }, 1000);
        });
    }

    // Logout
    const btnPendingLogout = document.getElementById('btnPendingLogout');
    if (btnPendingLogout) {
        btnPendingLogout.addEventListener('click', function () {
            localStorage.clear();
            window.location.href = '../login.html';
        });
    }

    // Silent auto-check on load, then poll every 20s in the background
    checkStatus(false);
    pollInterval = setInterval(function () {
        checkStatus(false);
    }, 20000);
});