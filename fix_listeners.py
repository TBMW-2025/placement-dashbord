import os

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

with open('js/field_visits.js', 'r') as f:
    fv = f.read()

if "document.getElementById('openExcelModalBtn')" not in fv:
    fv = fv.replace("if (visitForm) visitForm.addEventListener('submit', handleFormSubmit);", "if (visitForm) visitForm.addEventListener('submit', handleFormSubmit);" + fv_events_str)
    with open('js/field_visits.js', 'w') as f:
        f.write(fv)

with open('js/osint.js', 'r') as f:
    osint = f.read()
if "document.getElementById('openExcelModalBtn')" not in osint:
    osint = osint.replace("if (visitForm) visitForm.addEventListener('submit', handleFormSubmit);", "if (visitForm) visitForm.addEventListener('submit', handleFormSubmit);" + fv_events_str)
    with open('js/osint.js', 'w') as f:
        f.write(osint)

print("done")
