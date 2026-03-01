// ------------------ Meals & Collections JS ------------------

document.addEventListener("click", function(e) {
    const mealModal = document.getElementById("mc-meal-modal");
    const otherModal = document.getElementById("mc-other-modal");

    // ---------- OPEN MODALS ----------
    if (e.target.closest("#mc-add-meal-btn")) mealModal?.classList.add("mc-show");
    if (e.target.closest("#mc-add-other-btn")) otherModal?.classList.add("mc-show");

    // ---------- CLOSE MODALS ----------
    if (e.target.closest("#mc-close-meal") || e.target.id === "mc-meal-modal") mealModal?.classList.remove("mc-show");
    if (e.target.closest("#mc-close-other") || e.target.id === "mc-other-modal") otherModal?.classList.remove("mc-show");
});

// ------------------ Fetch and Load Tables ------------------
async function loadMeals(className = "") {
    const url = className ? `/api/meals?className=${className}` : "/api/meals";
    try {
        const res = await fetch(url);
        const data = await res.json();
        const tbody = document.querySelector("#mc-meals-table tbody");
        tbody.innerHTML = "";
        data.forEach(meal => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${meal.className}</td>
                <td>${meal.studentName}</td>
                <td>${meal.mealType}</td>
                <td>${meal.date.split("T")[0]}</td>
                <td>${meal.frequency || ""}</td>
                <td>${meal.amount}</td>
                <td>${meal.receiptNumber}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Error loading meals:", err);
    }
}

async function loadOtherCharges(className = "") {
    const url = className ? `/api/other-charges?className=${className}` : "/api/other-charges";
    try {
        const res = await fetch(url);
        const data = await res.json();
        const tbody = document.querySelector("#mc-other-table tbody");
        tbody.innerHTML = "";
        data.forEach(charge => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${charge.className}</td>
                <td>${charge.studentName}</td>
                <td>${charge.chargeType}</td>
                <td>${charge.date.split("T")[0]}</td>
                <td>${charge.amount}</td>
                <td>${charge.receiptNumber}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Error loading charges:", err);
    }
}

// ------------------ Filters ------------------
document.getElementById("mc-filter-class-meals")?.addEventListener("change", e => loadMeals(e.target.value));
document.getElementById("mc-filter-class-other")?.addEventListener("change", e => loadOtherCharges(e.target.value));

// ------------------ Search ------------------
function setupSearch(tableId, inputId) {
    const table = document.getElementById(tableId);
    const searchInput = document.getElementById(inputId);
    searchInput?.addEventListener("input", () => {
        const filter = searchInput.value.toLowerCase();
        Array.from(table.tBodies[0].rows).forEach(row => {
            const student = row.cells[1].textContent.toLowerCase();
            row.style.display = student.includes(filter) ? "" : "none";
        });
    });
}

setupSearch("mc-meals-table","mc-search-meals");
setupSearch("mc-other-table","mc-search-other");

// ------------------ Sorting ------------------
function setupSorting(tableId) {
    const table = document.getElementById(tableId);
    table.querySelectorAll("th[data-sort]").forEach(th => {
        let asc = true;
        th.style.cursor = "pointer";
        th.addEventListener("click", () => {
            const tbody = table.tBodies[0];
            const rows = Array.from(tbody.rows);
            const index = th.cellIndex;

            rows.sort((a,b) => {
                let valA = a.cells[index].textContent;
                let valB = b.cells[index].textContent;
                if(!isNaN(valA) && !isNaN(valB)) return asc ? valA - valB : valB - valA;
                return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            });

            rows.forEach(r => tbody.appendChild(r));
            asc = !asc;
        });
    });
}

setupSorting("mc-meals-table");
setupSorting("mc-other-table");

// ------------------ Export / Print ------------------
function exportTableToCSV(tableId, filename){
    const table = document.getElementById(tableId);
    let csv = [];
    Array.from(table.rows).forEach(row => {
        const cols = Array.from(row.cells).map(cell => `"${cell.textContent}"`);
        csv.push(cols.join(","));
    });
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

function printTable(tableId) {
    const table = document.getElementById(tableId).outerHTML;
    const newWin = window.open("");
    newWin.document.write(`<html><head><title>Print</title></head><body>${table}</body></html>`);
    newWin.print();
}

document.getElementById("mc-export-meals")?.addEventListener("click", () => exportTableToCSV("mc-meals-table","meals.csv"));
document.getElementById("mc-print-meals")?.addEventListener("click", () => printTable("mc-meals-table"));
document.getElementById("mc-export-other")?.addEventListener("click", () => exportTableToCSV("mc-other-table","other-charges.csv"));
document.getElementById("mc-print-other")?.addEventListener("click", () => printTable("mc-other-table"));

// ------------------ Form Submissions ------------------
document.getElementById("mc-meal-form")?.addEventListener("submit", async function(e){
    e.preventDefault();
    const data = Object.fromEntries(new FormData(this).entries());
    data.receiptNumber = `MEAL-${Date.now()}-${Math.floor(Math.random()*1000)}`;

    try {
        await fetch("/api/meals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        loadMeals(data.className); // refresh table
        this.reset();
        document.getElementById("mc-meal-modal")?.classList.remove("mc-show");
    } catch (err) {
        console.error("Error saving meal:", err);
    }
});

document.getElementById("mc-other-form")?.addEventListener("submit", async function(e){
    e.preventDefault();
    const data = Object.fromEntries(new FormData(this).entries());
    data.receiptNumber = `CHG-${Date.now()}-${Math.floor(Math.random()*1000)}`;

    try {
        await fetch("/api/other-charges", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        loadOtherCharges(data.className); // refresh table
        this.reset();
        document.getElementById("mc-other-modal")?.classList.remove("mc-show");
    } catch (err) {
        console.error("Error saving charge:", err);
    }
});
// ------------------ Dynamic Student Dropdowns ------------------

// Meals Modal: Populate students based on selected class
document.querySelector("#mc-meal-form select[name='className']")?.addEventListener("change", async function() {
    const className = this.value;
    const studentSelect = document.getElementById("mc-meal-student");
    if (!studentSelect) return;
    studentSelect.innerHTML = '<option value="">Loading...</option>';

    if (!className) {
        studentSelect.innerHTML = '<option value="">Select Student</option>';
        return;
    }

    try {
        const res = await fetch(`/api/students`);
        const data = await res.json();
        studentSelect.innerHTML = '<option value="">Select Student</option>';

        // Filter students by class
        data.forEach(student => {
            if (!student || !student.profile) return;
            const studentClass = student.profile.class || "";
            if (studentClass !== className) return; // only include students in selected class

            const studentName = student.name || "Unnamed";
            const opt = document.createElement("option");
            opt.value = studentName;
            opt.textContent = studentName;
            studentSelect.appendChild(opt);
        });
    } catch (err) {
        console.error("Error fetching students:", err);
        studentSelect.innerHTML = '<option value="">Error loading students</option>';
    }
});

// Other Charges Modal: Populate students based on selected class
document.querySelector("#mc-other-form select[name='className']")?.addEventListener("change", async function() {
    const className = this.value;
    const studentSelect = document.getElementById("mc-other-student");
    if (!studentSelect) return;
    studentSelect.innerHTML = '<option value="">Loading...</option>';

    if (!className) {
        studentSelect.innerHTML = '<option value="">Select Student</option>';
        return;
    }

    try {
        const res = await fetch(`/api/students`);
        const data = await res.json();
        studentSelect.innerHTML = '<option value="">Select Student</option>';

        data.forEach(student => {
            if (!student || !student.profile) return;
            const studentClass = student.profile.class || "";
            if (studentClass !== className) return; // filter by selected class

            const studentName = student.name || "Unnamed";
            const opt = document.createElement("option");
            opt.value = studentName;
            opt.textContent = studentName;
            studentSelect.appendChild(opt);
        });
    } catch (err) {
        console.error("Error fetching students:", err);
        studentSelect.innerHTML = '<option value="">Error loading students</option>';
    }
});

// ------------------ Initial Table Load ------------------
loadMeals();
loadOtherCharges();
