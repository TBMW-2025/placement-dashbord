import re
import os

pages = [
    {"name": "companies", "expected": "company_name, role_offered, contact_person, contact_email"},
    {"name": "internships", "expected": "student_name, company_name, role, duration, type_of_organization"},
    {"name": "placements", "expected": "student_name, company_name, role, salary, placement_date, status"},
    {"name": "field_visits", "expected": "location, visit_date, purpose, participants"},
    {"name": "osint", "expected": "title, company, location, source, url"},
    {"name": "students", "expected": "student_name, enrollment_number, email, mobile, programme, higher_education (TRUE/FALSE)"}
]

for page in pages:
    html_file = f"{page['name']}.html"
    js_file = f"js/{page['name']}.js"
    
    # 1. Update HTML
    if os.path.exists(html_file):
        with open(html_file, 'r') as f:
            html = f.read()
        
        # Add SheetJS script tag
        if 'xlsx.full.min.js' not in html:
            html = html.replace('</head>', '    <script src="https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js"></script>\n</head>')
        
        # Replace messy buttons with Standard Buttons
        # Find the gap block with buttons
        btn_block_re = re.compile(r'<div style="display: flex; gap: 1rem;">(.*?)<button class="btn"', re.DOTALL)
        
        def replace_buttons(match):
            buttons_html = """
                    <button class="btn btn-secondary" id="openExcelModalBtn">📤 Import Excel</button>
                    <button class="btn btn-secondary" id="exportExcelBtn">⬇️ Export to Excel</button>
                    <button class="btn" """
            return '<div style="display: flex; gap: 1rem;">' + buttons_html
            
        if 'openExcelModalBtn' not in html:
            html = re.sub(r'<div style="display: flex; gap: 1rem;">(?:.(?!<div style="display: flex; gap: 1rem;">))*?<button class="btn"', replace_buttons, html, flags=re.DOTALL)
        
        # Add Modal
        if 'id="excelModal"' not in html:
            modal_html = f"""
    <!-- Excel Import Modal -->
    <div class="modal" id="excelModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Import {page['name'].replace('_', ' ').title()} (Excel)</h3>
                <button class="close-btn" id="closeExcelModalBtn">&times;</button>
            </div>
            <form id="excelForm">
                <p style="color: var(--text-secondary); margin-bottom: 1rem; font-size: 0.875rem;">
                    Upload an .xlsx file. The parser expects strict columns: <br/><b>{page['expected']}</b>.
                </p>
                <div class="form-group">
                    <label>Upload .xlsx file</label>
                    <input type="file" id="excel_file" accept=".xlsx,.xls" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;" id="uploadExcelBtn">Parse and Import</button>
            </form>
        </div>
    </div>
"""
            html = html.replace('<script src="js/supabaseClient.js"></script>', modal_html + '\n    <script src="js/supabaseClient.js"></script>')

        with open(html_file, 'w') as f:
            f.write(html)
            
