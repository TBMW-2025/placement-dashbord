// js/settings.js

document.addEventListener('DOMContentLoaded', async () => {
    // Populate session info
    const { data: { session } } = await window.apiService.getSession();
    if (session && session.user) {
        document.getElementById('adminEmail').textContent = session.user.email;
    }

    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('changePwdBtn');
        const pass = document.getElementById('newPassword').value;

        btn.innerHTML = '<span class="spinner"></span>';
        btn.disabled = true;

        try {
            const { error } = await window.apiService.supabase.auth.updateUser({
                password: pass
            });
            if (error) throw error;

            alert("Password updated successfully!");
            document.getElementById('passwordForm').reset();
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            btn.textContent = "Update Password";
            btn.disabled = false;
        }
    });
});
