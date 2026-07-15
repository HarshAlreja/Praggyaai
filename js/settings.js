// settings.js
// Drives the Settings page using local DUMMY DATA only.
// All backend API calls have been removed — this is a frontend-only mock.

const DUMMY_SETTINGS = {
    business_name: 'Kumar Medical Store',
    industry: 'medical',
    phone: '+919876543210',
    email: 'raj.kumar@example.com',
    website: 'https://kumarmedical.example.com',
    timezone: 'Asia/Kolkata',
    language: 'en'
};

function showToastOrAlert(message, type) {
    if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast(message, type);
    } else {
        alert(message);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Seed a dummy session automatically so this page works stand-alone.
    if (!localStorage.getItem('jwt_token')) {
        localStorage.setItem('jwt_token', 'dummy.jwt.token');
    }
    if (!localStorage.getItem('registeredUser')) {
        localStorage.setItem('registeredUser', JSON.stringify({
            fullname: 'Raj Kumar',
            email: 'raj.kumar@example.com',
            business_id: 1,
            status: 'active'
        }));
    }

    const userProfile = JSON.parse(localStorage.getItem('registeredUser') || '{}');
    if (userProfile && userProfile.fullname) {
        const initials = userProfile.fullname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        document.getElementById('settingsAvatar').textContent = initials;
        document.getElementById('accEmail').value = userProfile.email || '';
    }

    // Populate workspace settings fields with dummy data
    function fetchSettings() {
        const data = DUMMY_SETTINGS;
        document.getElementById('settingsBusinessName').value = data.business_name || '';
        document.getElementById('settingsIndustry').value = data.industry || '';
        document.getElementById('settingsPhone').value = data.phone || '';
        document.getElementById('settingsEmail').value = data.email || '';
        document.getElementById('settingsWebsite').value = data.website || '';
        document.getElementById('settingsTimezone').value = data.timezone || 'Asia/Kolkata';
        document.getElementById('settingsLanguage').value = data.language || 'en';
    }

    fetchSettings();

    // Save preferences (dummy — persists only in-memory / localStorage)
    document.getElementById('btnSaveBusiness').addEventListener('click', function () {
        const payload = {
            business_name: document.getElementById('settingsBusinessName').value,
            industry: document.getElementById('settingsIndustry').value,
            phone: document.getElementById('settingsPhone').value,
            email: document.getElementById('settingsEmail').value,
            website: document.getElementById('settingsWebsite').value,
            timezone: document.getElementById('settingsTimezone').value,
            language: document.getElementById('settingsLanguage').value
        };

        Object.assign(DUMMY_SETTINGS, payload);

        showToastOrAlert('Multi-tenant configurations updated successfully!', 'success');

        userProfile.businessname = payload.business_name;
        localStorage.setItem('registeredUser', JSON.stringify(userProfile));
    });

    document.getElementById('btnResetBusiness').addEventListener('click', () => fetchSettings());

    // Password update (dummy, no backend call)
    document.getElementById('btnUpdatePassword').addEventListener('click', function () {
        const newPass = document.getElementById('accNewPassword').value;
        if (!newPass || newPass.length < 8) {
            alert('Please enter a secure password sequence containing minimum 8 characters.');
            return;
        }

        showToastOrAlert('Master password access key modified successfully.', 'success');
        document.getElementById('accNewPassword').value = '';
    });

    // Purge workspace (dummy, no backend call)
    document.getElementById('btnPurgeWorkspace').addEventListener('click', function () {
        if (prompt('Purging database workspace node maps vectors irreversibly! Type "PURGE" to authorize:') === 'PURGE') {
            alert('Workspace node vector store successfully purged.');
            localStorage.clear();
            window.location.href = '../../pages/login.html';
        }
    });
});