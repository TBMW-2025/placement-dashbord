// js/placements.js

let allPlacements = [];

document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        loadPlacements(),
        populateDropdowns()
    ]);

    document.getElementById('openAddModalBtn').addEventListener('click', openAddModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('placementForm').addEventListener('submit', handleSavePlacement);
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

async function loadPlacements() {
    const tbody = document.getElementById('placementsBody');
    try {
        const { data, error } = await window.apiService.fetchPlacements();
        if (error) throw error;

        allPlacements = data || [];
        renderTable(allPlacements);
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
    const tbody = document.getElementById('placementsBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No placements found.</td></tr>';
        return;
    }

    data.forEach(item => {
        const statusBadge = item.status === 'Placed'
            ? '<span class="badge placed">Placed</span>'
            : '<span class="badge not-placed">Not Placed</span>';

        // Fix missing column by fetching from the joined table (students, companies)
        const studentName = item.students?.student_name || 'N/A';
        const enrollment = item.students?.enrollment_number || '';
        const companyName = item.companies?.company_name || 'N/A';
        const dateStr = item.placement_date ? new Date(item.placement_date).toLocaleDateString() : '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="font-weight:500;">${studentName}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary)">${enrollment}</div>
            </td>
            <td>${companyName}</td>
            <td>${item.role || '-'}</td>
            <td>${item.salary ? "₹" + item.salary + " LPA" : '-'}</td>
            <td>${dateStr}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem" onclick='editPlacement(${JSON.stringify(item).replace(/'/g, "&apos;")})'>Edit</button>
                <button class="btn btn-danger" style="padding:0.25rem 0.5rem; font-size:0.75rem" onclick="deletePlacement('${item.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function handleSearch(e) {
    const q = e.target.value.toLowerCase();
    const filtered = allPlacements.filter(p =>
        (p.students?.student_name?.toLowerCase().includes(q)) ||
        (p.companies?.company_name?.toLowerCase().includes(q))
    );
    renderTable(filtered);
}

function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Record Placement';
    document.getElementById('placementForm').reset();
    document.getElementById('placementId').value = '';
    document.getElementById('placementModal').classList.add('active');
}

function editPlacement(item) {
    document.getElementById('modalTitle').textContent = 'Edit Placement';
    document.getElementById('placementId').value = item.id;
    document.getElementById('student_id').value = item.student_id;
    document.getElementById('company_id').value = item.company_id;
    document.getElementById('role').value = item.role || '';
    document.getElementById('salary').value = item.salary || '';
    document.getElementById('placement_date').value = item.placement_date || '';
    document.getElementById('status').value = item.status || 'Placed';
    document.getElementById('placementModal').classList.add('active');
}

function closeModal() {
    document.getElementById('placementModal').classList.remove('active');
}

async function handleSavePlacement(e) {
    e.preventDefault();
    const btn = document.getElementById('saveBtn');
    const originalText = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    const id = document.getElementById('placementId').value;
    const sValue = document.getElementById('salary').value;

    const payload = {
        student_id: document.getElementById('student_id').value,
        company_id: document.getElementById('company_id').value,
        role: document.getElementById('role').value,
        salary: sValue ? parseFloat(sValue) : null,
        placement_date: document.getElementById('placement_date').value || null,
        status: document.getElementById('status').value
    };

    try {
        if (id) {
            const { error } = await window.apiService.update('placements', id, payload);
            if (error) throw error;
        } else {
            const { error } = await window.apiService.insert('placements', payload);
            if (error) throw error;
        }

        closeModal();
        await loadPlacements();
    } catch (err) {
        alert("Error saving: " + err.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function deletePlacement(id) {
    if (confirm("Are you sure you want to delete this placement record?")) {
        try {
            const { error } = await window.apiService.delete('placements', id);
            if (error) throw error;
            await loadPlacements();
        } catch (err) {
            alert("Error deleting: " + err.message);
        }
    }
}
