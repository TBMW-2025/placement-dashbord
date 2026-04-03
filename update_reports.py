import re

with open("dashboard.html", "r") as f:
    dashboard = f.read()

with open("reports.html", "r") as f:
    reports = f.read()

sidebar_pattern = re.compile(r'<nav class="sidebar">.*?</nav>', re.DOTALL)
dashboard_sidebar = sidebar_pattern.search(dashboard).group(0)

# swap active class
dashboard_sidebar = dashboard_sidebar.replace('<a href="dashboard.html" class="active">', '<a href="dashboard.html">')
dashboard_sidebar = dashboard_sidebar.replace('<a href="reports.html">', '<a href="reports.html" class="active">')

reports = sidebar_pattern.sub(dashboard_sidebar, reports)

with open("reports.html", "w") as f:
    f.write(reports)
print("Updated reports.html sidebar!")
