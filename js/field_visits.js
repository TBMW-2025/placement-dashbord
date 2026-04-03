// js/companies.js

let allCompanies = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadCompanies();

    document.getElementById('openAddModalBtn').addEventListener('click', openAddModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('companyForm').addEventListener('submit', handleSaveCompany);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
});

async function loadCompanies() {
    const tbody = document.getElementById('companiesBody');
    try {
        const { data, error } = await window.apiService.fetchAll('companies');
        if (error) throw error;
        
        allCompanies = data || [];
        renderTable(allCompanies);
    } catch (err) {
        console.error("Error:", err);
        tbody.innerHTML = '<tr><td colspan="5" style="color:var(--accent-red);text-align:center;">Failed to load data.</td></tr>';
    }
}

function renderTable(data) {
    const tbody = document.getElementById('companiesBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No companies found.</td></tr>';
        return;
    }

    data.forEach((company, i) => {
        const srNo = i + 1;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color:var(--text-secondary);">${srNo}</td>
            <td style="font-weight:500;">${company.company_name}</td>
            <td style="color:var(--text-secondary);">${company.role_offered || '-'}</td>
            <td style="color:var(--text-secondary);">${company.contact_person || '-'}</td>
            <td style="color:var(--text-secondary);">${company.contact_email || '-'}</td>
            <td>
                <img src="https://cdn-icons-png.flaticon.com/512/1159/1159633.png" alt="Edit" style="width:16px; cursor:pointer; filter:invert(0.5); margin-right:8px;" onclick='editCompany(${JSON.stringify(company).replace(/'/g, "&apos;")})'>
                <img src="https://cdn-icons-png.flaticon.com/512/3096/3096673.png" alt="Delete" style="width:16px; cursor:pointer; filter:invert(0.5);" onclick="deleteCompany('${company.id}')">
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function handleSearch(e) {
        fieldVisitsBody.appendChild(tr);
    });
}

function openModal(visit = null) {
    document.getElementById('modalTitle').textContent = visit ? 'Edit Field Visit' : 'Add Field Visit';
    document.getElementById('visitId').value = visit ? visit.id : '';
    document.getElementById('location').value = visit ? visit.location : '';
    document.getElementById('visit_date').value = visit ? visit.visit_date : '';
    document.getElementById('purpose').value = visit ? visit.purpose : '';
    document.getElementById('participants').value = visit ? visit.participants : '';
    visitModal.classList.add('active');
}

function closeModal() {
    visitModal.classList.remove('active');
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('saveBtn');
    const originalText = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    const id = document.getElementById('companyId').value;
    const payload = {
        company_name: document.getElementById('company_name').value,
        role_offered: document.getElementById('role_offered').value,
        contact_person: document.getElementById('contact_person').value,
        contact_email: document.getElementById('contact_email').value
    };

    try {
        if (id) {
            const { error } = await window.apiService.update('companies', id, payload);
            if (error) throw error;
        } else {
            const { error } = await window.apiService.insert('companies', payload);
            if (error) throw error;
        }

        closeModal();
        await loadCompanies();
    } catch (err) {
        alert("Error saving: " + err.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function deleteCompany(id) {
    if (confirm("Are you sure? Associated placements and internships will be deleted.")) {
        try {
            const { error } = await window.apiService.delete('companies', id);
            if (error) throw error;
            await loadCompanies();
        } catch (err) {
            alert("Error deleting: " + err.message);
        }
    }
}
