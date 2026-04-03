import os

# Re-inject the event listeners and the Excel modal functions
# 1. companies.js
with open('js/companies.js', 'r') as f:
    comps = f.read()

events_str = """
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
"""

if "openExcelModalBtn" not in comps:
    comps = comps.replace("document.getElementById('searchInput').addEventListener('input', handleSearch);", "document.getElementById('searchInput').addEventListener('input', handleSearch);" + events_str)

funcs_str_companies = """
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
"""

if "handleExcelUpload" not in comps:
    comps = comps + funcs_str_companies

with open('js/companies.js', 'w') as f:
    f.write(comps)


# 2. internships.js
with open('js/internships.js', 'r') as f:
    inter = f.read()

if "openExcelModalBtn" not in inter:
    inter = inter.replace("document.getElementById('searchInput').addEventListener('input', handleSearch);", "document.getElementById('searchInput').addEventListener('input', handleSearch);" + events_str)

funcs_str_inter = """
async function handleExcelUpload(e) {
    e.preventDefault();
    const btn = document.getElementById('uploadExcelBtn');
    const originalText = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span> Parsing...';
    btn.disabled = true;

    const fileInput = document.getElementById('excel_file');
    if (fileInput.files.length === 0) return;

    try {
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
                    const sName = String(row.student_name || row.Student || '').toLowerCase().trim();
                    const sEnroll = String(row.enrollment_number || row.Enrollment || '').trim();
                    const student = dbStudents.find(s => 
                        (s.student_name.toLowerCase().trim() === sName && sName !== '') || 
                        (s.enrollment_number === sEnroll && sEnroll !== '')
                    );

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
"""

if "handleExcelUpload" not in inter:
    inter = inter + funcs_str_inter

with open('js/internships.js', 'w') as f:
    f.write(inter)


# 3. placements.js
with open('js/placements.js', 'r') as f:
    place = f.read()

if "openExcelModalBtn" not in place:
    place = place.replace("document.getElementById('searchInput').addEventListener('input', handleSearch);", "document.getElementById('searchInput').addEventListener('input', handleSearch);" + events_str)

funcs_str_place = """
async function handleExcelUpload(e) {
    e.preventDefault();
    const btn = document.getElementById('uploadExcelBtn');
    const originalText = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span> Parsing...';
    btn.disabled = true;

    const fileInput = document.getElementById('excel_file');
    if (fileInput.files.length === 0) return;

    try {
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
                    const sName = String(row.student_name || row.Student || '').toLowerCase().trim();
                    const sEnroll = String(row.enrollment_number || row.Enrollment || '').trim();
                    const student = dbStudents.find(s => 
                        (s.student_name.toLowerCase().trim() === sName && sName !== '') || 
                        (s.enrollment_number === sEnroll && sEnroll !== '')
                    );

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
                        salary: row.salary ? parseFloat(row.salary) : null,
                        placement_date: row.placement_date || null,
                        status: row.status || row.Status || 'Placed'
                    });
                }

                if (formattedPayload.length === 0) {
                    alert(`No valid rows mapped! Skipped ${skipped} rows due to unmatched Student Name/Enrollment or Company Name.`);
                    return;
                }

                const { error } = await window.apiService.supabase.from('placements').insert(formattedPayload);
                if (error) throw error;

                alert(`Successfully imported ${formattedPayload.length} placements. Skipped ${skipped} unmapped rows.`);
                document.getElementById('excelModal').classList.remove('active');
                await loadPlacements();
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
    if (allPlacements.length === 0) {
        alert("No placements to export!");
        return;
    }
    
    const exportData = allPlacements.map(p => {
        const dateStr = p.placement_date ? new Date(p.placement_date).toLocaleDateString() : '-';
        return {
            "Student Name": p.students?.student_name || 'N/A',
            "Enrollment Number": p.students?.enrollment_number || '',
            "Company Name": p.companies?.company_name || 'N/A',
            "Role": p.role || '-',
            "Salary (LPA)": p.salary || '-',
            "Placement Date": dateStr,
            "Status": p.status || 'Placed'
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Placements");
    
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Placements_Export_${timestamp}.xlsx`);
}
"""

if "handleExcelUpload" not in place:
    place = place + funcs_str_place

with open('js/placements.js', 'w') as f:
    f.write(place)


# 4. field_visits.js
with open('js/field_visits.js', 'r') as f:
    fv = f.read()

fv_events_str = """
    if(document.getElementById('openExcelModalBtn')) {
        document.getElementById('openExcelModalBtn').addEventListener('click', () => {
            document.getElementById('excelForm').reset();
            document.getElementById('excelModal').classList.add('active');
        });
        document.getElementById('closeExcelModalBtn').addEventListener('click', () => {
            document.getElementById('excelModal').classList.remove('active');
        });
        document.getElementById('excelForm').addEventListener('submit', handleExcelUpload);
        document.getElementById('exportExcelBtn').addEventListener('click', handleExportExcel);
    }
"""

if "openExcelModalBtn" not in fv:
    fv = fv.replace("if(visitForm) visitForm.addEventListener('submit', handleFormSubmit);", "if(visitForm) visitForm.addEventListener('submit', handleFormSubmit);" + fv_events_str)

funcs_str_fv = """
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
"""

if "handleExcelUpload" not in fv:
    fv = fv + funcs_str_fv

with open('js/field_visits.js', 'w') as f:
    f.write(fv)

# 5. osint.js
with open('js/osint.js', 'r') as f:
    osint = f.read()

if "openExcelModalBtn" not in osint:
    osint = osint.replace("if(visitForm) visitForm.addEventListener('submit', handleFormSubmit);", "if(visitForm) visitForm.addEventListener('submit', handleFormSubmit);" + fv_events_str)

funcs_str_osint = """
async function handleExcelUpload(e) {
    e.preventDefault();
    alert("OSINT Database schema is not yet deployed. Import will be available soon!");
    const btn = document.getElementById('uploadExcelBtn');
    btn.innerHTML = 'Parse and Import';
    btn.disabled = false;
}

function handleExportExcel() {
    alert("OSINT Database schema is not yet deployed. Export will be available soon!");
}
"""

if "handleExcelUpload" not in osint:
    osint = osint + funcs_str_osint

with open('js/osint.js', 'w') as f:
    f.write(osint)

print("Done injecting JS scripts!")
