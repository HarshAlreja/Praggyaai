// knowledge-base.js
// Real backend-driven document upload/list/delete. Uploads hit the actual
// chunk+embed pipeline (EmbeddingService), so processing may take a few
// seconds per file depending on size -- the queue UI reflects that.

const API_BASE = 'https://bharatvoice-backend-4t9e.onrender.com';

function showToastOrAlert(message, type) {
    if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast(message, type);
    } else {
        alert(message);
    }
}

function handleLogout() {
    if (confirm('Logout from BharatVoice?')) {
        localStorage.clear();
        window.location.href = '../login.html';
    }
}

function toggleProfileDropdown(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) dropdown.classList.toggle('show-dropdown');
}

function formatSize(bytes) {
    if (!bytes) return '—';
    const kb = bytes / 1024;
    return kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.round(kb) + ' KB';
}

function statusBadge(status) {
    if (status === 'indexed') return `<span class="status-badge connected">● Indexed</span>`;
    if (status === 'failed') return `<span class="status-badge alert">● Failed</span>`;
    return `<span class="status-badge checking">● Processing</span>`;
}

let currentDocs = [];

function renderDocumentsTable() {
    const tbody = document.getElementById('documentsTableBody');

    if (currentDocs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94A3B8;">No documents uploaded yet.</td></tr>`;
    } else {
        tbody.innerHTML = currentDocs.map(doc => `
            <tr>
                <td>${doc.filename}${doc.error_message ? `<br><small style="color: var(--danger);">${doc.error_message}</small>` : ''}</td>
                <td>${(doc.file_type || '').toUpperCase()}</td>
                <td>${new Date(doc.created_at).toLocaleDateString()}</td>
                <td>${statusBadge(doc.status)}</td>
                <td>${formatSize(doc.file_size)}</td>
                <td><button class="btn btn-secondary btn-small" onclick="deleteKbDocument(${doc.id})">Delete</button></td>
            </tr>
        `).join('');
    }

    updateKbMetrics();
}

function updateKbMetrics() {
    document.getElementById('kbDocCount').textContent = currentDocs.length;
    document.getElementById('kbChunkCount').textContent =
        currentDocs.reduce((sum, d) => sum + (d.chunk_count || 0), 0);

    const anyFailed = currentDocs.some(d => d.status === 'failed');
    document.getElementById('kbVectorStatus').textContent = anyFailed ? 'Issues Found' : 'Ready';
    document.getElementById('kbVectorStatus').style.color = anyFailed ? 'var(--danger)' : '#10B981';
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
    document.getElementById('kbAvatar').textContent =
        displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    // Sidebar toggle
    const sidebar = document.getElementById('sidebar');
    const hamburgerToggle = document.getElementById('hamburgerToggle');
    const sidebarClose = document.getElementById('sidebarClose');

    if (hamburgerToggle && sidebar) {
        hamburgerToggle.addEventListener('click', () => sidebar.classList.add('show-sidebar'));
    }
    if (sidebarClose && sidebar) {
        sidebarClose.addEventListener('click', () => sidebar.classList.remove('show-sidebar'));
    }
    document.addEventListener('click', () => {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) dropdown.classList.remove('show-dropdown');
    });

    function loadDocuments() {
        fetch(`${API_BASE}/api/knowledge-base/documents/${businessId}`, { headers: headers })
            .then(res => res.json())
            .then(payload => {
                if (payload.status === 'success') {
                    currentDocs = payload.data.documents || [];
                    renderDocumentsTable();
                } else {
                    document.getElementById('documentsTableBody').innerHTML =
                        `<tr><td colspan="6" style="text-align: center; color: var(--danger);">❌ ${payload.message || 'Failed to load'}</td></tr>`;
                }
            })
            .catch(function (err) {
                console.error('Load documents error:', err);
                document.getElementById('documentsTableBody').innerHTML =
                    `<tr><td colspan="6" style="text-align: center; color: var(--danger);">❌ Connection error. Is the backend running?</td></tr>`;
            });
    }

    loadDocuments();

    window.deleteKbDocument = function (docId) {
        if (!confirm('Delete this document from the knowledge base?')) return;

        fetch(`${API_BASE}/api/knowledge-base/document/${docId}`, {
            method: 'DELETE',
            headers: headers,
        })
        .then(res => res.json())
        .then(payload => {
            if (payload.status === 'success') {
                showToastOrAlert('Document removed from knowledge base.', 'success');
                loadDocuments();
            } else {
                alert('❌ ' + (payload.message || 'Delete failed'));
            }
        })
        .catch(function (err) {
            console.error('Delete error:', err);
            alert('❌ Connection error. Is the backend running?');
        });
    };

    // ---- Real upload (multipart, one request per file, hits the RAG pipeline) ----
    const uploadZone = document.getElementById('kbUploadZone');
    const browseBtn = document.getElementById('kbBrowseBtn');
    const fileInput = document.getElementById('kbFileInput');
    const uploadQueue = document.getElementById('kbUploadQueue');

    function uploadFiles(files) {
        Array.from(files).forEach(file => {
            let row = null;
            if (uploadQueue) {
                row = document.createElement('div');
                row.textContent = `Uploading ${file.name}...`;
                row.style.cssText = 'padding:6px 0; color: var(--text-secondary); font-size: 13px;';
                uploadQueue.appendChild(row);
            }

            const formData = new FormData();
            formData.append('file', file);

            fetch(`${API_BASE}/api/knowledge-base/upload/${businessId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Business-ID': businessId,
                    // NOTE: no Content-Type here -- the browser sets the correct
                    // multipart boundary automatically for FormData
                },
                body: formData,
            })
            .then(res => res.json())
            .then(payload => {
                if (payload.status === 'success') {
                    if (row) row.textContent = `✅ ${file.name} indexed successfully.`;
                } else {
                    if (row) row.textContent = `❌ ${file.name} failed: ${payload.message || 'unknown error'}`;
                }
                loadDocuments();
            })
            .catch(function (err) {
                console.error('Upload error:', err);
                if (row) row.textContent = `❌ ${file.name} failed: connection error.`;
            });
        });

        showToastOrAlert('Files queued for RAG indexing.', 'info');
    }

    if (browseBtn && fileInput) {
        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => uploadFiles(e.target.files));
    }

    if (uploadZone) {
        uploadZone.addEventListener('dragover', (e) => e.preventDefault());
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
        });
    }
});