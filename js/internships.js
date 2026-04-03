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

    data.forEach((intern, i) => {
        const srNo = i + 1;
        
        // Extract basic data (since gender & place 02 are missing from schema, use placeholders)
        const yearObj = new Date(intern.created_at).getFullYear() || '-';
        const enrollment = intern.students?.enrollment_number || '-';
        const programme = intern.students?.programme || '-';
        const name = intern.students?.student_name || 'N/A';
        const gender = '-'; // Placeholder
        const place1 = intern.companies?.company_name || 'N/A';
        const place2 = '-'; // Placeholder
        const typeOrg = intern.type_of_organization || '-';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color:var(--text-secondary);">${srNo}</td>
            <td style="color:var(--text-secondary);">${yearObj}</td>
            <td style="color:var(--text-secondary);">${enrollment}</td>
            <td style="color:var(--text-secondary);">${programme}</td>
            <td style="font-weight:500;">${name}</td>
            <td style="color:var(--text-secondary);">${gender}</td>
            <td style="color:var(--text-secondary);">${place1}</td>
            <td style="color:var(--text-secondary);">${place2}</td>
            <td style="color:var(--text-secondary);">${typeOrg}</td>
            <td>
                <img src="https://cdn-icons-png.flaticon.com/512/1159/1159633.png" alt="Edit" style="width:16px; cursor:pointer; filter:invert(0.5); margin-right:8px;" onclick='editInternship(${JSON.stringify(intern).replace(/'/g, "&apos;")})'>
                <img src="https://cdn-icons-png.flaticon.com/512/3096/3096673.png" alt="Delete" style="width:16px; cursor:pointer; filter:invert(0.5);" onclick="deleteInternship('${intern.id}')">
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

async function handleExcelUpload(e) {
    e.preventDefault();
    const btn = document.getElementById('uploadExcelBtn');
    const originalText = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span> Parsing...';
    btn.disabled = true;

    const fileInput = document.getElementById('excel_file');
    if (fileInput.files.length === 0) return;

    try {
        // Fetch all students and companies for lookup
        const [{ data: dbStudents }, { data: dbCompanies }] = await Promise.all([
            window.apiService.fetchAll('students'),
            window.apiService.fetchAll('companies')
        ]);

        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                let skipped = 0;
                const formattedPayload = [];

                for (const row of jsonData) {
                    // Try to resolve student
                    const sName = String(row.student_name || row.Student || '').toLowerCase().trim();
                    const sEnroll = String(row.enrollment_number || row.Enrollment || '').trim();
                    const student = dbStudents.find(s => 
                        (s.student_name.toLowerCase().trim() === sName && sName !== '') || 
                        (s.enrollment_number === sEnroll && sEnroll !== '')
                    );

                    // Try to resolve company
                    const cName = String(row.company_name || row.Company || '').toLowerCase().trim();
                    const company = dbCompanies.find(c => c.company_name.toLowerCase().trim() === cName && cName !== '');

                    if (!student || !company) {
                        skipped++;
                        continue;
                    }

                    formattedPayload.push({
                        student_id: student.id,
                        company_id: company.id,
                        role: row.role || row.Role || null,
                        duration: row.duration || row.Duration || null,
                        type_of_organization: row.type_of_organization || row.Type || null
                    });
                }

                if (formattedPayload.length === 0) {
                    alert(`No valid rows mapped! Skipped ${skipped} rows due to unmatched Student Name/Enrollment or Company Name.`);
                    return;
                }

                const { error } = await window.apiService.supabase.from('internships').insert(formattedPayload);
                if (error) throw error;

                alert(`Successfully imported ${formattedPayload.length} internships. Skipped ${skipped} unmapped rows.`);
                document.getElementById('excelModal').classList.remove('active');
                await loadInternships();
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
    if (allInternships.length === 0) {
        alert("No internships to export!");
        return;
    }
    
    const exportData = allInternships.map(i => {
        const yearObj = new Date(i.created_at).getFullYear() || '-';
        return {
            "Year": yearObj,
            "Enrollment No": i.students?.enrollment_number || '-',
            "Programme": i.students?.programme || '-',
            "Name of Student": i.students?.student_name || 'N/A',
            "Internship Place": i.companies?.company_name || 'N/A',
            "Type of Organization": i.type_of_organization || '-',
            "Role Fixed": i.role || '-',
            "Duration": i.duration || '-'
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Internships");
    
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Internships_Export_${timestamp}.xlsx`);
}
