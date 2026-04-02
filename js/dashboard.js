// js/dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboardData();
});

async function loadDashboardData() {
    try {
        // Fetch data concurrently
        const [
            { data: students },
            { data: placements },
            { data: companies },
            { data: internships },
            { data: mappedPlacements }
        ] = await Promise.all([
            window.apiService.fetchAll('students'),
            window.apiService.fetchAll('placements'),
            window.apiService.fetchAll('companies'),
            window.apiService.fetchAll('internships'),
            window.apiService.fetchPlacements() // uses JOIN
        ]);

        if (!students || !placements) return;

        // Update KPIs
        document.getElementById('kpi-students').textContent = students.length || 0;
        
        const placedCount = placements.filter(p => p.status === 'Placed').length;
        document.getElementById('kpi-placed').textContent = placedCount;
        
        document.getElementById('kpi-companies').textContent = companies?.length || 0;
        document.getElementById('kpi-internships').textContent = internships?.length || 0;

        // Populate Recent Placements Table (using mapped data)
        const tbody = document.getElementById('recentPlacementsBody');
        tbody.innerHTML = '';
        
        if (mappedPlacements && mappedPlacements.length > 0) {
            // Show only top 5 recent
            const recent = mappedPlacements.slice(0, 5);
            recent.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div style="font-weight:500">${p.students?.student_name || 'N/A'}</div>
                        <div style="font-size:0.75rem; color:var(--text-secondary)">${p.students?.enrollment_number || ''}</div>
                    </td>
                    <td>${p.companies?.company_name || 'N/A'}</td>
                    <td>${p.role || '-'}</td>
                    <td>${p.salary ? '₹' + p.salary + ' LPA' : '-'}</td>
                    <td>${p.placement_date ? new Date(p.placement_date).toLocaleDateString() : '-'}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;">No recent placements found.</td></tr>';
        }

        // Setup Charts
        setupCharts(placements);

    } catch (err) {
        console.error("Error loading dashboard data:", err);
    }
}

function setupCharts(placements) {
    // 1. Status Chart
    const placedCount = placements.filter(p => p.status === 'Placed').length;
    const notPlacedCount = placements.length - placedCount;

    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Placed', 'Not Placed'],
            datasets: [{
                data: [placedCount, notPlacedCount],
                backgroundColor: ['#10b981', '#3b82f6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#f8fafc' } }
            }
        }
    });

    // 2. Trend Chart (Yearly)
    // Extract years from placement_date
    const yearlyData = {};
    placements.forEach(p => {
        if (p.placement_date && p.status === 'Placed') {
            const year = new Date(p.placement_date).getFullYear();
            yearlyData[year] = (yearlyData[year] || 0) + 1;
        }
    });

    const years = Object.keys(yearlyData).sort();
    const counts = years.map(y => yearlyData[y]);

    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    new Chart(ctxTrend, {
        type: 'bar',
        data: {
            labels: years.length > 0 ? years : ['2023', '2024'], // Fallback labels if empty
            datasets: [{
                label: 'Placements',
                data: counts.length > 0 ? counts : [0, 0],
                backgroundColor: '#8b5cf6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
