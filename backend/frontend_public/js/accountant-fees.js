// Accountant Fees Management

/**
 * Debounce utility function to limit the rate at which a function can fire.
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time in milliseconds to delay
 * @returns {Function} - The debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Accountant Fees Management
class AccountantFees {
    constructor() {
        this.feeTableBody = document.getElementById('fee-table-body');
        this.feeSearch = document.getElementById('fees-search');
        this.feesStatusFilter = document.getElementById('fees-status-filter');
        this.feesClassFilter = document.getElementById('fees-class-filter');
        this.resetFiltersBtn = document.getElementById('reset-filters');
        this.selectAllCheckbox = document.getElementById('select-all-fees');
        this.feesTermFilter = document.getElementById('fees-term-filter');
        this.feesYearFilter = document.getElementById('fees-year-filter');

        
        this.initialize();
    }

    initialize() {
        console.log('Initializing Accountant Fees...');
        
        // Handle delete button click
        this.handleDeleteClick = async (e) => {
            const button = e.target.closest('[data-action="delete"]');
            if (button) {
                e.preventDefault();
                const feeId = button.getAttribute('data-fee-id');
                if (feeId) {
                    await this.handleDeleteFee(feeId);
                }
            }
        }

        // Delete a fee record using the DELETE endpoint
        this.tryDeleteFee = async (feeId, token) => {
            console.log('Attempting to delete fee with ID:', feeId);
            
            try {
                const deleteUrl = `https://sheratoneducationcentre.onrender.com/api/fees/${feeId}`;
                console.log('Sending DELETE request to:', deleteUrl);
                
                const response = await fetch(deleteUrl, {
                    method: 'DELETE',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('Delete response status:', response.status);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error || `Failed to delete fee (Status: ${response.status})`;
                    throw new Error(errorMessage);
                }
                
                return true;
            } catch (error) {
                console.error('Error deleting fee:', error);
                throw error;
            }
        }

        // Handle fee deletion
        this.handleDeleteFee = async (feeId) => {
            if (!confirm('Are you sure you want to delete this fee record? This action cannot be undone.')) {
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                alert('You must be logged in to delete fee records.');
                window.location.href = '/login.html';
                return;
            }

            try {
                const success = await this.tryDeleteFee(feeId, token);
                if (success) {
                    alert('Fee record has been deleted successfully.');
                    this.loadFeesWithFilters(); // Refresh the list
                } else {
                    alert('Failed to delete fee record. Please try again.');
                }
            } catch (error) {
                console.error('Error in handleDeleteFee:', error);
                let errorMessage = 'An error occurred while deleting the fee record';
                
                if (error.message) {
                    errorMessage = error.message;
                }
                
                alert(`Error: ${errorMessage}`);
            }
        }

        // Initialize event listeners
        this.initEventListeners();
        
        // Load initial data
        this.loadFeesWithFilters();
    }
    
    initEventListeners() {
        // Search input
        if (this.feeSearch) {
            this.feeSearch.addEventListener('input', debounce(() => {
                this.loadFeesWithFilters();
            }, 300));
        }

        // Status filter
        if (this.feesStatusFilter) {
            this.feesStatusFilter.addEventListener('change', () => {
                this.loadFeesWithFilters();
            });
        }

        // Class filter
        if (this.feesClassFilter) {
            this.feesClassFilter.addEventListener('change', () => {
                this.loadFeesWithFilters();
            });
        }
        // Term filter
       if (this.feesTermFilter) {
       this.feesTermFilter.addEventListener('change', () => {
        this.loadFeesWithFilters();
    });
}

// Academic year filter
if (this.feesYearFilter) {
    this.feesYearFilter.addEventListener('change', () => {
        this.loadFeesWithFilters();
    });
}


        // Handle button clicks using event delegation
        document.addEventListener('click', (e) => {
            // Handle delete button clicks
            this.handleDeleteClick(e);
            
            // Handle record payment button clicks
            const recordPaymentBtn = e.target.closest('[data-action="record-payment"]');
            if (recordPaymentBtn) {
                e.preventDefault();
                const feeId = recordPaymentBtn.getAttribute('data-fee-id');
                if (feeId) {
                    this.recordPayment(feeId);
                }
            }
            
            // Handle view payment history button clicks
            const viewBtn = e.target.closest('[data-action="view"]');
            if (viewBtn) {
                e.preventDefault();
                const feeId = viewBtn.getAttribute('data-fee-id');
                console.log('View button clicked for fee ID:', feeId);
                if (feeId) {
                    console.log('Calling viewFee with ID:', feeId);
                    this.viewFee(feeId).catch(error => {
                        console.error('Error in viewFee:', error);
                        this.showNotification('Error loading payment history', 'error');
                    });
                } else {
                    console.error('No fee ID found on view button');
                }
            }
        });

        if (this.resetFiltersBtn) this.resetFiltersBtn.addEventListener('click', () => this.resetFilters());
        if (this.selectAllCheckbox) this.selectAllCheckbox.addEventListener('change', (e) => this.toggleSelectAll(e));
    }

    async loadFeesWithFilters() {
        console.log('=== Loading fees with payments ===');
        const startTime = Date.now();
        console.log('Loading fees with filters...');
        
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No authentication token found, redirecting to login');
            window.location.href = '/login.html';
            return;
        }

        try {
            // Show loading state
            this.feeTableBody.innerHTML = '<tr><td colspan="9" class="px-6 py-4 text-center">Loading fees...</td></tr>';

            // Get filter values
            const searchTerm = this.feeSearch ? this.feeSearch.value.trim() : '';
            const statusFilter = this.feesStatusFilter ? this.feesStatusFilter.value : '';
            const classFilter = this.feesClassFilter ? this.feesClassFilter.value : '';
            const termFilter = this.feesTermFilter ? this.feesTermFilter.value : '';
            const yearFilter = this.feesYearFilter ? this.feesYearFilter.value : '';

            
            // Build query parameters
            const params = new URLSearchParams();
            params.append('populate', 'student,payments');
            
           if (searchTerm) params.append('search', searchTerm);
           if (statusFilter) params.append('status', statusFilter);
           if (classFilter && classFilter !== 'All Classes') params.append('class', classFilter);
           if (termFilter) params.append('academicTerm', termFilter);
           if (yearFilter) params.append('academicYear', yearFilter);

            
            // Make API request to get fees with populated student data
            const apiUrl = `https://sheratoneducationcentre.onrender.com/api/fees?${params.toString()}`;
            console.log('Fetching fees from:', apiUrl);
            
            let response;
            try {
                response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                });
                console.log('Response status:', response.status);
            } catch (fetchError) {
                console.error('Network error when fetching fees:', fetchError);
                throw new Error(`Could not connect to the server. Please check if the backend is running on port 5000. Error: ${fetchError.message}`);
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Failed to fetch fees (${response.status}): ${errorText}`);
            }

            const fees = await response.json();
            
            // Log payment information
            if (fees && fees.length > 0) {
                console.log(`Fetched ${fees.length} fee records with payments`);
                fees.forEach((fee, index) => {
                    console.log(`Fee #${index + 1}:`, {
                        id: fee._id,
                        total: fee.totalAmount || fee.amount,
                        paid: fee.paidAmount || 0,
                        balance: (fee.totalAmount || fee.amount || 0) - (fee.paidAmount || 0),
                        payments: fee.payments ? fee.payments.length : 0
                    });
                });
            }
            
            // Store for debugging
            console.log('=== RAW API RESPONSE ===');
            console.log(JSON.stringify(fees, null, 2));
            console.log('=== END RAW RESPONSE ===');
            
            // Enhanced debug logging
            if (fees && fees.length > 0) {
                console.log('First fee record student data type:', typeof fees[0].student);
                if (fees[0].student) {
                    console.log('Student object keys:', Object.keys(fees[0].student));
                    console.log('Student object:', fees[0].student);
                }
                console.log('=== FEE RECORDS DEBUG INFO ===');
                console.log('Number of fee records:', fees.length);
                
                // Log first 3 records for analysis
                const sampleSize = Math.min(3, fees.length);
                for (let i = 0; i < sampleSize; i++) {
                    console.log(`\n=== Fee Record ${i + 1} ===`);
                    console.log('Raw data:', JSON.parse(JSON.stringify(fees[i])));
                    console.log('Available properties:', Object.keys(fees[i]));
                    
                    // Detailed student info
                    if (fees[i].student) {
                        console.log('--- Student Data ---');
                        console.log('Student data type:', typeof fees[i].student);
                        if (typeof fees[i].student === 'object') {
                            console.log('Student properties:', Object.keys(fees[i].student));
                            console.log('Student values:', fees[i].student);
                            
                            // Check for common name fields
                            const student = fees[i].student;
                            const possibleNameFields = ['fullName', 'name', 'firstName', 'username', 'email'];
                            const foundNames = {};
                            
                            possibleNameFields.forEach(field => {
                                if (student[field]) {
                                    foundNames[field] = student[field];
                                }
                            });
                            
                            console.log('Possible name fields:', foundNames);
                        } else {
                            console.log('Student value (not an object):', fees[i].student);
                        }
                    }
                    
                    // Check for studentId
                    if (fees[i].studentId) {
                        console.log('Student ID exists:', fees[i].studentId);
                        console.log('Student ID type:', typeof fees[i].studentId);
                        if (typeof fees[i].studentId === 'object') {
                            console.log('Student ID object keys:', Object.keys(fees[i].studentId));
                        }
                    }
                    
                    // Check for direct student name
                    if (fees[i].studentName) {
                        console.log('Student name directly in fee:', fees[i].studentName);
                    }
                }
                
                // Log all fee IDs for reference
                console.log('All fee IDs:', fees.map(f => f._id || f.id || 'No ID'));
                
                // Log the first fee record in full for inspection
                if (fees[0]) {
                    console.log('\n=== FULL FIRST FEE RECORD ===');
                    console.log(JSON.stringify(fees[0], null, 2));
                }
            }
            
            await this.renderFees(fees);
            
        } catch (error) {
            console.error('Error loading fees:', error);
            this.showNotification('Error loading fee records: ' + error.message, 'error');
        }
    }
    
    async renderFees(fees) {
        if (!this.feeTableBody) {
            console.error('Fee table body not found');
            return;
        }
        
        this.feeTableBody.innerHTML = '';
        
        if (!Array.isArray(fees) || fees.length === 0) {
            this.feeTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="px-6 py-4 text-center text-gray-500">
                        No fee records found
                    </td>
                </tr>`;
            return;
        }
        
        // Process each fee record and wait for all to complete
        const feeRows = await Promise.all(
            fees.map(async (fee) => {
                try {
                    return await this.createFeeRow(fee);
                } catch (error) {
                    console.error('Error creating fee row:', error);
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td colspan="9" class="px-6 py-4 text-center text-red-500">
                            Error loading fee record
                        </td>
                    `;
                    return row;
                }
            })
        );
        
        // Append all rows to the table
        feeRows.forEach(row => this.feeTableBody.appendChild(row));
    }
    
    // Format amounts
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 2
        }).format(amount || 0);
    }
    
    // Format date
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return isNaN(date) ? 'N/A' : date.toLocaleDateString('en-KE', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            console.error('Error formatting date:', e);
            return 'N/A';
        }
    }
    
    async createFeeRow(fee) {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        if (fee._id) {
            row.setAttribute('data-fee-id', fee._id);
        }
        
        // Calculate total paid from payments array if available
        let paidAmount = 0;
        if (fee.payments && Array.isArray(fee.payments)) {
            paidAmount = fee.payments.reduce((sum, payment) => {
                return sum + (parseFloat(payment.amount) || 0);
            }, 0);
        } else {
            // Fallback to direct amount if no payments array
            paidAmount = parseFloat(
                fee.paidAmount || 
                fee.amountPaid || 
                fee.paid || 
                fee.paymentAmount || 
                0
            );
        }
        
        const totalFees = parseFloat(
            fee.totalFees || 
            fee.amount || 
            fee.totalAmount || 
            fee.feeAmount || 
            0
        );
        
        const balance = Math.max(0, totalFees - paidAmount);
        
        // Debug log payment information
        console.log('Fee row calculations:', {
            feeId: fee._id,
            totalFees,
            paidAmount,
            balance,
            payments: fee.payments ? fee.payments.length : 0,
            hasPaymentsArray: Array.isArray(fee.payments)
        });
        
        // Debug log the fee amounts
        console.log('Fee amounts:', { 
            paidAmount: fee.paidAmount,
            amountPaid: fee.amountPaid,
            totalFees: fee.totalFees,
            amount: fee.amount,
            calculatedPaid: paidAmount,
            calculatedTotal: totalFees,
            balance: balance
        });
        
        // Extract student information
        let studentName = 'N/A';
        let admissionNumber = '';
        
        // Log the fee object structure for debugging
        console.log('=== FEE OBJECT STRUCTURE ===', {
            feeId: fee._id,
            hasStudent: !!fee.student,
            studentType: typeof fee.student,
            studentKeys: fee.student ? Object.keys(fee.student) : 'N/A'
        });
        
        // Handle student data
        if (fee.student) {
            if (typeof fee.student === 'object') {
                // Use displayName if available (added by the backend)
                if (fee.student.displayName) {
                    studentName = fee.student.displayName;
                }
                // Use name field from User model
                else if (fee.student.name) {
                    studentName = fee.student.name;
                }
                // Fall back to email if name is not available
                else if (fee.student.email) {
                    studentName = fee.student.email;
                }
                
                // Get class information
                const studentClass = fee.student.class || 
                                  (fee.student.profile && fee.student.profile.class) ||
                                  fee.className ||
                                  '';
                
                // Update the class name in the fee object for display
                if (studentClass) {
                    fee.className = studentClass;
                }
                
                // Get admission number from profile if available
                if (fee.student.profile) {
                    admissionNumber = fee.student.profile.registrationNumber || 
                                    fee.student.profile.rollNumber ||
                                    '';
                }
            } 
            // If student is just an ID string
            else if (typeof fee.student === 'string') {
                studentName = 'Student ' + fee.student.substring(0, 6) + '...';
            }
        }
        
        // Fallback to studentName if available
        if ((!studentName || studentName === 'N/A') && fee.studentName) {
            studentName = fee.studentName;
        }
        
        // Final cleanup
        studentName = (studentName || 'N/A').toString().trim();
        
        console.log('Final student display:', { 
            studentName, 
            admissionNumber,
            studentData: fee.student
        });
        
        console.log('Final student name:', studentName);
        
        // Get admission number if available
        if (fee.student) {
            if (typeof fee.student === 'object') {
                admissionNumber = fee.student.admissionNumber || 
                                fee.student.rollNumber || 
                                fee.student.registrationNumber ||
                                '';
            }
        }
        
        // Extract class information
        let className = 'N/A';
        if (fee.class) {
            if (typeof fee.class === 'string') {
                className = fee.class;
            } else if (typeof fee.class === 'object' && fee.class !== null) {
                className = fee.class.name || fee.class.className || 'N/A';
            }
        } else if (fee.className) {
            className = fee.className;
        } else if (fee.className) {
            className = fee.className;
        }
        
        // Determine status
        let status = 'Pending';
        let statusClass = 'bg-yellow-100 text-yellow-800';
        
        if (paidAmount >= totalFees) {
            status = 'Paid';
            statusClass = 'bg-green-100 text-green-800';
        } else if (fee.dueDate && new Date(fee.dueDate) < new Date()) {
            status = 'Overdue';
            statusClass = 'bg-red-100 text-red-800';
        }


        const academicYear = fee.academicYear || '-';
        const academicTerm = fee.academicTerm || '-';

        
        // Create row HTML
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <input type="checkbox" class="fee-checkbox rounded text-blue-600" data-id="${fee._id || ''}">
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${studentName}</div>
                ${admissionNumber ? `<div class="text-sm text-gray-500">${admissionNumber}</div>` : ''}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${className}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
               ${academicYear}
             </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              ${academicTerm}
             </td>

            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${totalFees > 0 ? formatCurrency(totalFees) : 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm ${paidAmount > 0 ? 'text-green-600' : 'text-gray-500'} font-medium">
                ${paidAmount > 0 ? formatCurrency(paidAmount) : 'Ksh 0.00'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm ${balance > 0 ? 'text-red-600' : 'text-green-600'} font-medium">
                ${formatCurrency(balance)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                    ${status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(fee.dueDate)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="text-indigo-600 hover:text-indigo-900 mr-3" data-action="view" data-fee-id="${fee._id}">View</button>
                <button class="text-green-600 hover:text-green-900 mr-3" data-action="record-payment" data-fee-id="${fee._id}">Record Payment</button>
                <button class="text-red-600 hover:text-red-900" data-action="delete" data-fee-id="${fee._id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>`;
        
        return row;
    }
    
    resetFilters() {
        if (this.feeSearch) this.feeSearch.value = '';
        if (this.feesStatusFilter) this.feesStatusFilter.value = '';
        if (this.feesClassFilter) this.feesClassFilter.value = '';
        this.loadFeesWithFilters();
    }
    
    toggleSelectAll(event) {
        const checkboxes = document.querySelectorAll('.fee-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = event.target.checked;
        });
    }
    
    viewFee(feeId) {
        console.log('View fee:', feeId);
        // Implement view fee details functionality
        this.showNotification('Viewing fee details for: ' + feeId, 'info');
    }
    
// Main payment function
async recordPayment(feeId) {
    try {
        console.log('=== Starting recordPayment ===', feeId);

        const fee = await this.getFeeById(feeId);
        console.log("FULL FEE OBJECT:", fee);
        if (!fee) throw new Error('Fee record not found');

        const totalFees = parseFloat(fee.totalFees || fee.amount || 0);
        const paidAmount = parseFloat(fee.paidAmount || fee.amountPaid || 0);
        const balance = totalFees - paidAmount;

        if (balance <= 0) {
            this.showNotification('This fee is already fully paid', 'info');
            return;
        }

        // Show modal
        const paymentData = await this.showPaymentModal(fee, balance);
        if (!paymentData) return;

        const { amount: paymentAmount, paymentMethod, reference, notes } = paymentData;

        // Confirm payment
        const confirmPayment = confirm(
            `Confirm Payment Details:\nStudent: ${fee.studentName}\nClass: ${fee.className}\nAmount: ${this.formatCurrency(paymentAmount)}\nMethod: ${paymentMethod}\nReference: ${reference}\nNotes: ${notes}`
        );
        if (!confirmPayment) {
            this.showNotification('Payment cancelled', 'info');
            return;
        }

        // Send payment
        const token = localStorage.getItem('token');
        if (!token) throw new Error('You must be logged in');

        const paymentBtn = document.querySelector(`[data-action="record-payment"][data-fee-id="${feeId}"]`);
        const originalText = paymentBtn?.textContent || 'Record Payment';
        if (paymentBtn) { paymentBtn.disabled = true; paymentBtn.textContent = 'Processing...'; }

        const response = await fetch(`https://sheratoneducationcentre.onrender.com/api/fees/${feeId}/payments`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Payment failed: ${text}`);
        }

        const responseData = await response.json();
        const updatedFee = responseData.fee || responseData;

        // Refresh table
        await this.loadFeesWithFilters();
        this.showNotification('Payment recorded successfully', 'success');

        // Print receipt automatically
        this.printReceipt({
        studentName: fee.student?.name || 'N/A',
        className: fee.className,
        feeType: paymentData.feeType, // ✅ from modal
        term: paymentData.term,       // ✅ from modal
        amount: paymentAmount,
        paymentMethod,
        reference,
        balance: balance - paymentAmount
        });

        // Optional row update
        setTimeout(() => {
            const feeRow = document.querySelector(`tr[data-fee-id="${feeId}"]`);
            if (feeRow) this.createFeeRow(updatedFee).then(updatedRow => {
                if (updatedRow && feeRow.parentNode) feeRow.parentNode.replaceChild(updatedRow, feeRow);
            });
        }, 300);

    } catch (error) {
        console.error('Error recording payment:', error);
        this.showNotification(error.message || 'Failed to record payment', 'error');
        try { await this.loadFeesWithFilters(); } catch (_) {}
    } finally {
        const paymentBtn = document.querySelector(`[data-action="record-payment"][data-fee-id="${feeId}"]`);
        if (paymentBtn) { paymentBtn.disabled = false; paymentBtn.textContent = 'Record Payment'; }
    }
}

// Enhanced modal with radio buttons
async showPaymentModal(fee, balance) {
    return new Promise(resolve => {
        // Overlay
        const overlay = document.createElement('div');
        overlay.style = `
            position: fixed; top:0; left:0; width:100%; height:100%;
            background: rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:9999;
        `;

        // Modal
        const modal = document.createElement('div');
        modal.style = `
            background:#fff; padding:20px; border-radius:8px; width:350px; box-shadow:0 2px 10px rgba(0,0,0,0.3);
        `;
        modal.innerHTML = `
            <h2>Record Payment</h2>
            <p>Student: ${fee.studentName} (${fee.className})</p>
            <p>feeType: <strong>Tuition Fee</strong></p>
            <p>Balance: ${this.formatCurrency(balance)}</p>
            <label>Term:</label>
               <select id="modal-term" style="width:100%; margin-bottom:10px;">
               <option value="Term 1">Term 1</option>
               <option value="Term 2">Term 2</option>
               <option value="Term 3">Term 3</option>
               </select>
            <label>Amount:</label>
            <input type="number" id="modal-amount" min="0" max="${balance}" step="0.01" style="width:100%;margin-bottom:10px;">
            <label>Payment Method:</label>
            <div>
                <label><input type="radio" name="method" value="Cash" checked> Cash</label>
                <label><input type="radio" name="method" value="Mpesa"> Mpesa</label>
                <label><input type="radio" name="method" value="Bank"> Bank</label>
            </div>
            <div id="reference-container" style="display:none;margin-top:10px;">
                <label>Reference Number:</label>
                <input type="text" id="modal-reference" style="width:100%;">
            </div>
            <label>Notes (optional):</label>
            <input type="text" id="modal-notes" style="width:100%;margin-bottom:10px;">
            <div style="text-align:right;">
                <button id="modal-cancel" style="margin-right:5px;">Cancel</button>
                <button id="modal-submit">Submit</button>
            </div>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const amountInput = modal.querySelector('#modal-amount');
        const referenceContainer = modal.querySelector('#reference-container');
        const referenceInput = modal.querySelector('#modal-reference');
        const notesInput = modal.querySelector('#modal-notes');
        const submitBtn = modal.querySelector('#modal-submit');
        const cancelBtn = modal.querySelector('#modal-cancel');
        const radios = modal.querySelectorAll('input[name="method"]');

        const updateReference = () => {
            const method = Array.from(radios).find(r => r.checked).value;
            referenceContainer.style.display = (method === 'Mpesa' || method === 'Bank') ? 'block' : 'none';
        };
        radios.forEach(r => r.addEventListener('change', updateReference));
        updateReference();

        cancelBtn.onclick = () => { overlay.remove(); resolve(null); };
        submitBtn.onclick = () => {
            const amount = parseFloat(amountInput.value);
            const method = Array.from(radios).find(r => r.checked).value;
            const reference = (method === 'Mpesa' || method === 'Bank') ? referenceInput.value.trim() : `PAY-${Date.now()}`;
            const notes = notesInput.value.trim() || 'Payment recorded via accountant portal';
            const term = modal.querySelector('#modal-term').value;
            const feeType = 'Tuition Fee';

            if (!amount || amount <= 0 || amount > balance) return alert('Enter a valid amount');
            if ((method === 'Mpesa' || method === 'Bank') && !reference) return alert('Reference required');

            overlay.remove();
            resolve({ amount, paymentMethod: method, reference, notes, term, feeType });
        };
    });
}

// Receipt generation (fixed paymentMethod)
// Main payment function
async recordPayment(feeId) {
    try {
        console.log('=== Starting recordPayment ===', feeId);

        const fee = await this.getFeeById(feeId);
        if (!fee) throw new Error('Fee record not found');

        const totalFees = parseFloat(fee.totalFees || fee.amount || 0);
        const paidAmount = parseFloat(fee.paidAmount || fee.amountPaid || 0);
        const balance = totalFees - paidAmount;

        if (balance <= 0) {
            this.showNotification('This fee is already fully paid', 'info');
            return;
        }

        // Show modal
        const paymentData = await this.showPaymentModal(fee, balance);
        if (!paymentData) return;

        const { amount: paymentAmount, paymentMethod, reference, notes } = paymentData;

        // Confirm payment
        const confirmPayment = confirm(
            `Confirm Payment Details:\nStudent: ${fee.studentName}\nClass: ${fee.className}\nAmount: ${this.formatCurrency(paymentAmount)}\nMethod: ${paymentMethod}\nReference: ${reference}\nNotes: ${notes}`
        );
        if (!confirmPayment) {
            this.showNotification('Payment cancelled', 'info');
            return;
        }

        // Send payment
        const token = localStorage.getItem('token');
        if (!token) throw new Error('You must be logged in');

        const paymentBtn = document.querySelector(`[data-action="record-payment"][data-fee-id="${feeId}"]`);
        const originalText = paymentBtn?.textContent || 'Record Payment';
        if (paymentBtn) { paymentBtn.disabled = true; paymentBtn.textContent = 'Processing...'; }

        const response = await fetch(`https://sheratoneducationcentre.onrender.com/api/fees/${feeId}/payments`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Payment failed: ${text}`);
        }

        const responseData = await response.json();
        const updatedFee = responseData.fee || responseData;

        // Refresh table
        await this.loadFeesWithFilters();
        this.showNotification('Payment recorded successfully', 'success');

        // Print receipt automatically
        this.printReceipt({
        studentName: fee.student?.name || 'N/A',
        className: fee.className,
        feeType: paymentData.feeType, // ✅ from modal
        term: paymentData.term,       // ✅ from modal
        amount: paymentAmount,
        paymentMethod,
        reference,
        balance: balance - paymentAmount
        });

        // Optional row update
        setTimeout(() => {
            const feeRow = document.querySelector(`tr[data-fee-id="${feeId}"]`);
            if (feeRow) this.createFeeRow(updatedFee).then(updatedRow => {
                if (updatedRow && feeRow.parentNode) feeRow.parentNode.replaceChild(updatedRow, feeRow);
            });
        }, 300);

    } catch (error) {
        console.error('Error recording payment:', error);
        this.showNotification(error.message || 'Failed to record payment', 'error');
        try { await this.loadFeesWithFilters(); } catch (_) {}
    } finally {
        const paymentBtn = document.querySelector(`[data-action="record-payment"][data-fee-id="${feeId}"]`);
        if (paymentBtn) { paymentBtn.disabled = false; paymentBtn.textContent = 'Record Payment'; }
    }
}

// Enhanced modal with radio buttons
async showPaymentModal(fee, balance) {
    return new Promise(resolve => {
        // Overlay
        const overlay = document.createElement('div');
        overlay.style = `
            position: fixed; top:0; left:0; width:100%; height:100%;
            background: rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:9999;
        `;

        // Modal
        const modal = document.createElement('div');
        modal.style = `
            background:#fff; padding:20px; border-radius:8px; width:350px; box-shadow:0 2px 10px rgba(0,0,0,0.3);
        `;
        modal.innerHTML = `
            <h2>Record Payment</h2>
            <p>Student: ${fee.studentName} (${fee.className})</p>
            <p>feeType: <strong>Tuition Fee</strong></p>
            <p>Balance: ${this.formatCurrency(balance)}</p>
            <label>Term:</label>
             <select id="modal-term" style="width:100%; margin-bottom:10px;">
             <option value="Term 1">Term 1</option>
             <option value="Term 2">Term 2</option>
             <option value="Term 3">Term 3</option>
             </select>
            <label>Amount:</label>
            <input type="number" id="modal-amount" min="0" max="${balance}" step="0.01" style="width:100%;margin-bottom:10px;">
            <label>Payment Method:</label>
            <div>
                <label><input type="radio" name="method" value="Cash" checked> Cash</label>
                <label><input type="radio" name="method" value="Mpesa"> Mpesa</label>
                <label><input type="radio" name="method" value="Bank"> Bank</label>
            </div>
            <div id="reference-container" style="display:none;margin-top:10px;">
                <label>Reference Number:</label>
                <input type="text" id="modal-reference" style="width:100%;">
            </div>
            <label>Notes (optional):</label>
            <input type="text" id="modal-notes" style="width:100%;margin-bottom:10px;">
            <div style="text-align:right;">
                <button id="modal-cancel" style="margin-right:5px;">Cancel</button>
                <button id="modal-submit">Submit</button>
            </div>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const amountInput = modal.querySelector('#modal-amount');
        const referenceContainer = modal.querySelector('#reference-container');
        const referenceInput = modal.querySelector('#modal-reference');
        const notesInput = modal.querySelector('#modal-notes');
        const submitBtn = modal.querySelector('#modal-submit');
        const cancelBtn = modal.querySelector('#modal-cancel');
        const radios = modal.querySelectorAll('input[name="method"]');

        const updateReference = () => {
            const method = Array.from(radios).find(r => r.checked).value;
            referenceContainer.style.display = (method === 'Mpesa' || method === 'Bank') ? 'block' : 'none';
        };
        radios.forEach(r => r.addEventListener('change', updateReference));
        updateReference();

        cancelBtn.onclick = () => { overlay.remove(); resolve(null); };
        submitBtn.onclick = () => {
            const amount = parseFloat(amountInput.value);
            const method = Array.from(radios).find(r => r.checked).value;
            const reference = (method === 'Mpesa' || method === 'Bank') ? referenceInput.value.trim() : `PAY-${Date.now()}`;
            const notes = notesInput.value.trim() || 'Payment recorded via accountant portal';
            const term = modal.querySelector('#modal-term').value;
            const feeType = 'Tuition Fee';

            if (!amount || amount <= 0 || amount > balance) return alert('Enter a valid amount');
            if ((method === 'Mpesa' || method === 'Bank') && !reference) return alert('Reference required');

            overlay.remove();
            resolve({ amount, paymentMethod: method, reference, notes, term, feeType });
        };
    });
}

// Receipt generation (fixed paymentMethod)
printReceipt(data) {
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
        <html>
        <head><title>Payment Receipt</title>
        <style>
            body { font-family: Arial; padding: 20px; }
            h2 { text-align: center; }
            .receipt { border: 1px solid #000; padding: 20px; }
            .row { margin-bottom: 10px; }
        </style></head>
        <body>
            <div class="receipt">
                <h2>DESTINY DETERMINERS ACADEMY</h2>
                <p><strong>Receipt No:</strong> RCPT-${Date.now()}</p>
                <div class="row"><strong>Student:</strong> ${data.studentName}</div>
                <div class="row"><strong>Class:</strong> ${data.className}</div>
                <div class="row"><strong>Fee Type:</strong> ${data.feeType}</div>
                <div class="row"><strong>Term:</strong> ${data.term}</div>
                <div class="row"><strong>Amount Paid:</strong> ${this.formatCurrency(data.amount)}</div>
                <div class="row"><strong>Payment Method:</strong> ${data.paymentMethod}</div>
                ${data.reference ? `<div class="row"><strong>Reference:</strong> ${data.reference}</div>` : ''}
                <div class="row"><strong>Balance:</strong> ${this.formatCurrency(data.balance)}</div>
                <div class="row"><strong>Date:</strong> ${new Date().toLocaleString()}</div>
            </div>
            <script>window.onload = () => window.print();</script>
        </body>
        </html>
    `);
    receiptWindow.document.close();
}
    /**
     * View payment history for a specific fee
     * @param {string} feeId - The ID of the fee to view
     */
    async viewFee(feeId) {
        console.log('viewFee called with ID:', feeId);
        
        try {
            // Show loading state
            this.showNotification('Loading payment history...', 'info');
            
            // Get fee details
            const fee = await this.getFeeById(feeId);
            if (!fee) {
                throw new Error('Could not load fee details');
            }
            
            console.log('Loaded fee data:', fee);
            
            // Get student name
            let studentName = 'N/A';
            if (fee.student) {
                if (typeof fee.student === 'object') {
                    studentName = fee.student.name || 
                                (fee.student.firstName && fee.student.lastName ? 
                                    `${fee.student.firstName} ${fee.student.lastName}` : 
                                    'N/A');
                } else {
                    studentName = 'Student ' + fee.student.substring(0, 6) + '...';
                }
            }
            
            // Create scrollable and centered modal
            const modalHTML = `
                <div id="payment-history-modal" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.7);
                    z-index: 9999;
                    overflow-y: auto;
                    padding: 1rem;
                    box-sizing: border-box;
                ">
                    <div style="
                        background: white;
                        border-radius: 0.75rem;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                        width: 95%;
                        max-width: 56rem;
                        min-height: 200px;
                        margin: 1rem auto;
                        display: flex;
                        flex-direction: column;
                        position: relative;
                    ">
                        <!-- Modal Header -->
                        <div class="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h3 class="text-xl font-bold text-gray-900">
                                    Payment History
                                </h3>
                                <p class="text-sm text-gray-500">
                                    ${studentName} • ${fee.className || 'N/A'}
                                </p>
                            </div>
                            <button id="close-payment-modal" class="text-gray-400 hover:text-gray-600 transition-colors">
                                <span class="sr-only">Close</span>
                                <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <!-- Modal Body -->
                        <div class="px-6 py-4" style="overflow-y: auto; max-height: 70vh;">
                            <!-- Fee Summary -->
                            <div class="bg-blue-50 p-5 rounded-xl mb-6 border border-blue-100">
                                <h4 class="text-md font-medium text-gray-900 mb-3">Fee Summary</h4>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <p class="text-sm text-gray-500">Total Amount</p>
                                        <p class="text-lg font-semibold">${this.formatCurrency(fee.totalAmount || 0)}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-500">Paid Amount</p>
                                        <p class="text-lg font-semibold text-green-600">${this.formatCurrency(fee.paidAmount || 0)}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-500">Balance</p>
                                        <p class="text-lg font-semibold ${(fee.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}">
                                            ${this.formatCurrency(fee.balance || 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Payment History -->
                            <div>
                                <h4 class="text-md font-medium text-gray-900 mb-3">Payment History</h4>
                                ${fee.payments && fee.payments.length > 0 ? `
                                    <div class="overflow-x-auto">
                                        <table class="min-w-full divide-y divide-gray-200">
                                            <thead class="bg-gray-50">
                                                <tr>
                                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody class="bg-white divide-y divide-gray-200">
                                                ${fee.payments.map(payment => `
                                                    <tr>
                                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            ${this.formatDate(payment.paymentDate || payment.createdAt)}
                                                        </td>
                                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            ${payment.reference || 'N/A'}
                                                        </td>
                                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            ${payment.paymentMethod || 'Cash'}
                                                        </td>
                                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                                                            +${this.formatCurrency(payment.amount || 0)}
                                                        </td>
                                                        <td class="px-6 py-4 text-sm text-gray-500">
                                                            ${payment.notes || '—'}
                                                        </td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                ` : `
                                    <div class="text-center py-8 text-gray-500">
                                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h3 class="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
                                        <p class="mt-1 text-sm text-gray-500">Record a payment to see the history here.</p>
                                    </div>
                                `}
                            </div>
                        </div>
                        
                        <!-- Modal Footer -->
                        <div class="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
                            <button type="button" id="close-payment-modal-btn" class="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to the DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Add event listeners for closing the modal
            const closeModal = () => {
                const modal = document.getElementById('payment-history-modal');
                if (modal) {
                    modal.remove();
                }
                document.removeEventListener('keydown', handleEscape);
            };
            
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                }
            };
            
            // Close button handlers
            const closeBtn = document.getElementById('close-payment-modal');
            const closeBtn2 = document.getElementById('close-payment-modal-btn');
            
            if (closeBtn) closeBtn.addEventListener('click', closeModal);
            if (closeBtn2) closeBtn2.addEventListener('click', closeModal);
            
            document.addEventListener('keydown', handleEscape);
            
            // Close modal when clicking outside the content
            const modal = document.getElementById('payment-history-modal');
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        closeModal();
                    }
                });
            }
            
        } catch (error) {
            console.error('Error in viewFee:', error);
            this.showNotification(`Error: ${error.message || 'Failed to load payment history'}`, 'error');
        }
    }
    
    async getFeeById(feeId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return null;
            }

            const response = await fetch(`https://sheratoneducationcentre.onrender.com/api/fees/${feeId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch fee: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching fee:', error);
            this.showNotification(`Error loading fee details: ${error.message}`, 'error');
            return null;
        }
    }
    
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        container.appendChild(notification);
        
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 300);
            });
        }
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    window.accountantFees = new AccountantFees();

    // 🔥 THIS loads the table
    if (typeof window.accountantFees.loadFeesWithFilters === 'function') {
        await window.accountantFees.loadFeesWithFilters();
    }
});
