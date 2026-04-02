// js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Handle Login Form (index.html)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            const errorDiv = document.getElementById('authError');
            
            btn.innerHTML = '<span class="spinner"></span> Authenticating...';
            btn.disabled = true;
            errorDiv.style.display = 'none';

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Optional future MFA flag:
            // This architecture inherently protects against JWT tampering.
            const { data, error } = await window.apiService.login(email, password);

            if (error) {
                errorDiv.textContent = error.message;
                errorDiv.style.display = 'block';
                btn.innerHTML = 'Sign In';
                btn.disabled = false;
            } else {
                window.location.replace('dashboard.html');
            }
        });
    }

    // 2. Handle Password Reset Form (forgot-password.html)
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('resetBtn');
            const successDiv = document.getElementById('authSuccess');
            const errorDiv = document.getElementById('authError');
            
            btn.innerHTML = '<span class="spinner"></span> Sending...';
            btn.disabled = true;
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';

            const email = document.getElementById('resetEmail').value;

            try {
                const { error } = await window.apiService.supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/settings.html',
                });
                
                if (error) throw error;

                successDiv.textContent = "If an account exists, a password reset link has been sent to that email.";
                successDiv.style.display = 'block';
                document.getElementById('resetEmail').value = '';
            } catch (err) {
                errorDiv.textContent = err.message;
                errorDiv.style.display = 'block';
            } finally {
                btn.innerHTML = 'Send Reset Link';
                btn.disabled = false;
            }
        });
    }
});
