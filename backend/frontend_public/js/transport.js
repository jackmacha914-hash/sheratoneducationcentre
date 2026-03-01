// transport.js
let transportPaymentsCache = [];

// 1️⃣ Add this function at the top of the file or anywhere outside DOMContentLoaded
async function loadBusesDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
        const res = await fetch('https://sheratoneducationcentre.onrender.com/api/transport/buses');
        const buses = await res.json();

        select.innerHTML = ''; // clear old options
        buses.forEach(bus => {
            const option = document.createElement('option');
            option.value = bus._id;
            option.text = `${bus.number} (${bus.plate})`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading buses:', err);
    }
}

async function loadRoutesDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
        const res = await fetch('https://sheratoneducationcentre.onrender.com/api/transport/routes');
        const routes = await res.json();

        select.innerHTML = ''; // clear old options
        routes.forEach(route => {
            const option = document.createElement('option');
            option.value = route._id;
            option.text = route.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading routes:', err);
    }
}
async function loadStudentsDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
        const res = await fetch('https://sheratoneducationcentre.onrender.com/api/students'); // adjust route if needed
        const students = await res.json();

        select.innerHTML = ''; // clear old options
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student._id;
            option.text = student.name; // use full name
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading students:', err);
    }
}



// transport.js
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = "https://sheratoneducationcentre.onrender.com/api/transport";

    // ---------------------------
// MODAL HANDLING
// ---------------------------
window.openTransportModal = function(id) {
    // Close all modals first
    document.querySelectorAll('.transport-modal').forEach(m => m.style.display = 'none');

    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = 'flex';

    // Populate dropdowns depending on modal
    if (id === 'routeModal') loadBusesDropdown('route-bus');
    if (id === 'driverModal') loadBusesDropdown('driver-bus');
    if (id === 'studentTransportModal') {
        loadBusesDropdown('student-bus');
        loadRoutesDropdown('student-route');
        loadStudentsDropdown('student-id');
    }
  if (id === 'paymentsModal') {
    loadStudentsDropdown('payment-student');
    loadRoutesDropdown('payment-route');

    // Populate filter dropdowns
    loadStudentsDropdown('filter-student');
    loadRoutesDropdown('filter-route');

    loadTransportPayments(true);
}
    if (id === 'feesModal') {
    loadRoutesDropdown('fees-route'); // or loadDropdown('fees-route','/api/transport/routes','name');
}
  if (id === 'attendanceModal') {
    loadRoutesDropdown('attendance-route');

    // When a route is selected, load its students and bus
    const routeSelect = document.getElementById('attendance-route');
    routeSelect.addEventListener('change', async function() {
        const routeId = this.value;
        if (routeId) {
            await loadAttendanceStudents(routeId);
        } else {
            document.getElementById('attendance-bus').value = '';
            document.querySelector('#attendance-table tbody').innerHTML = '';
        }
    });
}

};

// Close modal function
window.closeTransportModal = function(id) {
    const modal = document.getElementById(id);
    if(modal) modal.style.display = 'none';
};

// Close modal if clicked outside content
window.addEventListener('click', e => {
    if(e.target.classList.contains('transport-modal')) e.target.style.display = 'none';
});


    // ---------------------------
    // BUS FUNCTIONS
    // ---------------------------
    const busTableBody = document.querySelector('#bus-table tbody');

    async function loadBuses() {
        try {
            const res = await fetch(`${API_BASE}/buses`);
            const buses = await res.json();
            if(busTableBody) {
                busTableBody.innerHTML = buses.map(bus => `
                    <tr>
                        <td>${bus.number}</td>
                        <td>${bus.plate}</td>
                        <td>${bus.capacity}</td>
                        <td>${bus.status}</td>
                        <td>
                            <button onclick="editBus('${bus._id}')">Edit</button>
                            <button onclick="deleteBus('${bus._id}')">Delete</button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (err) {
            console.error("Error loading buses:", err);
        }
    }

    window.saveBus = async function() {
        const number = document.querySelector('#bus-number').value;
        const plate = document.querySelector('#bus-plate').value;
        const capacity = document.querySelector('#bus-capacity').value;
        const status = document.querySelector('#bus-status').value;

        try {
            await fetch(`${API_BASE}/buses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number, plate, capacity, status })
            });
            closeTransportModal('busModal');
            loadBuses();
        } catch (err) {
            console.error("Error saving bus:", err);
        }
    };

    window.deleteBus = async function(id) {
        if(!confirm('Are you sure you want to delete this bus?')) return;
        try {
            await fetch(`${API_BASE}/buses/${id}`, { method: 'DELETE' });
            loadBuses();
        } catch (err) {
            console.error("Error deleting bus:", err);
        }
    };

    window.editBus = async function(id) {
        const res = await fetch(`${API_BASE}/buses`);
        const buses = await res.json();
        const bus = buses.find(b => b._id === id);
        if(bus) {
            document.querySelector('#bus-number').value = bus.number;
            document.querySelector('#bus-plate').value = bus.plate;
            document.querySelector('#bus-capacity').value = bus.capacity;
            document.querySelector('#bus-status').value = bus.status;
            openTransportModal('busModal');
        }
    };

    // ---------------------------
    // ROUTES FUNCTIONS
    // ---------------------------
    async function loadRoutes() {
        try {
            const res = await fetch(`${API_BASE}/routes`);
            const routes = await res.json();
            const tbody = document.querySelector('#route-table tbody');
            if(tbody) {
                tbody.innerHTML = routes.map(r => `
                    <tr>
                        <td>${r.name}</td>
                        <td>${r.busId ? r.busId.number : '-'}</td>
                        <td>
                            <button onclick="editRoute('${r._id}')">Edit</button>
                            <button onclick="deleteRoute('${r._id}')">Delete</button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch(err) {
            console.error("Error loading routes:", err);
        }
    }

    window.saveRoute = async function() {
        const name = document.querySelector('#route-name').value;
        const busId = document.querySelector('#route-bus').value;
        try {
            await fetch(`${API_BASE}/routes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, busId })
            });
            closeTransportModal('routeModal');
            loadRoutes();
        } catch(err) { console.error(err); }
    };

    window.deleteRoute = async function(id) {
        if(!confirm('Delete this route?')) return;
        await fetch(`${API_BASE}/routes/${id}`, { method: 'DELETE' });
        loadRoutes();
    };


    // ---------------------------
    // DRIVER FUNCTIONS
    // ---------------------------
    async function loadDrivers() {
        try {
            const res = await fetch(`${API_BASE}/drivers`);
            const drivers = await res.json();
            const tbody = document.querySelector('#driver-table tbody');
            if(tbody) {
                tbody.innerHTML = drivers.map(d => `
                    <tr>
                        <td>${d.name}</td>
                        <td>${d.license}</td>
                        <td>${d.busId ? d.busId.number : '-'}</td>
                        <td>
                            <button onclick="editDriver('${d._id}')">Edit</button>
                            <button onclick="deleteDriver('${d._id}')">Delete</button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch(err) { console.error(err); }
    }

    window.saveDriver = async function() {
        const name = document.querySelector('#driver-name').value;
        const license = document.querySelector('#driver-license').value;
        const busId = document.querySelector('#driver-bus').value;
        try {
            await fetch(`${API_BASE}/drivers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, license, busId })
            });
            closeTransportModal('driverModal');
            loadDrivers();
        } catch(err) { console.error(err); }
    };

    window.deleteDriver = async function(id) {
        if(!confirm('Delete this driver?')) return;
        await fetch(`${API_BASE}/drivers/${id}`, { method: 'DELETE' });
        loadDrivers();
    }

    // ---------------------------
    // STUDENT TRANSPORT ASSIGNMENTS
    // ---------------------------
    async function loadStudentAssignments() {
        try {
            const res = await fetch(`${API_BASE}/assignments`);
            const assignments = await res.json();
            const tbody = document.querySelector('#student-transport-table tbody');
            if(tbody) {
                tbody.innerHTML = assignments.map(a => `
                    <tr>
                        <td>${a.studentId}</td>
                        <td>${a.busId ? a.busId.number : '-'}</td>
                        <td>${a.routeId ? a.routeId.name : '-'}</td>
                        <td>
                            <button onclick="deleteStudentAssignment('${a._id}')">Delete</button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch(err) { console.error(err); }
    }

    window.saveStudentAssignment = async function() {
        const studentId = document.querySelector('#student-id').value;
        const busId = document.querySelector('#student-bus').value;
        const routeId = document.querySelector('#student-route').value;

        try {
            await fetch(`${API_BASE}/assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, busId, routeId })
            });
            closeTransportModal('studentTransportModal');
            loadStudentAssignments();
        } catch(err) { console.error(err); }
    }

    window.deleteStudentAssignment = async function(id) {
        if(!confirm('Delete this assignment?')) return;
        await fetch(`${API_BASE}/assignments/${id}`, { method: 'DELETE' });
        loadStudentAssignments();
    }
    // ---------------------------
// TRANSPORT FEES
// ---------------------------

    // ---------------------------
// TRANSPORT PAYMENTS
// --------------------------

// ---------------------------

// ---------------------------
// MODAL HANDLING
// ---------------------------



// Close modal on click outside
window.addEventListener('click', e => {
    if (e.target.classList.contains('transport-modal')) e.target.style.display = 'none';
});



// ---------------------------
// LOAD TRANSPORT PAYMENTS WITH GROUPING BY YEAR → TERM
// ---------------------------
async function loadTransportPayments(forceReload = false) {
    if (forceReload || transportPaymentsCache.length === 0) {
        const res = await fetch('/api/transport/payments');
        transportPaymentsCache = await res.json();
    }

    const tbody = document.querySelector('#payment-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Filters
    const termFilter = document.getElementById('filter-term')?.value;
    const yearFilter = document.getElementById('filter-year')?.value;
    const studentFilter = document.getElementById('filter-student')?.value;
    const routeFilter = document.getElementById('filter-route')?.value;

    // Filter payments
    let payments = transportPaymentsCache.filter(p =>
        (!termFilter || p.term === termFilter) &&
        (!yearFilter || String(p.year) === yearFilter) &&
        (!studentFilter || p.studentId === studentFilter) &&
        (!routeFilter || p.routeId === routeFilter)
    );

    // Maps for dropdown names
    const studentMap = {};
    document.getElementById('payment-student')?.querySelectorAll('option').forEach(o => { if (o.value) studentMap[o.value] = o.text; });
    const routeMap = {};
    document.getElementById('payment-route')?.querySelectorAll('option').forEach(o => { if (o.value) routeMap[o.value] = o.text; });

    // Group by year → term → student
    const grouped = {};
    payments.forEach(p => {
        const year = p.year;
        const term = p.term;
        const student = p.studentId;

        if (!grouped[year]) grouped[year] = {};
        if (!grouped[year][term]) grouped[year][term] = {};
        if (!grouped[year][term][student]) grouped[year][term][student] = [];

        grouped[year][term][student].push(p);
    });

    // Render table
     
// ---------------------------
// TRANSPORT FEES
// ---------------------------
window.saveFee = async function () {
    const routeId = document.getElementById('fees-route').value;
    const amount = document.getElementById('fees-amount').value;

    if (!routeId || !amount) {
        alert('Please select a route and enter fee amount');
        return;
    }

    try {
        await fetch(`${API_BASE}/fees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ routeId, amount })
        });

        closeTransportModal('feesModal');
        alert('Transport fee saved successfully');
    } catch (err) {
        console.error('Error saving fee:', err);
        alert('Failed to save fee');
    }
};

    // ---------------------------
// TRANSPORT PAYMENTS
// --------------------------

// ---------------------------
// UTILITY FUNCTIONS
// ---------------------------
async function loadDropdown(selectId, apiEndpoint, labelField) {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
        const res = await fetch(apiEndpoint);
        const items = await res.json();

        select.innerHTML = `<option value="">Select</option>`;
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item._id;
            option.text = item[labelField];
            select.appendChild(option);
        });
    } catch (err) {
        console.error(`Error loading ${selectId}:`, err);
    }
}

async function filterStudentsByClass(className) {
    const studentSelect = document.getElementById('payment-student');
    if (!studentSelect) return;

    const res = await fetch('/api/students');
    const students = await res.json();

    studentSelect.innerHTML = `<option value="">Select Student</option>`;
    students
        .filter(s => s.class === className)
        .forEach(s => {
            const option = document.createElement('option');
            option.value = s._id;
            option.text = s.name;
            studentSelect.appendChild(option);
        });
}


// ---------------------------
// MODAL HANDLING
// ---------------------------




// Close modal on click outside
window.addEventListener('click', e => {
    if (e.target.classList.contains('transport-modal')) e.target.style.display = 'none';
});

// ---------------------------
// TRANSPORT PAYMENTS LOGIC
// ---------------------------
window.saveTransportPayment = async function() {
    const studentId = document.getElementById('payment-student').value;
    const routeId = document.getElementById('payment-route').value;
    const amount = document.getElementById('payment-amount').value;
    const term = document.getElementById('payment-term').value;
    const year = document.getElementById('payment-year').value;
    const method = document.getElementById('payment-method').value;

    if (!studentId || !routeId || !amount || !term || !year || !method) {
        alert('Please fill all payment fields');
        return;
    }

    try {
        const payload = {
            studentId,
            routeId,
            amount: Number(amount),
            term,
            year: Number(year),
            method
        };

        console.log("Payload sent:", payload);

        await fetch('/api/transport/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        alert('Payment saved successfully');
        loadTransportPayments(true);
    } catch (err) {
        console.error('Backend error:', err);
        alert('Failed to save payment');
    }
};

window.deleteTransportPayment = async function(id) {
    if (!confirm('Delete this payment?')) return;
    try {
        await fetch(`/api/transport/payments/${id}`, { method: 'DELETE' });
        loadTransportPayments(true);
    } catch (err) {
        console.error('Error deleting payment:', err);
    }
};

// ---------------------------
// LOAD TRANSPORT PAYMENTS WITH GROUPING BY YEAR → TERM
// ---------------------------
async function loadTransportPayments(forceReload = false) {
    if (forceReload || transportPaymentsCache.length === 0) {
        const res = await fetch('/api/transport/payments');
        transportPaymentsCache = await res.json();
    }

    const tbody = document.querySelector('#payment-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Filters
    const termFilter = document.getElementById('filter-term')?.value;
    const yearFilter = document.getElementById('filter-year')?.value;
    const studentFilter = document.getElementById('filter-student')?.value;
    const routeFilter = document.getElementById('filter-route')?.value;

    // Filter payments
    let payments = transportPaymentsCache.filter(p =>
        (!termFilter || p.term === termFilter) &&
        (!yearFilter || String(p.year) === yearFilter) &&
        (!studentFilter || p.studentId === studentFilter) &&
        (!routeFilter || p.routeId === routeFilter)
    );

    // Maps for dropdown names
    const studentMap = {};
    document.getElementById('payment-student')?.querySelectorAll('option').forEach(o => { if (o.value) studentMap[o.value] = o.text; });
    const routeMap = {};
    document.getElementById('payment-route')?.querySelectorAll('option').forEach(o => { if (o.value) routeMap[o.value] = o.text; });

    // Group by year → term → student
    const grouped = {};
    payments.forEach(p => {
        const year = p.year;
        const term = p.term;
        const student = p.studentId;

        if (!grouped[year]) grouped[year] = {};
        if (!grouped[year][term]) grouped[year][term] = {};
        if (!grouped[year][term][student]) grouped[year][term][student] = [];

        grouped[year][term][student].push(p);
    });

    // Render table
   // 1️⃣ Fetch fees once
const feesRes = await fetch('/api/transport/fees');
const feesCache = await feesRes.json(); // [{ routeId: {_id,name}, amount }]

// 2️⃣ Create routeId → fee map
const routeFeeMap = {};
feesCache.forEach(f => {
    routeFeeMap[f.routeId._id] = f.amount;
});

// 3️⃣ Render table with balances
Object.keys(grouped).sort((a,b)=>b-a).forEach(year => {
    const yearRow = document.createElement('tr');
    yearRow.innerHTML = `<td colspan="10" style="font-weight:bold;background:#eee;">Year: ${year}</td>`;
    tbody.appendChild(yearRow);

    Object.keys(grouped[year]).forEach(term => {
        const termRow = document.createElement('tr');
        termRow.innerHTML = `<td colspan="10" style="font-weight:bold;background:#f9f9f9;">Term: ${term}</td>`;
        tbody.appendChild(termRow);

        Object.keys(grouped[year][term]).forEach(studentId => {
            const studentPayments = grouped[year][term][studentId];

            // Compute total paid per route for this student in this term/year
            const routeTotals = {};
            studentPayments.forEach(p => {
                if (!routeTotals[p.routeId]) routeTotals[p.routeId] = 0;
                routeTotals[p.routeId] += Number(p.amount);
            });

            let totalBalance = 0;

            studentPayments.forEach((p,index) => {
                const routeFee = routeFeeMap[p.routeId] || 0;
                const paid = routeTotals[p.routeId];
                const balance = Math.max(routeFee - paid, 0);
                totalBalance += balance;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${index === 0 ? studentMap[studentId] || studentId : ''}</td>
                    <td>${routeMap[p.routeId] || p.routeId}</td>
                    <td>${p.amount}</td>
                    <td>${p.method}</td>
                    <td>${p.term}</td>
                    <td>${p.year}</td>
                    <td>${balance}</td>
                    <td>${balance <= 0 ? 'Paid' : (paid>0 ? 'Partial' : 'Unpaid')}</td>
                    <td>${new Date(p.createdAt).toLocaleDateString()}</td>
                    <td><button onclick="deleteTransportPayment('${p._id}')">Delete</button></td>
                `;
                tbody.appendChild(tr);
            });

            const summaryRow = document.createElement('tr');
            summaryRow.innerHTML = `
                <td colspan="6" style="text-align:right;font-weight:bold;">Total Balance for Student:</td>
                <td colspan="4" style="font-weight:bold;">${totalBalance}</td>
            `;
            tbody.appendChild(summaryRow);
        });
    });
});
}

// Make globally accessible
window.loadTransportPayments = loadTransportPayments;

// ---------------------------
// FILTERS
// ---------------------------
['filter-term','filter-year','filter-student','filter-route'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('change', () => loadTransportPayments(false));
});

// Clear filters button
document.getElementById('clear-filters')?.addEventListener('click', () => {
    ['filter-term','filter-year','filter-student','filter-route'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
    loadTransportPayments(false);
});
}

// Make globally accessible
window.loadTransportPayments = loadTransportPayments;

// ---------------------------
// FILTERS
// ---------------------------

// Clear filters button
document.getElementById('clear-filters')?.addEventListener('click', () => {
    ['filter-term','filter-year','filter-student','filter-route'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
    loadTransportPayments(false);
});

    //------------------------------
    //TRANSPORT ATTENDANCE
    //------------------------------
 async function loadAttendanceStudents(routeId) {
    const tbody = document.querySelector('#attendance-table tbody');
    tbody.innerHTML = '';

    try {
        // 1️⃣ Get assignments for selected route
        const res = await fetch(
            `https://sheratoneducationcentre.onrender.com/api/transport/assignments?routeId=${routeId}`
        );
        const assignments = await res.json();
        if (!assignments.length) return;

        // 2️⃣ Fetch students
        const studentRes = await fetch(
            `https://sheratoneducationcentre.onrender.com/api/students`
        );
        const students = await studentRes.json();

        // Create map: studentId → name
        const studentMap = {};
        students.forEach(s => {
            studentMap[s._id] = s.name;
        });

        // 3️⃣ Set bus name (from first assignment)
        document.getElementById('attendance-bus').value =
            assignments[0].busId?.number || '';

        // 4️⃣ Populate table
        assignments.forEach((a, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${studentMap[a.studentId] || 'Unknown'}</td>
                <td>${a.routeId?.name || '-'}</td>
                <td>${a.busId?.number || '-'}</td>
                <td style="text-align:center">
                    <input type="checkbox" data-student-id="${a.studentId}" />
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Error loading attendance students:', err);
    }
}



//---------------------------------
    //SAVE TRANSPORT ATTENDANCE
    //-----------------------------
    async function saveTransportAttendance() {
    const date = document.getElementById('attendance-date').value;
    const routeId = document.getElementById('attendance-route').value;

    if (!date || !routeId) {
        alert('Please select date and route');
        return;
    }

    const checkboxes = document.querySelectorAll('#attendance-table tbody input[type="checkbox"]');
    const attendanceData = Array.from(checkboxes).map(cb => ({
        studentId: cb.dataset.studentId,
        routeId,
        date,
        present: cb.checked
    }));

    try {
        await fetch('https://sheratoneducationcentre.onrender.com/api/transport/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attendanceData)
        });

        alert('Attendance saved successfully!');
        closeTransportModal('attendanceModal');
    } catch (err) {
        console.error('Error saving attendance:', err);
        alert('Failed to save attendance');
    }
}


    window.saveTransportAttendance = async function () {
    const date = document.getElementById('attendance-date').value;
    const routeId = document.getElementById('attendance-route').value;

    if (!date || !routeId) {
        alert('Please select date and route');
        return;
    }

    const attendance = [];

    document
        .querySelectorAll('#attendance-table tbody input[type="checkbox"]')
        .forEach(cb => {
            attendance.push({
                studentId: cb.dataset.studentId,
                present: cb.checked
            });
        });

    if (!attendance.length) {
        alert('No students loaded');
        return;
    }

    try {
        await fetch(
            'https://sheratoneducationcentre.onrender.com/api/transport/attendance',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    routeId,
                    attendance
                })
            }
        );

        alert('Attendance saved successfully ✅');
        closeTransportModal('attendanceModal');

    } catch (err) {
        console.error('Error saving attendance:', err);
        alert('Failed to save attendance');
    }
};

    // ---------------------------
    // INITIAL LOAD
    // ---------------------------
    // Load buses, routes, drivers, student assignments
    loadBuses();
    loadRoutes();
    loadDrivers();
    loadStudentAssignments();

    // Load transport payments with grouping / balance logic
    loadTransportPayments(true);

loadStudentsDropdown('payment-student');
loadRoutesDropdown('payment-route');

});

console.log("transport.js loaded");
