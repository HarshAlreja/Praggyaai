// main.js
// Shared utility helpers used across every BharatVoice page.

const Utils = (function () {

    function ensureToastContainer() {
        let container = document.getElementById('toastStack');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastStack';
            container.style.cssText = [
                'position:fixed', 'bottom:20px', 'right:20px', 'z-index:9999',
                'display:flex', 'flex-direction:column', 'gap:10px'
            ].join(';');
            document.body.appendChild(container);
        }
        return container;
    }

    // Utils.showToast('message', 'success' | 'error' | 'warning' | 'info')
    function showToast(message, type) {
        type = type || 'info';
        const container = ensureToastContainer();

        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#7C5CFC'
        };

        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = [
            'background:#1A1F2E',
            'color:#fff',
            'border-left:4px solid ' + (colors[type] || colors.info),
            'padding:12px 18px',
            'border-radius:6px',
            'font-size:14px',
            'box-shadow:0 4px 12px rgba(0,0,0,0.3)',
            'min-width:240px',
            'max-width:360px',
            'opacity:1',
            'transition:opacity 0.3s ease'
        ].join(';');

        container.appendChild(toast);

        setTimeout(function () {
            toast.style.opacity = '0';
            setTimeout(function () { toast.remove(); }, 300);
        }, 3500);
    }

    // Utils.getInitials('Raj Kumar') -> 'RK'
    function getInitials(name) {
        if (!name) return 'U';
        return name
            .split(' ')
            .filter(Boolean)
            .map(function (n) { return n[0]; })
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    // Utils.activeBusinessId() -> reads the currently selected business id,
    // falling back to the logged-in user's business_id.
    //
    // NOTE: the old dummy fallback ("return '1'" when nothing was found) has
    // been removed. With a real backend connected, silently defaulting to
    // business_id=1 could leak or overwrite ANOTHER business's data if a
    // page's session state is ever missing/corrupted. Returning null instead
    // forces the caller to notice and redirect to login, same as every other
    // page's session guard already does.
    function activeBusinessId() {
        const stored = localStorage.getItem('selected_business_id');
        if (stored) return stored;

        try {
            const user = JSON.parse(localStorage.getItem('registeredUser') || '{}');
            if (user.business_id) return String(user.business_id);
        } catch (e) {
            // ignore parse errors
        }

        return null; // caller must handle this -- redirect to login, don't guess
    }

    return {
        showToast: showToast,
        getInitials: getInitials,
        activeBusinessId: activeBusinessId
    };
})();