// js/companies.js

let allCompanies = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadCompanies();

    document.getElementById('openAddModalBtn').addEventListener('click', openAddModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('companyForm').addEventListener('submit', handleSaveCompany);
    document.getElementById('searchInput').addEventListener('input', handleSearch);

    // Excel Events
    document.getElementById('openExcelModalBtn').addEventListener('click', () => {
        document.getElementById('excelForm').reset();
        document.getElementById('excelModal').classList.add('active');
    });
    document.getElementById('closeExcelModalBtn').addEventListener('click', () => {
        document.getElementById('excelModal').classList.remove('active');
    });
    document.getElementById('excelForm').addEventListener('submit', handleExcelUpload);
    document.getElementById('exportExcelBtn').addEventListener('click', handleExportExcel);
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
    const q = e.target.value.toLowerCase();
    const filtered = allCompanies.filter(c => c.company_name.toLowerCase().includes(q));
    renderTable(filtered);
}

function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Company';
    document.getElementById('companyForm').reset();
    document.getElementById('companyId').value = '';
    document.getElementById('companyModal').classList.add('active');
}

function editCompany(company) {
    document.getElementById('modalTitle').textContent = 'Edit Company';
    document.getElementById('companyId').value = company.id;
    document.getElementById('company_name').value = company.company_name;
    document.getElementById('role_offered').value = company.role_offered || '';
    document.getElementById('contact_person').value = company.contact_person || '';
    document.getElementById('contact_email').value = company.contact_email || '';
    document.getElementById('companyModal').classList.add('active');
}

function closeModal() {
    document.getElementById('companyModal').classList.remove('active');
}

async function handleSaveCompany(e) {
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

async function handleExcelUpload(e) {
    e.preventDefault();
    const btn = document.getElementById('uploadExcelBtn');
    const originalText = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span> Uploading...';
    btn.disabled = true;

    const fileInput = document.getElementById('excel_file');
    if (fileInput.files.length === 0) return;

    try {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const formattedPayload = jsonData.map(row => ({
                    company_name: row.company_name || row.Company || 'Unknown',
                    role_offered: row.role_offered || row.Role || null,
                    contact_person: row.contact_person || row.Contact || null,
                    contact_email: row.contact_email || row.Email || null
                }));

                const { error } = await window.apiService.supabase.from('companies').insert(formattedPayload);
                if (error) throw error;

                alert("Companies successfully imported!");
                document.getElementById('excelModal').classList.remove('active');
                await loadCompanies();
            } catch (err) {
                alert("Processing Error: " + err.message);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        };
        reader.readAsArrayBuffer(file);
    } catch (err) {
        alert("Upload Error: " + err.message);
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function handleExportExcel() {
    if (allCompanies.length === 0) {
        alert("No companies to export!");
        return;
    }
    
    const exportData = allCompanies.map(c => ({
        "Company Name": c.company_name || '',
        "Role Offered": c.role_offered || '',
        "Contact Person": c.contact_person || '',
        "Contact Email": c.contact_email || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Companies");
    
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Companies_Export_${timestamp}.xlsx`);
}
