const fieldVisitsBody = document.getElementById('fieldVisitsBody');
const searchInput = document.getElementById('searchInput');
const visitModal = document.getElementById('visitModal');
const openAddModalBtn = document.getElementById('openAddModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const visitForm = document.getElementById('visitForm');
let fieldVisitsData = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchFieldVisits();

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = fieldVisitsData.filter(v =>
                (v.location && v.location.toLowerCase().includes(term)) ||
                (v.purpose && v.purpose.toLowerCase().includes(term))
            );
            renderTable(filtered);
        });
    }

    if (openAddModalBtn) openAddModalBtn.addEventListener('click', () => openModal());
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (visitForm) visitForm.addEventListener('submit', handleFormSubmit);
});

async function fetchFieldVisits() {
    if (security.localBypass) {
        fieldVisitsData = [];
        renderTable([]);
        return;
    }

    try {
        const { data, error } = await supabase
            .from('field_visits')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        fieldVisitsData = data || [];
        renderTable(fieldVisitsData);
    } catch (error) {
        console.error('Error fetching field visits:', error);
        if (fieldVisitsBody) fieldVisitsBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--accent-red)">Failed to load data</td></tr>`;
    }
}

function renderTable(data) {
    if (!fieldVisitsBody) return;
    fieldVisitsBody.innerHTML = '';

    if (data.length === 0) {
        fieldVisitsBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-secondary)">No field visits found</td></tr>`;
        return;
    }

    data.forEach((fv, i) => {
        const srNo = i + 1;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color:var(--text-secondary);">${srNo}</td>
            <td style="font-weight:500;">${fv.location || 'N/A'}</td>
            <td style="color:var(--text-secondary);">${fv.visit_date || '-'}</td>
            <td style="color:var(--text-secondary);">${fv.purpose || '-'}</td>
            <td style="color:var(--text-secondary);">${fv.participants || '-'}</td>
            <td>
                <img src="https://cdn-icons-png.flaticon.com/512/3096/3096673.png" alt="Delete" style="width:16px; cursor:pointer; filter:invert(0.5);" onclick="deleteVisit('${fv.id}')">
            </td>
        `;
        fieldVisitsBody.appendChild(tr);
    });
}

function openModal(visit = null) {
    const isEdit = visit !== null;
    document.getElementById('modalTitle').textContent = isEdit ? 'Edit Visit' : 'Add Visit';

    if (isEdit) {
        document.getElementById('visitId').value = visit.id;
        document.getElementById('location').value = visit.location || '';
        document.getElementById('visit_date').value = visit.visit_date || '';
        document.getElementById('purpose').value = visit.purpose || '';
        document.getElementById('participants').value = visit.participants || '';
    } else {
        visitForm.reset();
        document.getElementById('visitId').value = '';
    }

    visitModal.classList.add('active');
}

function closeModal() {
    visitModal.classList.remove('active');
    visitForm.reset();
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const visitId = document.getElementById('visitId').value;
    const isEdit = !!visitId;

    const visitData = {
        location: document.getElementById('location').value,
        visit_date: document.getElementById('visit_date').value,
        purpose: document.getElementById('purpose').value,
        participants: document.getElementById('participants').value || 0
    };

    if (security.localBypass) {
        alert("Demo Mode: Field Visits cannot be saved offline.");
        closeModal();
        return;
    }

    try {
        let error;
        if (isEdit) {
            const { error: updateError } = await supabase
                .from('field_visits')
                .update(visitData)
                .eq('id', visitId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('field_visits')
                .insert([visitData]);
            error = insertError;
        }

        if (error) throw error;
        closeModal();
        fetchFieldVisits();
    } catch (error) {
        console.error('Error saving field visit:', error);
        alert('Failed to save field visit.');
    }
}

async function deleteVisit(id) {
    if (security.localBypass) {
        alert("Demo Mode: Data cannot be deleted.");
        return;
    }

    if (!confirm('Are you sure you want to delete this visit?')) return;

    try {
        const { error } = await supabase
            .from('field_visits')
            .delete()
            .eq('id', id);

        if (error) throw error;
        fetchFieldVisits();
    } catch (error) {
        console.error('Error deleting visit:', error);
        alert('Failed to delete field visit.');
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
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const formattedPayload = jsonData.map(row => ({
                    location: row.location || row.Location || 'Unknown',
                    visit_date: row.visit_date || row.Date || null,
                    purpose: row.purpose || row.Purpose || null,
                    participants: row.participants ? parseInt(row.participants) : 0
                }));

                const { error } = await supabase.from('field_visits').insert(formattedPayload);
                if (error) throw error;

                alert("Field visits successfully imported!");
                document.getElementById('excelModal').classList.remove('active');
                fetchFieldVisits();
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
    if (fieldVisitsData.length === 0) {
        alert("No field visits to export!");
        return;
    }
    
    const exportData = fieldVisitsData.map(v => {
        const dateStr = v.visit_date ? new Date(v.visit_date).toLocaleDateString() : '-';
        return {
            "Location": v.location || '',
            "Date": dateStr,
            "Purpose": v.purpose || '',
            "Participants": v.participants || 0
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Field Visits");
    
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `FieldVisits_Export_${timestamp}.xlsx`);
}
