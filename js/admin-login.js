// ===== BharatVoice Admin Login =====

const API_BASE = 'https://bharatvoice-backend-4t9e.onrender.com';
const API_AUTH = `${API_BASE}/api/auth`;

document.addEventListener('DOMContentLoaded', function () {
    const adminForm = document.getElementById('adminLoginForm');

    if (adminForm) {
        adminForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const email = document.getElementById('adminEmail').value.trim().toLowerCase();
            const password = document.getElementById('adminPassword').value;
            const btn = document.getElementById('btnAdminSubmit');

            if (!email || !password) {
                alert("⚠️ All fields are mandatory.");
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Authenticating Master Terminal...';

            fetch(`${API_AUTH}/admin-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
            .then(res => res.json())
            .then(payload => {
                btn.disabled = false;
                btn.textContent = '🔒 Verify Credentials & Access Terminal';

                if (payload.status === 'success') {
                    const user = payload.data.user;
                    const token = payload.data.tokens.access_token;

                    localStorage.setItem('jwt_token', token);
                    localStorage.setItem('adminSessionActive', 'true');
                    localStorage.setItem('registeredUser', JSON.stringify(user));

                    alert("✅ Authorization Passed!\nSuper Admin session initialized.");
                    window.location.href = 'admin-dashboard.html';
                } else {
                    alert("❌ ACCESS DENIED:\n" + (payload.message || 'Invalid admin credentials.'));
                }
            })
            .catch(function (err) {
                console.error('Admin login error:', err);
                btn.disabled = false;
                btn.textContent = '🔒 Verify Credentials & Access Terminal';
                alert("❌ Connection error. Is the backend running?");
            });
        });
    }
});