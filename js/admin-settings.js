// ===== BharatVoice Admin Settings =====

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

    // Load current settings
    fetch(`${API_ADMIN}/settings/fetch`, {
        method: 'GET',
        headers: headers,
    })
    .then(res => res.json())
    .then(payload => {
        if (payload.status === 'success') {
            const data = payload.data;
            document.getElementById('admSettingLlm').value = data.llm_provider || 'groq-llama3';
            document.getElementById('admSettingRateLimit').value = data.token_rate_limit || 50000;
            document.getElementById('admSettingStt').value = data.stt_model || 'sarvam-v2';
            document.getElementById('admSettingToken').value = data.webhook_token || '';
            document.getElementById('admSettingApiVer').value = data.meta_api_version || 'v20.0';

            const maintBtn = document.getElementById('admSettingMaint');
            if (data.maintenance_mode) {
                maintBtn.textContent = 'Enabled';
                maintBtn.style.color = 'var(--success)';
            } else {
                maintBtn.textContent = 'Disabled';
                maintBtn.style.color = 'var(--danger)';
            }
        } else {
            alert('❌ ' + (payload.message || 'Failed to load settings'));
        }
    })
    .catch(function (err) {
        console.error('Settings fetch error:', err);
        alert('❌ Connection error. Is the backend running?');
    });

    // Toggle multilingual (UI-only, not part of the backend model)
    document.getElementById('toggleMultilingual').addEventListener('click', function () {
        const current = this.textContent;
        this.textContent = current === 'Enabled' ? 'Disabled' : 'Enabled';
        this.className = current === 'Enabled' ? 'status-badge alert' : 'status-badge connected';
    });

    // Toggle maintenance mode
    document.getElementById('admSettingMaint').addEventListener('click', function () {
        const current = this.textContent;
        this.textContent = current === 'Enabled' ? 'Disabled' : 'Enabled';
        this.style.color = current === 'Enabled' ? 'var(--danger)' : 'var(--success)';
    });

    // Save settings
    document.getElementById('btnSaveMasterSettings').addEventListener('click', function () {
        const payload = {
            llm_provider: document.getElementById('admSettingLlm').value,
            token_rate_limit: parseInt(document.getElementById('admSettingRateLimit').value),
            stt_model: document.getElementById('admSettingStt').value,
            webhook_token: document.getElementById('admSettingToken').value,
            meta_api_version: document.getElementById('admSettingApiVer').value,
            maintenance_mode: document.getElementById('admSettingMaint').textContent === 'Enabled',
        };

        fetch(`${API_ADMIN}/settings/update`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                alert('✅ Settings saved successfully!');
            } else {
                alert('❌ ' + (res.message || 'Failed to save settings'));
            }
        })
        .catch(function (err) {
            console.error('Save settings error:', err);
            alert('❌ Connection error. Is the backend running?');
        });
    });
});