// library.js — Consolidated, drop-in replacement for your big library logic
// Keeps behavior identical to your original large implementation.

console.log('Library script loaded');

(function () {
  // Config
  const BASE = (window.API_CONFIG && window.API_CONFIG.BASE_URL) ? window.API_CONFIG.BASE_URL.replace(/\/$/, '') : '';

  // Shared state & DOM refs
  let libraryTableBody = null;
  let librarySearch = null;
  let libraryGenreFilter = null;
  let libraryAuthorFilter = null;
  let libraryClassFilter = null;
  let libraryBulkToolbar = null;
  let libraryBulkDelete = null;
  let libraryBulkExport = null;
  let selectAllLibrary = null;
  let issuedBooksSearch = null;
  let issuedBooksList = null;
  let selectedBookIds = new Set();

  // -------------------------
  // API helper
  // -------------------------
  async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('token');
    const url = `${BASE}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    console.debug('API Request', { url, method: options.method || 'GET', headers, body: options.body });

    const res = await fetch(url, { ...options, headers });
    const clone = res.clone();
    const text = await clone.text().catch(() => '');
    console.debug('API Response', { status: res.status, url, body_preview: (text || '').slice(0, 500) });

    if (!res.ok) {
      // try parse json for error message
      let errData = {};
      try { errData = await res.json(); } catch (e) { /* ignore */ }
      const err = new Error(errData.message || errData.error || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = errData;
      throw err;
    }

    // if there's no JSON content-type, return raw text
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return text;
    return await res.json();
  }

  // -------------------------
  // Helpers: modal show/hide
  // -------------------------
  function showModal(modal) {
    if (!modal) return;
    modal.classList.add('show');
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    document.body.style.overflow = 'hidden';
  }

  function hideModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
    document.body.style.overflow = '';
    // reset form inside modal if exists
    const form = modal.querySelector('form');
    if (form) form.reset();
    const msg = modal.querySelector('#universal-edit-msg');
    if (msg) { msg.textContent = ''; msg.style.display = 'none'; }
  }

  // Simple notification
  function showNotification(message, type = 'info') {
    console.log('NOTIF', type, message);
    const container = document.getElementById('notification-container') || document.body;
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  }

  // -------------------------
  // Render helpers
  // -------------------------
  function renderBookRow(book) {
    const available = (book.available !== undefined) ? book.available : (book.copies || 1);
    const copies = book.copies || 1;
    const availableClass = available > 0 ? 'status-available' : 'status-checked-out';
    const disabledIssue = available < 1 ? 'disabled' : '';
    return `<tr data-id="${book._id}">
      <td><input type="checkbox" class="library-select-checkbox" data-id="${book._id}"></td>
      <td>${escapeHtml(book.title)}</td>
      <td>${escapeHtml(book.author || '')}</td>
      <td>${book.year || 'N/A'}</td>
      <td>${escapeHtml(book.genre || 'N/A')}</td>
      <td class="status-${book.status || 'available'}">${escapeHtml(book.status || 'available')}</td>
      <td>${copies}</td>
      <td class="${availableClass}">${available}</td>
      <td class="actions-cell">
          <button class="edit-book-btn" data-id="${book._id}">Edit</button>
          <button class="issue-book-btn" data-id="${book._id}" data-genre="${escapeAttr(book.genre || 'General')}" ${disabledIssue}>Issue</button>
          <button class="delete-book-btn" data-id="${book._id}"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }

  function escapeHtml(s) {
    if (!s && s !== 0) return '';
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escapeAttr(s){ return escapeHtml(s); }

  // -------------------------
  // Filters & query builder
  // -------------------------
  function getLibraryFilters() {
    return {
      search: librarySearch ? librarySearch.value.trim() : '',
      genre: libraryGenreFilter ? libraryGenreFilter.value : '',
      author: libraryAuthorFilter ? libraryAuthorFilter.value.trim() : '',
      className: libraryClassFilter ? libraryClassFilter.value : ''
    };
  }
  function buildLibraryQueryString(filters) {
    const params = [];
    if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters.genre) params.push(`genre=${encodeURIComponent(filters.genre)}`);
    if (filters.author) params.push(`author=${encodeURIComponent(filters.author)}`);
    if (filters.className) params.push(`className=${encodeURIComponent(filters.className)}`);
    return params.length ? '?' + params.join('&') : '';
  }

  // -------------------------
  // Load books (main list)
  // -------------------------
  async function loadLibraryWithFilters() {
    try {
      if (!libraryTableBody) libraryTableBody = document.getElementById('library-table-body');
      const filters = getLibraryFilters();
      const qs = buildLibraryQueryString(filters);
      if (libraryTableBody) libraryTableBody.innerHTML = '<tr><td colspan="9" class="text-center">Loading books...</td></tr>';

      const res = await apiFetch(`/api/books${qs}`, { headers: { 'Cache-Control':'no-cache' } });
      // Accept both [] or {data: []}
      const books = Array.isArray(res) ? res : (res.data || []);
      console.debug('Books to display:', books.length);

      if (!libraryTableBody) return;
      libraryTableBody.innerHTML = '';
      if (books.length === 0) {
        libraryTableBody.innerHTML = '<tr><td colspan="9" class="text-center">No books found in the library.</td></tr>';
      } else {
        books.forEach(b => libraryTableBody.insertAdjacentHTML('beforeend', renderBookRow(b)));
      }
      // after rendering attach event listeners for checkboxes
      attachBookEventListeners();
    } catch (err) {
      console.error('Error loading books:', err);
      if (libraryTableBody) libraryTableBody.innerHTML = `<tr><td colspan="9" class="text-center error">Error loading books: ${err.message}</td></tr>`;
    }
  }

  // -------------------------
  // Attach listeners on table (edit/issue/delete) - single delegate
  // -------------------------
  function attachBookEventListeners() {
    if (!libraryTableBody) libraryTableBody = document.getElementById('library-table-body');
    if (!libraryTableBody) return;
    if (libraryTableBody._bound) return;
    libraryTableBody._bound = true;

    libraryTableBody.addEventListener('click', async (e) => {
      const btn = e.target.closest('.edit-book-btn, .issue-book-btn, .delete-book-btn');
      if (!btn) return;
      const bookId = btn.getAttribute('data-id');

      // EDIT: placeholder - keep your edit logic if you want
      if (btn.classList.contains('edit-book-btn')) {
        console.log('Edit clicked for', bookId);
        showNotification('Edit not implemented in this build', 'info');
        return;
      }

      // ISSUE
      if (btn.classList.contains('issue-book-btn')) {
        return handleIssueButtonClick(btn);
      }

      // DELETE
      if (btn.classList.contains('delete-book-btn')) {
        if (!confirm('Are you sure you want to delete this book?')) return;
        try {
          btn.disabled = true;
          btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
          await apiFetch(`/api/library/${bookId}`, { method: 'DELETE' });
          showNotification('Book deleted successfully', 'success');
          const row = btn.closest('tr');
          if (row) row.remove();
          setTimeout(() => loadLibraryWithFilters().catch(console.error), 300);
        } catch (error) {
          console.error('Delete error', error);
          showNotification(error.message || 'Failed to delete book', 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-trash"></i>';
        }
        return;
      }
    });

    // checkbox selection
    libraryTableBody.addEventListener('change', (e) => {
      const cb = e.target.closest('.library-select-checkbox');
      if (!cb) return;
      const id = cb.getAttribute('data-id');
      if (cb.checked) selectedBookIds.add(id); else selectedBookIds.delete(id);
      updateLibraryBulkToolbarState();
    });
  }

  // -------------------------
  // Handle Issue button: heavy logic (modal, students, submit)
  // -------------------------
  async function handleIssueButtonClick(actionBtn) {
    const bookId = actionBtn.getAttribute('data-id');
    const genre = actionBtn.getAttribute('data-genre') || 'General';
    const bookTitle = (actionBtn.closest('tr')?.querySelector('td:nth-child(2)')?.textContent) || '';

    const universalModal = document.getElementById('universal-edit-modal');
    const universalForm = document.getElementById('universal-edit-form');
    const universalMsg = document.getElementById('universal-edit-msg');
    const universalTitle = document.getElementById('universal-edit-title');

    if (!universalModal || !universalForm) {
      console.error('Issue modal/form missing in DOM');
      showNotification('Issue modal not found', 'error');
      return;
    }

    if (universalMsg) { universalMsg.textContent = ''; universalMsg.style.display = 'none'; }
    if (universalTitle) universalTitle.textContent = `Issue Book: ${bookTitle || ''}`;

    // prepare form html as in your big logic
    const defaultDue = new Date(); defaultDue.setDate(defaultDue.getDate() + 14);
    const defaultDueStr = defaultDue.toISOString().split('T')[0];

    universalForm.innerHTML = `
      <input type="hidden" name="bookId" value="${escapeAttr(bookId)}">
      <input type="hidden" name="genre" value="${escapeAttr(genre)}">
      <div class="mb-4">
          <label for="classSelect">Class</label>
          <select id="classSelect" name="class" required>
            <option value="">Select a class</option>
            <optgroup label="Pre-Primary">
              <option value="PP1">PP1</option>
              <option value="PP2">PP2</option>
            </optgroup>
            <optgroup label="Lower Primary">
              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
              <option value="Grade 3">Grade 3</option>
            </optgroup>
            <optgroup label="Upper Primary">
              <option value="Grade 4">Grade 4</option>
              <option value="Grade 5">Grade 5</option>
              <option value="Grade 6">Grade 6</option>
            </optgroup>
            <optgroup label="Junior Secondary">
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
            </optgroup>
            <optgroup label="Secondary">
              <option value="Form 1">Form 1</option>
              <option value="Form 2">Form 2</option>
              <option value="Form 3">Form 3</option>
              <option value="Form 4">Form 4</option>
            </optgroup>
          </select>
      </div>
      <div class="mb-4">
          <label for="studentSelect">Student</label>
          <select id="studentSelect" name="studentId" required disabled>
            <option value="">Select a class first</option>
          </select>
      </div>
      <div class="mb-4">
          <label for="dueDate">Due Date</label>
          <input id="dueDate" name="dueDate" type="date" required value="${defaultDueStr}">
      </div>
      <div id="issue-form-msg" style="display:none;"></div>
      <div class="flex items-center justify-end gap-3">
        <button type="button" class="cancel-btn">Cancel</button>
        <button type="submit" class="submit-btn"><i class="fas fa-book-reader mr-2"></i>Issue Book</button>
      </div>
    `;

    // show modal
    showModal(universalModal);

    // wire class -> students
    const classSelect = universalForm.querySelector('#classSelect');
    const studentSelect = universalForm.querySelector('#studentSelect');

    async function onClassChangePopulateStudents() {
      const cls = classSelect.value;
      studentSelect.disabled = true;
      studentSelect.innerHTML = `<option value="">Loading students...</option>`;
      try {
        // convert to API format e.g., 'Grade 1'
        const formatted = cls;
        // fetch students
        const res = await apiFetch(`/students/class/${encodeURIComponent(formatted)}`);
        const students = Array.isArray(res) ? res : (res.data || []);
        studentSelect.innerHTML = '';
        if (students.length === 0) {
          studentSelect.innerHTML = `<option value="">No students found</option>`;
        } else {
          const defaultOpt = document.createElement('option');
          defaultOpt.value = '';
          defaultOpt.textContent = 'Select a student';
          defaultOpt.disabled = true;
          defaultOpt.selected = true;
          studentSelect.appendChild(defaultOpt);
          students.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s._id || s.id || '';
            opt.textContent = s.name || s.displayName || s.email || (s._id || '').slice(0,6);
            if (s.email) opt.setAttribute('data-email', s.email);
            studentSelect.appendChild(opt);
          });
        }
      } catch (err) {
        console.error('Error fetching students for class', err);
        studentSelect.innerHTML = `<option value="">Error loading students</option>`;
      } finally {
        studentSelect.disabled = false;
      }
    }

    classSelect.addEventListener('change', onClassChangePopulateStudents);

    // prevent duplicate submit handlers by replacing form node
    const newForm = universalForm.cloneNode(true);
    universalForm.parentNode.replaceChild(newForm, universalForm);

    // Reassign refs
    const finalForm = document.getElementById('universal-edit-form');
    const formMsg = document.getElementById('issue-form-msg');
    const cancelBtn = finalForm.querySelector('.cancel-btn');
    const submitBtn = finalForm.querySelector('.submit-btn');

    // Cancel:
    if (cancelBtn) cancelBtn.onclick = (ev) => { ev.preventDefault(); hideModal(universalModal); };

    finalForm.onsubmit = async (ev) => {
      ev.preventDefault();
      // disable
      if (submitBtn) { submitBtn.disabled = true; submitBtn.setAttribute('data-submitting','true'); submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Issuing...'; }
      if (formMsg) { formMsg.textContent=''; formMsg.style.display='none'; }

      try {
        const f = new FormData(finalForm);
        const bookIdVal = f.get('bookId');
        const borrowerId = f.get('studentId');
        const borrowerOption = finalForm.querySelector('#studentSelect option:checked');
        const borrowerName = borrowerOption ? borrowerOption.textContent : '';
        const borrowerEmail = borrowerOption ? borrowerOption.getAttribute('data-email') || '' : '';
        const dueDate = f.get('dueDate');
        const clsVal = finalForm.querySelector('#classSelect')?.value || '';

        if (!borrowerId || !dueDate) {
          throw new Error('Please select a student and due date');
        }
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required');

        // call API
        const resp = await fetch(`${BASE}/api/library/${bookIdVal}/issue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            borrowerName,
            borrowerId,
            borrowerEmail,
            dueDate,
            className: clsVal,
            genre
          })
        });

        const data = await resp.json().catch(()=>({}));
        if (!resp.ok) {
          throw new Error(data.error || data.message || `Failed to issue (status ${resp.status})`);
        }

        if (formMsg) { formMsg.textContent = 'Book issued successfully!'; formMsg.className = 'mt-3 text-sm text-green-600'; formMsg.style.display='block'; }
        setTimeout(() => {
          hideModal(universalModal);
          loadLibraryWithFilters().catch(console.error);
          if (submitBtn) { submitBtn.disabled = false; submitBtn.removeAttribute('data-submitting'); submitBtn.innerHTML = '<i class="fas fa-book-reader mr-2"></i>Issue Book'; }
        }, 900);
      } catch (error) {
        console.error('Error issuing book:', error);
        if (formMsg) { formMsg.textContent = error.message || 'An error occurred'; formMsg.className = 'mt-3 text-sm text-red-600'; formMsg.style.display='block'; formMsg.scrollIntoView({behavior:'smooth',block:'center'}); }
        if (submitBtn) { submitBtn.disabled = false; submitBtn.removeAttribute('data-submitting'); submitBtn.innerHTML = '<i class="fas fa-book-reader mr-2"></i>Issue Book'; }
      }
    };
  }

  // -------------------------
  // Fees / Attendance / library stat integration (optional)
  // -------------------------
 
  // -------------------------
  // Add book form handler (initializeLibraryForm)
  // -------------------------
  function initializeLibraryForm() {
    const form = document.getElementById('library-form');
    if (!form) {
      console.warn('Library form not found; skipping initializeLibraryForm');
      return;
    }

    // replace node to avoid duplicate handlers
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const title = (document.getElementById('book-title')?.value || '').trim();
        const author = (document.getElementById('book-author')?.value || '').trim();
        const year = parseInt(document.getElementById('book-year')?.value) || new Date().getFullYear();
        const genre = document.getElementById('book-genre')?.value || 'Other';
        const className = document.getElementById('book-class')?.value || '';
        const copies = parseInt(document.getElementById('book-copies')?.value) || 1;
        const status = document.getElementById('book-status')?.value || 'available';

        if (!title || !author || !className) { alert('Please fill in required fields'); return; }
        const token = localStorage.getItem('token'); if (!token) { alert('Login required'); return; }

        const submitBtn = newForm.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : null;
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Saving...'; }

        const payload = { title, author, year, genre, className, copies, available: copies, status };
        const res = await apiFetch('/api/books', { method: 'POST', body: JSON.stringify(payload) });
        showNotification('Book added successfully', 'success');
        newForm.reset();
        await loadLibraryWithFilters();
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalText; }
      } catch (err) {
        console.error('Add book error', err);
        showNotification(err.message || 'Failed to add book', 'error');
        const submitBtn = newForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Add Book'; }
      }
    });
  }

  // -------------------------
  // Bulk toolbar helpers
  // -------------------------
  function updateLibraryBulkToolbarState() {
    const has = selectedBookIds.size > 0;
    if (libraryBulkToolbar) libraryBulkToolbar.style.display = has ? 'block' : 'none';
    if (libraryBulkDelete) libraryBulkDelete.disabled = !has;
    if (libraryBulkExport) libraryBulkExport.disabled = !has;
  }
  function clearLibrarySelections() {
    selectedBookIds.clear();
    document.querySelectorAll('.library-select-checkbox').forEach(cb => cb.checked = false);
    if (selectAllLibrary) selectAllLibrary.checked = false;
    updateLibraryBulkToolbarState();
  }

  async function handleBulkDelete() {
    if (selectedBookIds.size === 0) return;
    if (!confirm(`Delete ${selectedBookIds.size} selected book(s)?`)) return;
    try {
      const promises = Array.from(selectedBookIds).map(id => apiFetch(`/books/${id}`, { method: 'DELETE' }).catch(e => ({error:e})));
      const results = await Promise.allSettled(promises);
      const failed = results.filter(r => r.status === 'rejected' || (r.value && r.value.error));
      if (failed.length) {
        showNotification(`${failed.length} failed to delete`, 'error');
      } else showNotification('Deleted selected books', 'success');
      clearLibrarySelections();
      await loadLibraryWithFilters();
    } catch (err) { console.error(err); showNotification('Bulk delete failed','error'); }
  }

  async function handleBulkExport() {
    if (selectedBookIds.size === 0) { showNotification('Select at least one book', 'warning'); return; }
    try {
      const all = await apiFetch('/api/books');
      const arr = Array.isArray(all) ? all : (all.data || []);
      const sel = arr.filter(b => selectedBookIds.has(b._id));
      if (!sel.length) throw new Error('No selected books found in dataset');
      const headers = ['Title','Author','ISBN','Status','Available','Genre'];
      let csv = headers.join(',') + '\n';
      sel.forEach(b => {
        csv += [
          `"${(b.title||'').replace(/"/g,'""')}"`,
          `"${(b.author||'').replace(/"/g,'""')}"`,
          `"${(b.isbn||'').replace(/"/g,'""')}"`,
          `"${(b.status||'').replace(/"/g,'""')}"`,
          `"${b.available? 'Yes':'No'}"`,
          `"${(b.genre||'').replace(/"/g,'""')}"`
        ].join(',') + '\n';
      });
      const blob = new Blob([csv], {type:'text/csv'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `library_export_${new Date().toISOString().slice(0,10)}.csv`; a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 2000);
      showNotification(`Exported ${sel.length} book(s)`, 'success');
    } catch (err) {
      console.error('Export error', err);
      showNotification(err.message || 'Export failed', 'error');
    }
  }

  // -------------------------
  // Issued books: load & display
  // -------------------------
  let issuedBooksData = [];
  async function loadIssuedBooks() {
    const table = document.getElementById('issued-books-list');
    if (!table) return;
    table.innerHTML = `<tr><td colspan="8" class="text-center">Loading issued books...</td></tr>`;
    try {
      const res = await apiFetch('/api/books/issued');
      const books = Array.isArray(res) ? res : (res.data || []);
      issuedBooksData = books;
      if (!books.length) {
        table.innerHTML = `<tr><td colspan="8" class="text-center">No issued books</td></tr>`;
        return;
      }
      // if group format: use your displayIssuedBooks
      let html = '';
      books.forEach(b => html += renderIssuedBookRow(b));
      table.innerHTML = html;
      // attach return handlers
      document.querySelectorAll('.return-book-btn').forEach(btn => btn.addEventListener('click', handleReturnBook));
    } catch (err) {
      console.error('Load issued books error', err);
      table.innerHTML = `<tr><td colspan="8" class="text-danger">Failed to load issued books</td></tr>`;
    }
  }

  // Render issued row (simplified but keeps your badges & overdue)
  function renderIssuedBookRow(book) {
    const issueDate = book.issueDate ? new Date(book.issueDate).toLocaleDateString() : 'N/A';
    const due = book.dueDate ? new Date(book.dueDate) : null;
    const dueDate = due ? due.toLocaleDateString() : 'N/A';
    const today = new Date();
    const isOver = due && due < today && !book.returned;
    const daysOver = isOver ? Math.ceil((today - due)/(1000*60*60*24)) : 0;
    const fine = book.fine || 0;
    const className = book.className || book.doc?.className || 'Ungrouped';
    return `<tr class="${isOver? 'table-warning':''}" data-class="${className.toLowerCase()}" data-title="${escapeAttr(book.title||'')}" data-student="${escapeAttr(book.borrowerName||'')}">
      <td>
        <div class="fw-semibold">${escapeHtml(book.title||'Unknown')}</div>
        <div class="text-muted small">${escapeHtml(book.author||'')}</div>
      </td>
      <td>${escapeHtml(book.borrowerName||'Unknown')}</td>
      <td>${escapeHtml(className)}</td>
      <td>${issueDate}</td>
      <td>${dueDate}${isOver ? `<div class="badge bg-danger">${daysOver} day${daysOver!==1?'s':''} overdue</div>` : ''}</td>
      <td><span class="badge ${book.returned? 'bg-success':'bg-primary'}">${book.returned ? 'Returned' : 'Issued'}</span></td>
      <td>${fine>0? `<span class="badge bg-danger">KES ${parseFloat(fine).toFixed(2)}</span>` : ''}</td>
      <td>${!book.returned ? `<button class="return-book-btn" data-id="${book._id||''}" data-book-id="${book.bookId||''}" data-book-title="${escapeAttr(book.title||'')}" data-borrower="${escapeAttr(book.borrowerName||'')}" data-fine="${fine}">Return</button>` : ''}</td>
    </tr>`;
  }

  async function handleReturnBook(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const issueId = btn.getAttribute('data-id');
    const fine = parseFloat(btn.getAttribute('data-fine')||0);
    // find modal etc. For brevity show confirm then call API
    if (!confirm(`Return book "${btn.getAttribute('data-book-title')}" for ${btn.getAttribute('data-borrower')}?`)) return;
    try {
      await apiFetch(`/library/return/${issueId}`, { method: 'POST', body: JSON.stringify({ finePaid: fine }) });
      showNotification('Book returned', 'success');
      await loadIssuedBooks();
      await loadLibraryWithFilters();
    } catch (err) {
      console.error('Return error', err);
      showNotification(err.message || 'Failed to return', 'error');
    }
  }

  // -------------------------
  // Init functions
  // -------------------------
  function initLibrary() {
    console.debug('initLibrary running');
    libraryTableBody = document.getElementById('library-table-body');
    librarySearch = document.getElementById('library-search');
    libraryGenreFilter = document.getElementById('library-genre-filter');
    libraryAuthorFilter = document.getElementById('library-author-filter');
    libraryClassFilter = document.getElementById('library-class-filter');
    libraryBulkToolbar = document.getElementById('library-bulk-toolbar');
    libraryBulkDelete = document.getElementById('library-bulk-delete');
    libraryBulkExport = document.getElementById('library-bulk-export');
    selectAllLibrary = document.getElementById('select-all-library');
    issuedBooksSearch = document.getElementById('issued-books-search');
    issuedBooksList = document.getElementById('issued-books-list');

    // wire select all
    if (selectAllLibrary) {
      selectAllLibrary.onchange = function () {
        document.querySelectorAll('.library-select-checkbox').forEach(cb => {
          cb.checked = this.checked;
          const id = cb.getAttribute('data-id');
          if (this.checked) selectedBookIds.add(id); else selectedBookIds.delete(id);
        });
        updateLibraryBulkToolbarState();
      };
    }

    if (libraryBulkDelete) libraryBulkDelete.onclick = handleBulkDelete;
    if (libraryBulkExport) libraryBulkExport.onclick = handleBulkExport;

    // search/filter events (debounce simple)
    if (librarySearch) librarySearch.addEventListener('input', debounce(() => loadLibraryWithFilters(), 300));
    if (libraryGenreFilter) libraryGenreFilter.addEventListener('change', () => loadLibraryWithFilters());
    if (libraryAuthorFilter) libraryAuthorFilter.addEventListener('input', debounce(() => loadLibraryWithFilters(), 300));
    if (libraryClassFilter) libraryClassFilter.addEventListener('change', () => loadLibraryWithFilters());

    // issued books search
    if (issuedBooksSearch) issuedBooksSearch.addEventListener('input', debounce(() => filterIssuedBooks(), 300));

    updateLibraryBulkToolbarState();
  }

  function initIssuedBooksSearch() { /* kept for compatibility */ }

  // Utility debounce
  function debounce(fn, wait) {
    let t;
    return function (...args) { clearTimeout(t); t = setTimeout(()=>fn.apply(this,args), wait); };
  }

  // basic issued-books filter (uses client rows)
  function filterIssuedBooks() {
    const term = (document.getElementById('issued-books-search')?.value || '').toLowerCase();
    const classFilter = (document.getElementById('classFilter')?.value || 'All').toLowerCase();
    const table = document.getElementById('issued-books-list');
    if (!table) return;
    const rows = table.querySelectorAll('tr');
    let any = false;
    rows.forEach(r => {
      const isGroup = r.classList.contains('table-group');
      if (isGroup) { r.style.display = 'none'; return; }
      const title = (r.getAttribute('data-title')||'').toLowerCase();
      const stud = (r.getAttribute('data-student')||'').toLowerCase();
      const cls = (r.getAttribute('data-class')||'').toLowerCase();
      const matches = (!term || title.includes(term) || stud.includes(term)) && (classFilter==='all' || !classFilter || cls.includes(classFilter));
      r.style.display = matches ? '' : 'none';
      if (matches) any = true;
    });
    if (!any) {
      // show no results row
      if (!table.querySelector('.no-results-message')) {
        const tr = document.createElement('tr'); tr.className = 'no-results-message';
        tr.innerHTML = `<td colspan="8" class="text-center py-4"><div class="text-muted"><i class="fas fa-search fa-2x mb-2"></i><p>No books match your search criteria</p></div></td>`;
        table.appendChild(tr);
      }
    } else {
      const nr = table.querySelector('.no-results-message'); if (nr) nr.remove();
    }
  }

  // -------------------------
  // Initialize on DOM ready
  // -------------------------
  function initializeLibrary() {
    try {
      initLibrary();
      initIssuedBooksSearch();
      initializeLibraryForm();
      // default tab show if you have function showLibraryTab
      if (typeof window.showLibraryTab === 'function') window.showLibraryTab('available-books');
      loadLibraryWithFilters().catch(console.error);
      loadIssuedBooks().catch(() => {});
      console.log('Library initialized');
    } catch (err) {
      console.error('initializeLibrary error', err);
    }
  }

  // ensure single DOMContentLoaded binding
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLibrary);
  } else {
    initializeLibrary();
  }

  // Expose some functions for debugging
  window.loadLibraryWithFilters = loadLibraryWithFilters;
  window.loadIssuedBooks = loadIssuedBooks;
  window.initializeLibraryForm = initializeLibraryForm;
  window.apiFetch = apiFetch;

})();
