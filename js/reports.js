// js/reports.js

document.addEventListener('DOMContentLoaded', async () => {
    await loadReportData();
});

async function loadReportData() {
    try {
        const [
            { data: students },
            { data: mappedPlacements }
        ] = await Promise.all([
            window.apiService.fetchAll('students'),
            window.apiService.fetchPlacements()
        ]);

        if (!students || !mappedPlacements) return;

        // KPI Calculations
        const totalStudents = students.length || 1; // avoid division by zero
        const placedStudents = mappedPlacements.filter(p => p.status === 'Placed');
        
        const placementRate = ((placedStudents.length / totalStudents) * 100).toFixed(1);
        document.getElementById('placementRate').textContent = `${placementRate}%`;

        let totalSalary = 0;
        let countSalary = 0;
        placedStudents.forEach(p => {
            if (p.salary) {
                totalSalary += parseFloat(p.salary);
                countSalary++;
            }
        });
        const avg = countSalary > 0 ? (totalSalary / countSalary).toFixed(2) : 0;
        document.getElementById('avgSalary').textContent = `₹${avg} LPA`;

        // Charts
        setupSalaryChart(placedStudents);
        setupProgrammeChart(placedStudents);

    } catch (err) {
        console.error("Error generating reports:", err);
    }
}

function setupSalaryChart(placedStudents) {
    const bins = {
        '< 3 LPA': 0,
        '3 - 5 LPA': 0,
        '5 - 8 LPA': 0,
        '> 8 LPA': 0
    };

    placedStudents.forEach(p => {
        if (!p.salary) return;
        const s = parseFloat(p.salary);
        if (s < 3) bins['< 3 LPA']++;
        else if (s >= 3 && s <= 5) bins['3 - 5 LPA']++;
        else if (s > 5 && s <= 8) bins['5 - 8 LPA']++;
        else bins['> 8 LPA']++;
    });

    const ctx = document.getElementById('salaryChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(bins),
            datasets: [{
                data: Object.values(bins),
                backgroundColor: ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'],
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
}

function setupProgrammeChart(placedStudents) {
    const counts = {};
    placedStudents.forEach(p => {
        const prog = p.students?.programme || 'Unknown';
        counts[prog] = (counts[prog] || 0) + 1;
    });

    const ctx = document.getElementById('programmeChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(counts),
            datasets: [{
                label: 'Placed Students',
                data: Object.values(counts),
                backgroundColor: '#3b82f6',
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
