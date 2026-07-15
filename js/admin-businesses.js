// ===== BharatVoice Admin Businesses =====

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
    let searchTimeout = null;

    // Dynamic avatar initials (was hardcoded "SA")
    const adminProfile = JSON.parse(localStorage.getItem('registeredUser') || '{}');
    const displayName = adminProfile.name || 'Admin';
    const avatarEl = document.querySelector('.profile-btn .avatar');
    if (avatarEl) {
        const initials = displayName.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
        avatarEl.textContent = initials || 'A';
    }

    function renderTenants(businesses) {
        const tbody = document.getElementById('adminBusinessesTbody');

        if (businesses.length > 0) {
            tbody.innerHTML = businesses.map(b => {
                const isApproved = b.status === 'active';
                const statusText = isApproved ? "Active" : b.status === 'suspended' ? "Suspended" : "Pending Approval";
                const statusClass = isApproved ? "status-badge connected" : b.status === 'suspended' ? "status-badge" : "status-badge alert";

                return `
                    <tr>
                        <td><small>${b.id}</small></td>
                        <td><strong>${b.business_name}</strong></td>
                        <td>${b.owner?.name || 'N/A'}</td>
                        <td><small>${b.owner?.email || 'N/A'}</small></td>
                        <td><span class="${statusClass}">● ${statusText}</span></td>
                        <td>
                            <small>Ind: ${b.industry || 'N/A'}</small><br>
                            <small>Docs: ${b.total_documents || 0} | Conv: ${b.conversations_last_30_days || 0}</small>
                        </td>
                        <td>
                            ${b.status !== 'active' ? `<button class="btn btn-primary btn-small" onclick="updateStatus(${b.id}, 'active')">Approve</button>` : ''}
                            ${b.status !== 'suspended' ? `<button class="btn btn-danger btn-small" onclick="updateStatus(${b.id}, 'suspended')" style="background:var(--danger)">Suspend</button>` : ''}
                            ${b.status === 'suspended' ? `<button class="btn btn-success btn-small" onclick="updateStatus(${b.id}, 'active')" style="background:var(--success)">Reactivate</button>` : ''}
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-tertiary);">No businesses found.</td></tr>`;
        }
    }

    function loadBusinesses(searchQuery) {
        const query = searchQuery || '';
        const url = `${API_ADMIN}/businesses?search=${encodeURIComponent(query)}&page=1&per_page=50`;

        fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        })
        .then(res => res.json())
        .then(payload => {
            if (payload.status === 'success') {
                renderTenants(payload.data.businesses || []);
            } else {
                document.getElementById('adminBusinessesTbody').innerHTML =
                    `<tr><td colspan="7" style="text-align: center; color: var(--danger);">❌ ${payload.message || 'Failed to load businesses'}</td></tr>`;
            }
        })
        .catch(function (err) {
            console.error('Load businesses error:', err);
            document.getElementById('adminBusinessesTbody').innerHTML =
                `<tr><td colspan="7" style="text-align: center; color: var(--danger);">❌ Connection error. Is the backend running?</td></tr>`;
        });
    }

    // Real-time search
    document.getElementById('searchBusinesses').addEventListener('input', function (e) {
        clearTimeout(searchTimeout);
        const query = e.target.value;
        searchTimeout = setTimeout(function () {
            loadBusinesses(query);
        }, 400);
    });

    loadBusinesses('');

    // Update business status
    window.updateStatus = function (businessId, newStatus) {
        if (!confirm(`Change business status to: ${newStatus.toUpperCase()}?`)) return;

        fetch(`${API_ADMIN}/business/${businessId}/status`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
        })
        .then(res => res.json())
        .then(payload => {
            if (payload.status === 'success') {
                alert(`✅ ${payload.message}`);
                loadBusinesses(document.getElementById('searchBusinesses').value);
            } else {
                alert('❌ ' + (payload.message || 'Update failed'));
            }
        })
        .catch(function (err) {
            console.error('Update status error:', err);
            alert('❌ Connection error. Is the backend running?');
        });
    };
});