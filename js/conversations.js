// conversations.js
// Real backend-driven conversations log. Server now paginates and filters.

const API_BASE = 'https://bharatvoice-backend-4t9e.onrender.com';
const PAGE_SIZE = 5;

let currentPage = 1;
let totalPages = 1;

function handleLogout() {
    if (confirm('Logout from BharatVoice?')) {
        localStorage.clear();
        window.location.href = '../login.html';
    }
}

function renderConversationRows(rows) {
    const tbody = document.getElementById('conversationTableBody');

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-tertiary);">No conversations found for this workspace.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(c => {
        const isVoice = c.message_type === 'voice' || c.message_type === 'audio';
        return `
            <tr>
                <td><small>${new Date(c.timestamp).toLocaleString()}</small></td>
                <td><strong>${c.customer_phone}</strong></td>
                <td>${c.message || ''}</td>
                <td><em>${c.ai_response || ''}</em></td>
                <td><span class="status-badge ${isVoice ? 'processing' : 'connected'}">${isVoice ? '🗣️ Voice' : '⌨️ Text'}</span></td>
                <td>${c.response_time_ms || 0} ms</td>
            </tr>
        `;
    }).join('');
}

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
    const displayName = userProfile.name || userProfile.full_name || 'User';
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('convAvatar').textContent = initials || 'U';

    function loadAnalyticsSummary() {
        fetch(`${API_BASE}/api/conversations/summary`, { headers: headers })
            .then(res => res.json())
            .then(payload => {
                if (payload.status === 'success') {
                    const stats = payload.data;
                    document.getElementById('convTotal').textContent = stats.total_conversations;
                    document.getElementById('convUniqueCustomers').textContent = stats.unique_customers;
                    document.getElementById('convAvgResponse').textContent = `${stats.avg_response_time_ms} ms`;
                    document.getElementById('convToday').textContent = stats.today_conversations;
                } else {
                    console.error('Summary error:', payload.message);
                }
            })
            .catch(function (err) {
                console.error('Summary fetch error:', err);
            });
    }

    function loadConversationsTable(page, dateFilter) {
        fetch(`${API_BASE}/api/conversations/list?page=${page}&per_page=${PAGE_SIZE}&date_filter=${dateFilter}`, {
            headers: headers,
        })
        .then(res => res.json())
        .then(payload => {
            if (payload.status !== 'success') {
                document.getElementById('conversationTableBody').innerHTML =
                    `<tr><td colspan="6" style="text-align: center; color: var(--danger);">❌ ${payload.message || 'Failed to load'}</td></tr>`;
                return;
            }

            const rows = payload.data.conversations || [];
            const total = payload.data.pagination.total || 0;
            totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
            currentPage = Math.min(Math.max(1, page), totalPages);

            document.getElementById('paginationInfo').textContent = `Page ${currentPage} of ${totalPages}`;
            document.getElementById('prevPageBtn').disabled = currentPage <= 1;
            document.getElementById('nextPageBtn').disabled = currentPage >= totalPages;

            renderConversationRows(rows);
        })
        .catch(function (err) {
            console.error('Conversations list error:', err);
            document.getElementById('conversationTableBody').innerHTML =
                `<tr><td colspan="6" style="text-align: center; color: var(--danger);">❌ Connection error. Is the backend running?</td></tr>`;
        });
    }

    loadAnalyticsSummary();
    loadConversationsTable(1, 'all');

    document.getElementById('dateFilterSelect').addEventListener('change', function (e) {
        loadConversationsTable(1, e.target.value);
    });

    document.getElementById('prevPageBtn').addEventListener('click', function () {
        if (currentPage > 1) loadConversationsTable(currentPage - 1, document.getElementById('dateFilterSelect').value);
    });

    document.getElementById('nextPageBtn').addEventListener('click', function () {
        if (currentPage < totalPages) loadConversationsTable(currentPage + 1, document.getElementById('dateFilterSelect').value);
    });

    // Search -- hits the backend now, not a local array filter
    document.getElementById('convSearchBtn').addEventListener('click', function () {
        const query = document.getElementById('convSearchInput').value.trim();

        if (!query) {
            loadConversationsTable(1, document.getElementById('dateFilterSelect').value);
            return;
        }

        fetch(`${API_BASE}/api/conversations/search`, {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
            body: JSON.stringify({ query: query }),
        })
        .then(res => res.json())
        .then(payload => {
            if (payload.status === 'success') {
                const results = payload.data.conversations || [];
                if (results.length === 0) {
                    document.getElementById('conversationTableBody').innerHTML =
                        `<tr><td colspan="6" style="text-align: center; color: var(--text-tertiary);">No search matches found for "${query}".</td></tr>`;
                    return;
                }
                renderConversationRows(results);
                document.getElementById('paginationInfo').textContent = `${results.length} search result(s)`;
                document.getElementById('prevPageBtn').disabled = true;
                document.getElementById('nextPageBtn').disabled = true;
            } else {
                alert('❌ ' + (payload.message || 'Search failed'));
            }
        })
        .catch(function (err) {
            console.error('Search error:', err);
            alert('❌ Connection error. Is the backend running?');
        });
    });

    // Export CSV -- now streams the real backend file instead of generating locally
    document.getElementById('exportCsvBtn').addEventListener('click', function () {
        fetch(`${API_BASE}/api/conversations/export`, { headers: headers })
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'conversations.csv';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(function (err) {
                console.error('Export error:', err);
                alert('❌ Export failed. Is the backend running?');
            });
    });
});