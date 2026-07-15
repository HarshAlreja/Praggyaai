// whatsapp.js
// Real Embedded Signup flow. "Connect WhatsApp" now launches Meta's own
// FB.login() popup directly -- it does NOT open the old 3-field manual-entry
// modal (waConnectModal) that used to ask for phone_number_id/WABA ID by hand.
// That modal's markup is left untouched in the HTML but is no longer wired
// into the connect flow, since a client never manually types those IDs in
// the real architecture -- Meta returns them automatically.

const API_BASE = 'https://bharatvoice-backend-4t9e.onrender.com';
const API_WA = `${API_BASE}/api/whatsapp`;

// ⚠️ Replace these with your real values from Meta App Dashboard >
// Facebook Login for Business > Configurations. Neither of these is a
// secret -- both are meant to be public/client-side, unlike META_APP_SECRET.
const META_APP_ID = '1857966605609478';
const META_CONFIG_ID = '1695591958379882';
const META_GRAPH_VERSION = 'v22.0';

function showToastOrAlert(message, type) {
    if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast(message, type);
    } else {
        alert(message);
    }
}

// ---- Load the Facebook JS SDK dynamically (no HTML changes needed) ----
window.fbAsyncInit = function () {
    FB.init({
        appId: META_APP_ID,
        cookie: true,
        xfbml: true,
        version: META_GRAPH_VERSION,
    });
};

(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s);
    js.id = id;
    js.src = 'https://connect.facebook.net/en_US/sdk.js';
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// ---- Capture waba_id / phone_number_id Meta sends via postMessage ----
// (used only for UX feedback while connecting -- the backend independently
// re-derives these via the Graph API using the exchanged code, so this isn't
// required data, just a nicer loading message)
let sessionInfo = null;

window.addEventListener('message', function (event) {
    if (!event.origin.endsWith('facebook.com')) return;
    try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP' && data.event === 'FINISH') {
            sessionInfo = data.data; // { phone_number_id, waba_id }
        }
    } catch (e) {
        // Not a JSON message we care about -- ignore
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('jwt_token');
    const businessId = localStorage.getItem('selected_business_id');

    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'X-Business-ID': businessId,
    };

    const userProfile = JSON.parse(localStorage.getItem('registeredUser') || '{}');
    const displayName = userProfile.name || userProfile.fullname || userProfile.full_name || 'User';
    document.getElementById('waAvatar').textContent =
        displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    function toggleActionButtons(connected) {
        document.getElementById('btnConnectWhatsapp').style.display = connected ? 'none' : 'inline-flex';
        document.getElementById('btnTestMessage').style.display = connected ? 'inline-flex' : 'none';
        document.getElementById('btnDisconnectWhatsapp').style.display = connected ? 'inline-flex' : 'none';
    }

    function renderStatus(data) {
        const statusBadge = document.getElementById('waStatusIndicator');
        const detailsBlock = document.getElementById('waConnectionDetails');

        if (!data || data.status === 'not_connected') {
            document.getElementById('waDisplayPhone').textContent = 'No number linked yet';
            statusBadge.className = 'status-badge alert';
            statusBadge.textContent = '● Not Connected';
            detailsBlock.style.display = 'none';
            document.getElementById('btnConnectWhatsapp').style.display = 'inline-flex';
            document.getElementById('btnTestMessage').style.display = 'none';
            document.getElementById('btnDisconnectWhatsapp').style.display = 'none';
            return;
        }

        document.getElementById('waDisplayPhone').textContent = data.display_number || 'Linked number';
        document.getElementById('waPhoneNumberId').textContent = data.phone_number_id || '—';
        document.getElementById('waBusinessAccountId').textContent = data.waba_id || '—';
        document.getElementById('waConnectedSince').textContent =
            data.connected_at ? new Date(data.connected_at).toLocaleString() : '—';
        detailsBlock.style.display = 'block';

        if (data.status === 'connected') {
            statusBadge.className = 'status-badge connected';
            statusBadge.textContent = '● Connected';
            toggleActionButtons(true);
        } else if (data.status === 'connecting') {
            statusBadge.className = 'status-badge checking';
            statusBadge.textContent = '● Connecting...';
            toggleActionButtons(false);
        } else {
            statusBadge.className = 'status-badge alert';
            statusBadge.textContent = '● ' + data.status;
            toggleActionButtons(false);
        }
    }

    function loadStatus() {
        fetch(`${API_WA}/status`, { headers: headers })
            .then(res => res.json())
            .then(payload => {
                if (payload.status === 'success') {
                    renderStatus(payload.data);
                } else {
                    console.error('Status error:', payload.message);
                }
            })
            .catch(function (err) {
                console.error('Status fetch error:', err);
            });
    }

    loadStatus();

    document.getElementById('btnSyncWhatsapp').addEventListener('click', function () {
        showToastOrAlert('Refreshing WhatsApp channel status...', 'info');
        loadStatus();
    });

    // --- Connect: launches Meta's own popup directly, no custom modal ---
    document.getElementById('btnConnectWhatsapp').addEventListener('click', function () {
        if (typeof FB === 'undefined') {
            alert('Facebook SDK not loaded yet -- try again in a moment.');
            return;
        }

        FB.login(function (response) {
            if (response.authResponse && response.authResponse.code) {
                const code = response.authResponse.code;

                showToastOrAlert('Connecting your WhatsApp number...', 'info');

                fetch(`${API_WA}/callback`, {
                    method: 'POST',
                    headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
                    body: JSON.stringify({ code: code }),
                })
                .then(res => res.json())
                .then(payload => {
                    if (payload.status === 'success') {
                        showToastOrAlert('WhatsApp connected successfully!', 'success');
                        loadStatus();
                    } else {
                        alert('❌ ' + (payload.message || 'Connection failed'));
                    }
                })
                .catch(function (err) {
                    console.error('Callback error:', err);
                    alert('❌ Connection error. Is the backend running?');
                });
            } else {
                console.log('User cancelled the Embedded Signup flow.');
            }
        }, {
            config_id: META_CONFIG_ID,
            response_type: 'code',
            override_default_response_type: true,
        });
    });

    // --- Disconnect ---
    document.getElementById('btnDisconnectWhatsapp').addEventListener('click', function () {
        if (!confirm('Disconnect this WhatsApp number? Incoming messages will stop until reconnected.')) {
            return;
        }

        fetch(`${API_WA}/disconnect`, {
            method: 'POST',
            headers: headers,
        })
        .then(res => res.json())
        .then(payload => {
            if (payload.status === 'success') {
                showToastOrAlert('WhatsApp number disconnected.', 'success');
                loadStatus();
            } else {
                alert('❌ ' + (payload.message || 'Disconnect failed'));
            }
        })
        .catch(function (err) {
            console.error('Disconnect error:', err);
            alert('❌ Connection error. Is the backend running?');
        });
    });

    // --- Test message modal (unchanged, matches existing backend contract) ---
    const testModal = document.getElementById('waTestModal');
    document.getElementById('btnTestMessage').addEventListener('click', function () {
        testModal.style.display = 'flex';
    });
    document.getElementById('btnCancelTest').addEventListener('click', function () {
        testModal.style.display = 'none';
    });
    document.getElementById('btnSubmitTest').addEventListener('click', function () {
        const targetPhone = document.getElementById('inputTestPhone').value.trim();
        const message = document.getElementById('inputTestMessage').value.trim();

        if (!targetPhone) {
            showToastOrAlert('Recipient phone number required hai.', 'error');
            return;
        }

        fetch(`${API_WA}/test-message`, {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
            body: JSON.stringify({ phone_number: targetPhone, message: message }),
        })
        .then(res => res.json())
        .then(payload => {
            if (payload.status === 'success') {
                showToastOrAlert('Test message dispatched!', 'success');
                testModal.style.display = 'none';
            } else {
                alert('❌ ' + (payload.message || 'Send failed'));
            }
        })
        .catch(function (err) {
            console.error('Test message error:', err);
            alert('❌ Connection error. Is the backend running?');
        });
    });
});