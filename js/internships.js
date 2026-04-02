// js/internships.js

let allInternships = [];

document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        loadInternships(),
        populateDropdowns()
    ]);

    document.getElementById('openAddModalBtn').addEventListener('click', openAddModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('internshipForm').addEventListener('submit', handleSaveInternship);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
});

async function loadInternships() {
    const tbody = document.getElementById('internshipsBody');
    try {
        const { data, error } = await window.apiService.fetchInternships();
        if (error) throw error;
        
        allInternships = data || [];
        renderTable(allInternships);
    } catch (err) {
        console.error("Error:", err);
        tbody.innerHTML = '<tr><td colspan="7" style="color:var(--accent-red);text-align:center;">Failed to load data.</td></tr>';
    }
}

async function populateDropdowns() {
    try {
        const [{ data: students }, { data: companies }] = await Promise.all([
            window.apiService.fetchAll('students'),
            window.apiService.fetchAll('companies')
        ]);

        const sSelect = document.getElementById('student_id');
        const cSelect = document.getElementById('company_id');

        if (students) {
            students.forEach(s => {
                sSelect.add(new Option(`${s.student_name} (${s.enrollment_number})`, s.id));
            });
        }
        if (companies) {
            companies.forEach(c => {
                cSelect.add(new Option(c.company_name, c.id));
            });
        }
    } catch (err) {
        console.error("Error loading dropdown data:", err);
    }
}

function renderTable(data) {
    const tbody = document.getElementById('internshipsBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No internships found.</td></tr>';
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:500;">${item.students?.student_name || 'N/A'}</td>
            <td style="color:var(--text-secondary);">${item.students?.enrollment_number || '-'}</td>
            <td>${item.companies?.company_name || 'N/A'}</td>
            <td>${item.role || '-'}</td>
            <td>${item.duration || '-'}</td>
            <td>${item.type_of_organization || '-'}</td>
            <td>
                <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem" onclick='editInternship(${JSON.stringify(item).replace(/'/g, "&apos;")})'>Edit</button>
                <button class="btn btn-danger" style="padding:0.25rem 0.5rem; font-size:0.75rem" onclick="deleteInternship('${item.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function handleSearch(e) {
    const q = e.target.value.toLowerCase();
    const filtered = allInternships.filter(i => 
        (i.students?.student_name?.toLowerCase().includes(q)) || 
        (i.companies?.company_name?.toLowerCase().includes(q))
    );
    renderTable(filtered);
}

function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Internship';
    document.getElementById('internshipForm').reset();
    document.getElementById('internshipId').value = '';
    document.getElementById('internshipModal').classList.add('active');
}

function editInternship(item) {
    document.getElementById('modalTitle').textContent = 'Edit Internship';
    document.getElementById('internshipId').value = item.id;
    document.getElementById('student_id').value = item.student_id;
    document.getElementById('company_id').value = item.company_id;
    document.getElementById('role').value = item.role || '';
    document.getElementById('duration').value = item.duration || '';
    document.getElementById('type_of_organization').value = item.type_of_organization || '';
    document.getElementById('internshipModal').classList.add('active');
}

function closeModal() {
    document.getElementById('internshipModal').classList.remove('active');
}

async function handleSaveInternship(e) {
    e.preventDefault();
    const btn = document.getElementById('saveBtn');
    const originalText = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    const id = document.getElementById('internshipId').value;
    const payload = {
        student_id: document.getElementById('student_id').value,
        company_id: document.getElementById('company_id').value,
        role: document.getElementById('role').value,
        duration: document.getElementById('duration').value,
        type_of_organization: document.getElementById('type_of_organization').value
    };

    try {
        if (id) {
            const { error } = await window.apiService.update('internships', id, payload);
            if (error) throw error;
        } else {
            const { error } = await window.apiService.insert('internships', payload);
            if (error) throw error;
        }

        closeModal();
        await loadInternships();
    } catch (err) {
        alert("Error saving: " + err.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function deleteInternship(id) {
    if (confirm("Are you sure you want to delete this internship?")) {
        try {
            const { error } = await window.apiService.delete('internships', id);
            if (error) throw error;
            await loadInternships();
        } catch (err) {
            alert("Error deleting: " + err.message);
        }
    }
}
