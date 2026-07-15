// login.js
// Real login against the backend. business_name isn't in the login response,
// so we chain a call to /api/settings/tenant/:businessId to fetch it --
// avoids touching the backend for this.

const API_BASE = 'https://bharatvoice-backend-4t9e.onrender.com';
const API_AUTH = `${API_BASE}/api/auth`;

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;
        const btn = document.getElementById('btnLoginSubmit');

        if (!email || !password) {
            alert('❌ Please enter email and password');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Signing in...';

        fetch(`${API_AUTH}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })
        .then(res => res.json())
        .then(payload => {
            if (payload.status !== 'success') {
                btn.disabled = false;
                btn.textContent = 'Sign In';
                alert('❌ ' + (payload.message || 'Invalid email or password'));
                return;
            }

            const user = payload.data.user;
            const token = payload.data.tokens.access_token;

            localStorage.setItem('jwt_token', token);
            localStorage.setItem('selected_business_id', String(user.business_id));

            // Fetch business_name separately -- login response doesn't include it
            fetch(`${API_BASE}/api/settings/tenant/${user.business_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Business-ID': String(user.business_id),
                },
            })
            .then(res => res.json())
            .then(settingsPayload => {
                if (settingsPayload.status === 'success') {
                    user.business_name = settingsPayload.data.business_name;
                }
            })
            .catch(function () {
                // Non-fatal -- dashboard can still render without a cached name
            })
            .finally(function () {
                localStorage.setItem('registeredUser', JSON.stringify(user));

                btn.disabled = false;
                btn.textContent = 'Sign In';

                if (user.status === 'active') {
                    alert('✅ Login Successful! Redirecting to dashboard...');
                    window.location.assign('client/dashboard.html');
                } else {
                    alert('✅ Login Successful! Redirecting...');
                    window.location.assign('client/pending_approval.html');
                }
            });
        })
        .catch(function (err) {
            console.error('Login error:', err);
            btn.disabled = false;
            btn.textContent = 'Sign In';
            alert('❌ Connection error. Is the backend running?');
        });
    });

    const googleBtn = document.getElementById('googleBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', function () {
            alert('Google sign-in is a demo placeholder in this build.');
        });
    }
});