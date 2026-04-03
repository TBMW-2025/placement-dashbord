// js/students.js

let allStudents = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadStudents();

    // Modal Events
    document.getElementById('openAddModalBtn').addEventListener('click', openAddModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('studentForm').addEventListener('submit', handleSaveStudent);
    document.getElementById('searchInput').addEventListener('input', handleSearch);

    // Excel Modal Events
    document.getElementById('openExcelModalBtn').addEventListener('click', () => {
        document.getElementById('excelForm').reset();
        document.getElementById('excelModal').classList.add('active');
    });
    document.getElementById('closeExcelModalBtn').addEventListener('click', () => {
        document.getElementById('excelModal').classList.remove('active');
    });
    document.getElementById('excelForm').addEventListener('submit', handleExcelUpload);
});

async function loadStudents() {
    const tbody = document.getElementById('studentsBody');
    try {
        const { data, error } = await window.apiService.fetchAll('students');
        if (error) throw error;
        
        allStudents = data || [];
        renderTable(allStudents);
    } catch (err) {
        console.error("Error loading students:", err);
        tbody.innerHTML = '<tr><td colspan="7" style="color:var(--accent-red);text-align:center;">Failed to load data.</td></tr>';
    }
}

function renderTable(data) {
    const tbody = document.getElementById('studentsBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No students found.</td></tr>';
        return;
    }

    data.forEach((student, i) => {
        const srNo = i + 1;
        // Check if placed from external list or logic? The schema doesn't have placed_or_not
        // Let's use a placeholder 'Pending' or rely on some join later
        const placedBadge = '<span style="color:var(--text-secondary)">Pending</span>';
            
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color:var(--text-secondary);">${srNo}</td>
            <td style="font-weight:500;">${student.student_name || 'N/A'}</td>
            <td style="color:var(--text-secondary);">${student.enrollment_number || '-'}</td>
            <td style="color:var(--text-secondary);">${student.email || '-'}</td>
            <td style="color:var(--text-secondary);">${student.mobile || '-'}</td>
            <td style="color:var(--text-secondary);">${student.programme || '-'}</td>
            <td style="color:var(--text-secondary);">${student.higher_education ? 'Yes' : 'No'}</td>
            <td>${placedBadge}</td>
            <td>
                <img src="https://cdn-icons-png.flaticon.com/512/1159/1159633.png" alt="Edit" style="width:16px; cursor:pointer; filter:invert(0.5); margin-right:8px;" onclick='editStudent(${JSON.stringify(student).replace(/'/g, "&apos;")})'>
                <img src="https://cdn-icons-png.flaticon.com/512/3096/3096673.png" alt="Delete" style="width:16px; cursor:pointer; filter:invert(0.5);" onclick="deleteStudent('${student.id}')">
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function handleSearch(e) {
    const q = e.target.value.toLowerCase();
    const filtered = allStudents.filter(s => 
        s.student_name.toLowerCase().includes(q) || 
        s.enrollment_number.toLowerCase().includes(q)
    );
    renderTable(filtered);
}

function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Student';
    document.getElementById('studentForm').reset();
    document.getElementById('studentId').value = '';
    document.getElementById('existing_resume').innerHTML = '';
    document.getElementById('studentModal').classList.add('active');
}

function editStudent(student) {
    document.getElementById('modalTitle').textContent = 'Edit Student';
    document.getElementById('studentId').value = student.id;
    document.getElementById('enrollment_number').value = student.enrollment_number;
    document.getElementById('student_name').value = student.student_name;
    document.getElementById('programme').value = student.programme || '';
    document.getElementById('email').value = student.email || '';
    document.getElementById('mobile').value = student.mobile || '';
    document.getElementById('higher_education').value = student.higher_education ? "true" : "false";

    const resumeDiv = document.getElementById('existing_resume');
    if (student.resume_url) {
        resumeDiv.innerHTML = `Current: <a href="${student.resume_url}" target="_blank" style="color:var(--accent-blue);">View Resume</a>. Upload new to replace.`;
    } else {
        resumeDiv.innerHTML = '';
    }

    document.getElementById('studentModal').classList.add('active');
}

function closeModal() {
    document.getElementById('studentModal').classList.remove('active');
}

async function handleSaveStudent(e) {
    e.preventDefault();
    const btn = document.getElementById('saveBtn');
    const originalText = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    const id = document.getElementById('studentId').value;
    const fileInput = document.getElementById('resume_file');
    
    let resumeUrlStr = null;

    try {
        // Upload file if selected
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await window.apiService.uploadFile('resumes', filePath, file);
            if (uploadError) throw uploadError;

            resumeUrlStr = window.apiService.getPublicUrl('resumes', filePath);
        }

        const payload = {
            enrollment_number: document.getElementById('enrollment_number').value,
            student_name: document.getElementById('student_name').value,
            programme: document.getElementById('programme').value,
            email: document.getElementById('email').value,
            mobile: document.getElementById('mobile').value,
            higher_education: document.getElementById('higher_education').value === 'true'
        };

        if (resumeUrlStr) {
            payload.resume_url = resumeUrlStr;
        }

        if (id) {
            const { error } = await window.apiService.update('students', id, payload);
            if (error) throw error;
        } else {
            const { error } = await window.apiService.insert('students', payload);
            if (error) throw error;
        }

        closeModal();
        await loadStudents();
    } catch (err) {
        alert("Error saving: " + err.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function deleteStudent(id) {
    if (confirm("Are you sure you want to delete this student? Associated placements and internships will also be deleted.")) {
        try {
            const { error } = await window.apiService.delete('students', id);
            if (error) throw error;
            await loadStudents();
        } catch (err) {
            alert("Error deleting: " + err.message);
        }
    }
}

// Excel Upload Handler
async function handleExcelUpload(e) {
    e.preventDefault();
    const btn = document.getElementById('uploadExcelBtn');
    const originalText = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span> Uploading & Parsing...';
    btn.disabled = true;

    const fileInput = document.getElementById('excel_file');
    if (fileInput.files.length === 0) return;

    try {
        const file = fileInput.files[0];

        // 1. Upload raw excel file to Supabase Storage for auditing
        const fileName = `${Date.now()}_import.xlsx`;
        const { error: uploadError } = await window.apiService.uploadFile('excel_uploads', fileName, file);
        if (uploadError) console.warn("Failed to upload excel to storage:", uploadError);

        // 2. Parse the Excel file via SheetJS
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Get first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Map to strict Schema Payload
                const formattedPayload = jsonData.map(row => ({
                    student_name: row.student_name || row.StudentName || row.Name || 'Unknown',
                    enrollment_number: String(row.enrollment_number || row.Enrollment || Math.floor(Math.random() * 1000000)),
                    email: row.email || row.Email || null,
                    mobile: String(row.mobile || row.Mobile || ''),
                    programme: row.programme || row.Programme || null,
                    higher_education: String(row.higher_education).toLowerCase() === 'true'
                }));

                // 3. Batch Insert via Supabase array insert
                const { error: insertError } = await window.apiService.supabase.from('students').insert(formattedPayload);
                if (insertError) throw insertError;

                alert("Excel data successfully imported!");
                document.getElementById('excelModal').classList.remove('active');
                await loadStudents();
                
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
