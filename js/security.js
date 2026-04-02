// js/security.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Intercept Route Access immediately
    const path = window.location.pathname;
    const isPublicRoute = path.endsWith('index.html') || path.endsWith('forgot-password.html') || path === '/' || path.endsWith('/');
    
    try {
        const { data: { session }, error } = await window.apiService.getSession();

        const hasBypass = localStorage.getItem('localBypass') === 'true';

        if (isPublicRoute) {
            if (session || hasBypass) {
                window.location.replace('dashboard.html');
            }
        } else {
            // Protected route
            if (!session && !hasBypass) {
                window.location.replace('index.html');
            }
        }

        // 2. Global Logout Binding
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                localStorage.removeItem('localBypass'); // Clear bypass offline mode
                await window.apiService.logout();
                window.location.replace('index.html');
            });
        }
    } catch (err) {
        console.error("Security Route Check Error:", err);
        if (!isPublicRoute) window.location.replace('index.html');
    }

    // 3. Listen for session drops mid-use (e.g. token expiration)
    window.apiService.supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' && !isPublicRoute) {
            window.location.replace('index.html');
        } else if (event === 'SIGNED_IN' && isPublicRoute) {
            window.location.replace('dashboard.html');
        }
    });
});
