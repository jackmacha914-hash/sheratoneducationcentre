/**
 * Student Report Cards Module
 * Handles the display and interaction with student report cards
 */

class StudentReportCards {
    constructor() {
        this.reportCardsContainer = document.getElementById('report-cards-grid');
        this.loadingElement = document.getElementById('report-cards-loading');
        this.emptyStateElement = document.getElementById('no-report-cards');
        this.refreshButton = document.getElementById('refresh-report-cards');
        this.termSelect = document.getElementById('term-select');
        this.yearSelect = document.getElementById('academic-year-select');
        this.modal = document.getElementById('reportCardModal');
        this.modalTitle = document.getElementById('reportCardModalLabel');
        this.modalBody = document.querySelector('#reportCardModal .modal-body');
        this.currentCard = null;

        // Initialize the component
        this.initialize();
    }

    initialize() {
        // Bind event listeners for refresh and selects
        if (this.refreshButton) this.refreshButton.addEventListener('click', () => this.loadReportCards());
        if (this.termSelect) this.termSelect.addEventListener('change', () => this.loadReportCards());
        if (this.yearSelect) this.yearSelect.addEventListener('change', () => this.loadReportCards());

        // Close modal when clicking dismiss buttons
        document.querySelectorAll('[data-bs-dismiss="modal"]').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
    }

    async loadReportCards() {
        try {
            this.showLoading();
            const term = this.termSelect?.value || 'Term 1';
            let studentId = localStorage.getItem('studentId');

            if (!studentId) {
                const studentElem = document.getElementById('student-name');
                if (studentElem?.dataset.studentId) {
                    studentId = studentElem.dataset.studentId;
                    localStorage.setItem('studentId', studentId);
                } else throw new Error('Student ID not found. Please log in again.');
            }

            if (!term) throw new Error('Please select a term');

            console.log('Fetching report cards for:', { studentId, term });

            if (typeof API_BASE_URL === 'undefined') window.API_BASE_URL = 'https://sheratoneducationcentre.onrender.com';

            const marksResponse = await fetch(`${API_BASE_URL}/api/marks/student/${studentId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!marksResponse.ok) {
                if (marksResponse.status === 404) this.showNoReportCards(term, '', 'No marks found for this student.');
                else throw new Error(`Failed to load marks: ${marksResponse.statusText}`);
                return;
            }

            const response = await marksResponse.json();
            const filteredMarks = response?.data?.filter(mark => mark.term === term) || [];

            if (filteredMarks.length === 0) {
                this.showNoReportCards(term, '', `No marks found for ${term}.`);
                return;
            }

            const reportCard = await this.transformMarksToReportCard(filteredMarks, term, '');
            this.renderReportCards([reportCard]);

        } catch (error) {
            console.error('Error loading report cards:', error);
            this.showError(error.message || 'Failed to load report cards. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    renderReportCards(reportCards) {
        if (!this.reportCardsContainer) return;

        this.reportCardsContainer.innerHTML = '';

        if (!reportCards?.length) {
            this.showNoReportCards();
            return;
        }

        reportCards.forEach(card => {
            const cardEl = this.createReportCardElement(card);
            if (cardEl) this.reportCardsContainer.appendChild(cardEl);
        });
    }

    createReportCardElement(card) {
        if (!card) return null;

        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-4';

        const date = new Date(card.issueDate);
        const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const totalScore = card.subjects.reduce((sum, s) => sum + s.score, 0);
        const averageScore = card.subjects.length ? totalScore / card.subjects.length : 0;
        const overallGrade = this.calculateGrade(averageScore);

        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-header bg-primary text-white">
                    <h5 class="card-title mb-0">${card.term} - ${card.academicYear}</h5>
                    <small class="text-white-50">Issued: ${formattedDate}</small>
                </div>
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="mb-0">Overall Grade:</h6>
                        <span class="badge bg-success">${overallGrade}</span>
                    </div>
                    <div class="progress mb-3" style="height: 20px;">
                        <div class="progress-bar" role="progressbar" style="width: ${averageScore}%" 
                             aria-valuenow="${averageScore}" aria-valuemin="0" aria-valuemax="100">
                            ${averageScore.toFixed(1)}%
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-sm btn-outline-primary view-report-card">
                        <i class="bi bi-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-outline-secondary float-end download-report-card">
                        <i class="bi bi-download"></i> Download
                    </button>
                </div>
            </div>
        `;

        col.querySelector('.view-report-card')?.addEventListener('click', e => this.viewReportCard(card, e));
        col.querySelector('.download-report-card')?.addEventListener('click', () => this.downloadReportCard(card));

        return col;
    }

    viewReportCard(card, event) {
        event?.preventDefault();
        this.currentCard = card;

        if (!this.modal || !this.modalTitle || !this.modalBody) return console.error('Modal elements not found');

        this.modalTitle.textContent = `Report Card - ${card.term} ${card.academicYear}`;
        this.modalBody.innerHTML = this.generateReportCardHTML(card);

        new bootstrap.Modal(this.modal).show();
    }

    generateReportCardHTML(card) {
        if (!card) return '';
        const date = new Date(card.issueDate);
        const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const totalScore = card.subjects.reduce((sum, s) => sum + s.score, 0);
        const averageScore = card.subjects.length ? totalScore / card.subjects.length : 0;
        const overallGrade = this.calculateGrade(averageScore);

        const subjectsHTML = card.subjects.map(s => `
            <tr>
                <td>${s.name}</td>
                <td class="text-center">${s.score}%</td>
                <td class="text-center">${this.calculateGrade(s.score)}</td>
                <td>${s.comments || 'No comments'}</td>
            </tr>
        `).join('');

        return `
            <div class="report-card-print">
                <div class="report-card-header text-center mb-4">
                    <h2>${card.schoolName || 'School Name'}</h2>
                    <h4>Report Card</h4>
                    <p class="mb-0">${card.term} - ${card.academicYear}</p>
                    <p class="text-muted">Issued: ${formattedDate}</p>
                </div>
                <div class="student-info mb-4">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Student:</strong> ${card.student?.fullName || card.studentName || 'Student'}</p>
                            <p><strong>Class:</strong> ${card.student?.className || card.className || 'N/A'}</p>
                        </div>
                        <div class="col-md-6 text-md-end">
                            <p><strong>Overall Grade:</strong> <span class="badge bg-primary">${overallGrade}</span></p>
                            <p><strong>Average Score:</strong> ${averageScore.toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Subject</th>
                                <th class="text-center">Score</th>
                                <th class="text-center">Grade</th>
                                <th>Comments</th>
                            </tr>
                        </thead>
                        <tbody>${subjectsHTML}</tbody>
                    </table>
                </div>
                <div class="teacher-comments mt-4">
                    <h5>Teacher's Comments:</h5>
                    <div class="border p-3">${card.teacherComments || 'No comments available.'}</div>
                </div>
                <div class="signature-line mt-5 pt-4 text-end">
                    <p class="mb-1">_________________________</p>
                    <p class="mb-0">Teacher's Signature</p>
                </div>
            </div>
        `;
    }

    downloadReportCard(card) {
        if (!card) return console.error('No report card data available for download');
        const html = this.generateReportCardHTML(card);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Report Card - ${card.term} ${card.academicYear}</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
            </head>
            <body>
                <div id="report-card-content">${html}</div>
                <div class="text-center mt-3 no-print">
                    <button class="btn btn-primary" onclick="window.print()">Print</button>
                    <button class="btn btn-success ms-2" id="download-pdf">Download PDF</button>
                    <button class="btn btn-secondary ms-2" onclick="window.close()">Close</button>
                </div>
                <script>
                    document.getElementById('download-pdf').addEventListener('click', function() {
                        html2pdf().set({
                            margin:10,
                            filename: 'report-card-${card.term.toLowerCase().replace(/\\s+/g,'-')}-${card.academicYear}.pdf',
                            image: {type:'jpeg', quality:0.98},
                            html2canvas:{scale:2},
                            jsPDF:{unit:'mm', format:'a4', orientation:'portrait'}
                        }).from(document.getElementById('report-card-content')).save();
                    });
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    calculateGrade(score) {
        if (score >= 70) return 'Exceed Expectation';
        if (score >= 50) return 'Meet Expectation';
        return 'Below Expectation';
    }

    showLoading() {
        if (this.loadingElement) this.loadingElement.style.display = 'block';
        if (this.emptyStateElement) this.emptyStateElement.style.display = 'none';
        if (this.reportCardsContainer) this.reportCardsContainer.style.display = 'none';
    }

    hideLoading() {
        if (this.loadingElement) this.loadingElement.style.display = 'none';
        if (this.reportCardsContainer) this.reportCardsContainer.style.display = 'grid';
    }

    async transformMarksToReportCard(marksData, term, academicYear) {
        const totalMarks = marksData.reduce((sum, m) => sum + (parseInt(m.score)||0), 0);
        const averageScore = marksData.length ? totalMarks / marksData.length : 0;
        const firstMark = marksData[0];
        let studentData = { fullName:'Student', className:'N/A' };

        try {
            const userProfile = JSON.parse(localStorage.getItem('userProfile')||'{}');
            if (userProfile) {
                studentData = {
                    fullName: userProfile.name || userProfile.fullName || `${userProfile.firstName||''} ${userProfile.lastName||''}`.trim()||'Student',
                    className: userProfile.profile?.class || userProfile.className || userProfile.class?.name || 'N/A'
                };
            }
        } catch(err) { console.error('Error parsing user profile:', err); }

        return {
            term, academicYear, issueDate:new Date().toISOString(),
            student: studentData,
            subjects: marksData.map(m=>({name:m.subject, score:parseInt(m.score)||0, grade:this.calculateGrade(parseInt(m.score)||0), comments:m.teacherRemarks||'No comments'})),
            teacherComments:firstMark.teacherRemarks||'No additional comments',
            overallGrade:this.calculateGrade(averageScore),
            averageScore
        };
    }

    showNoReportCards(term='', academicYear='', msg='') {
        if (!this.emptyStateElement) return;
        this.emptyStateElement.innerHTML = `
            <div class="alert alert-info" role="alert">
                <div class="d-flex align-items-center">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    <div>
                        <h5 class="alert-heading">No Report Cards Found</h5>
                        <p class="mb-2">${msg || `No report cards found for ${term} ${academicYear}.`}</p>
                        <p class="small text-muted mb-2">This could be because your marks haven't been recorded yet or the term hasn't ended.</p>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary" id="try-again-btn"><i class="bi bi-arrow-clockwise"></i> Try Again</button>
                            <button class="btn btn-sm btn-outline-secondary" id="contact-admin-btn"><i class="bi bi-envelope"></i> Contact Administrator</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.emptyStateElement.querySelector('#try-again-btn')?.addEventListener('click',()=>this.loadReportCards());
        this.emptyStateElement.querySelector('#contact-admin-btn')?.addEventListener('click',()=>{
            const subject = encodeURIComponent('Report Cards Not Available');
            const body = encodeURIComponent(`Hello,\n\nI'm unable to view my report cards for ${term} ${academicYear}. Could you please assist?\n\nThank you.`);
            window.location.href = `mailto:admin@school.com?subject=${subject}&body=${body}`;
        });
        this.emptyStateElement.style.display='block';
        if (this.reportCardsContainer) this.reportCardsContainer.style.display='none';
    }

    showError(message='') {
        if (!this.emptyStateElement) return;
        this.emptyStateElement.innerHTML = `<div class="alert alert-danger" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i>${message}</div>`;
        this.emptyStateElement.style.display='block';
        if (this.reportCardsContainer) this.reportCardsContainer.style.display='none';
    }

    closeModal() {
        const modalInstance = bootstrap.Modal.getInstance(this.modal);
        if(modalInstance) modalInstance.hide();
    }
}

// Make the class globally available
window.StudentReportCards = StudentReportCards;

// Single instance for tabs or sections
window.studentReportCardsInstance = window.studentReportCardsInstance || new StudentReportCards();

// Lazy load when section is visible
document.addEventListener('DOMContentLoaded',()=>{
    const section = document.getElementById('report-cards-section');
    if(!section) return;
    const observer = new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
            if(entry.isIntersecting){
                window.studentReportCardsInstance.loadReportCards();
                observer.unobserve(entry.target);
            }
        });
    },{threshold:0.1});
    observer.observe(section);
});

// Optional tab initialization wrapper
function initializeTabSwitching(){
    return window.studentReportCardsInstance;
}
