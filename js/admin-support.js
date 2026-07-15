// ===== BharatVoice Admin Support Tickets =====

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

    function loadSupportTickets() {
        fetch(`${API_ADMIN}/support/tickets`, {
            method: 'GET',
            headers: headers,
        })
        .then(res => res.json())
        .then(payload => {
            if (payload.status === 'success') {
                const tickets = payload.data.tickets || [];
                const tbody = document.getElementById('adminTblTicketsBody');
                document.getElementById('admNotifCount').textContent = tickets.length;

                if (tickets.length > 0) {
                    tbody.innerHTML = tickets.map(t => {
                        // Backend stores priority lowercase; capitalize for display
                        const priorityLabel = t.priority
                            ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1)
                            : 'Medium';

                        return `
                            <tr>
                                <td><strong>TCK-${t.id}</strong></td>
                                <td>${t.business}</td>
                                <td>${t.subject}</td>
                                <td><span class="status-badge">● ${t.status}</span></td>
                                <td><span style="font-weight: 600;">${priorityLabel}</span></td>
                                <td>${t.created}</td>
                                <td>
                                    ${t.status !== 'resolved'
                                        ? `<button class="btn btn-secondary btn-small" onclick="resolveTicket(${t.id})">Resolve</button>`
                                        : '<span style="color: var(--text-tertiary);">Resolved</span>'}
                                </td>
                            </tr>
                        `;
                    }).join('');
                } else {
                    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-tertiary);">No support tickets. System fully clear!</td></tr>`;
                }
            } else {
                console.error(payload.message);
                document.getElementById('adminTblTicketsBody').innerHTML =
                    `<tr><td colspan="7" style="text-align: center; color: var(--danger);">❌ ${payload.message || 'Failed to load tickets'}</td></tr>`;
            }
        })
        .catch(function (err) {
            console.error("Support API error:", err);
            document.getElementById('adminTblTicketsBody').innerHTML =
                `<tr><td colspan="7" style="text-align: center; color: var(--danger);">❌ Connection error. Is the backend running?</td></tr>`;
        });
    }

    loadSupportTickets();

    // Resolve ticket -- status update, not a delete (matches the fixed backend contract)
    window.resolveTicket = function (ticketId) {
        if (!confirm(`Resolve ticket TCK-${ticketId}?`)) return;

        fetch(`${API_ADMIN}/support/tickets/${ticketId}/resolve`, {
            method: 'POST',
            headers: headers,
        })
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                alert(`✅ ${res.message}`);
                loadSupportTickets();
            } else {
                alert("❌ " + res.message);
            }
        })
        .catch(function (err) {
            console.error(err);
            alert('❌ Connection error. Is the backend running?');
        });
    };
});