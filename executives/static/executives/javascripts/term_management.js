document.addEventListener('DOMContentLoaded', () => {
  const addNewTermBtn = document.getElementById('addNewTermBtn');
  const termButtonsContainer = document.getElementById('termButtonsContainer');
  let submitted = false;

  // Animation helper function
  function animateIn(element) {
    if (!element) return;
    element.style.opacity = '0';
    element.style.transform = 'scale(0.95)';
    element.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';
    });
  }

  // Load terms from backend
  function loadTerms() {
    const loadingSpinner = document.getElementById('loadingSpinner');

    fetch('/executives/terms/')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        // Hide loading spinner
        if (loadingSpinner) {
          loadingSpinner.classList.add('hidden');
        }

        termButtonsContainer.innerHTML = '';
        data.terms.forEach(term => createTermButton(term));
      })
      .catch(error => {
        console.error('Error loading terms:', error);
        // Hide loading spinner on error too
        if (loadingSpinner) {
          loadingSpinner.classList.add('hidden');
        }
      });
  }

  // Create a term button
  function createTermButton(term) {
    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'd-flex flex-column align-items-center mb-2';

    const button = document.createElement('button');
    button.className = 'term-button d-flex align-items-center gap-2 px-3 py-2 rounded';
    button.dataset.termId = term.id;

    // Icon
    const icon = document.createElement('span');
    icon.className = 'term-icon';
    icon.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="20" rx="4" fill="#3b82f6"/>
        <rect x="4" y="8" width="24" height="20" rx="4" stroke="#2563eb" stroke-width="2"/>
        <rect x="8" y="4" width="2" height="6" rx="1" fill="#2563eb"/>
        <rect x="22" y="4" width="2" height="6" rx="1" fill="#2563eb"/>
        <rect x="10" y="14" width="4" height="4" rx="1" fill="#fff"/>
        <rect x="18" y="14" width="4" height="4" rx="1" fill="#fff"/>
        <rect x="10" y="20" width="4" height="4" rx="1" fill="#fff"/>
        <rect x="18" y="20" width="4" height="4" rx="1" fill="#fff"/>
      </svg>
    `;

    const label = document.createElement('span');
    label.textContent = term.name;

    button.appendChild(icon);
    button.appendChild(label);

    // Date info
    if (term.semStart || term.endDate || term.resultDate) {
      const dateInfo = document.createElement('div');
      dateInfo.className = 'small text-muted mt-1 w-100';
      dateInfo.innerHTML = `
        ${term.semStart ? `<div>Sem Start: <span class="readonly-date">${term.semStart}</span></div>` : ''}
        ${term.endDate ? `<div>End Date: <span class="readonly-date">${term.endDate}</span></div>` : ''}
        ${term.resultDate ? `<div>Result Date: <span class="readonly-date">${term.resultDate}</span></div>` : ''}
      `;
      button.appendChild(dateInfo);
    }

    // Delete icon
    const deleteIcon = document.createElement('span');
    deleteIcon.className = 'deleteIcon ms-2';
    deleteIcon.innerHTML = `
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="text-red-500 hover:text-red-700">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    `;
    deleteIcon.title = 'Delete term';
    deleteIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      showDeleteConfirm(term.id, term.name);
    });
    button.appendChild(deleteIcon);

    button.addEventListener('click', handleTermButtonClick);
    button.addEventListener('dblclick', () => makeButtonEditable(button, term));

    // View Details button
    const viewDetailsBtn = document.createElement('button');
    viewDetailsBtn.textContent = 'View Details';
    viewDetailsBtn.className = 'view-details-btn mt-2 me-2';
    viewDetailsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = `/executives/batches/${term.id}`;
    });

    // Send Result button
    const sendResultBtn = document.createElement('button');
    sendResultBtn.textContent = 'Send Result';
    sendResultBtn.className = 'send-result-btn mt-2';
    sendResultBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!await confirm('Are you sure to send results of this term to all students?')) return;
      window.location.href = `/executives/send_results/${term.id}`
    });

    buttonWrapper.appendChild(button);
    buttonWrapper.appendChild(viewDetailsBtn);
    buttonWrapper.appendChild(sendResultBtn);

    termButtonsContainer.appendChild(buttonWrapper);
  }

  function showDeleteConfirm(termId, termName) {
    const existingPopup = document.getElementById('delete-popup');
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement('div');
    popup.id = 'delete-popup';
    popup.className = 'modal-overlay';
    popup.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
        <h2 id="delete-modal-title">Delete Term</h2>
        <p>Are you sure you want to delete <span class="fw-bold">${termName}</span>?</p>
        <div class="d-flex justify-content-end gap-2">
          <button id="deleteCancelBtn">Cancel</button>
          <button id="deleteConfirmBtn">Delete</button>
        </div>
      </div>
    `;
    const popupBox = popup.querySelector('div.modal-card');
    animateIn(popupBox);

    popup.querySelector('#deleteCancelBtn').addEventListener('click', () => popup.remove());
    popup.addEventListener('click', (e) => {
      if (e.target === popup) popup.remove();
    });
    const escListener = (e) => {
      if (e.key === 'Escape') {
        popup.remove();
        document.removeEventListener('keydown', escListener);
      }
    };
    document.addEventListener('keydown', escListener);
    popup.querySelector('#deleteConfirmBtn').addEventListener('click', () => {
      fetch(`/executives/terms/${termId}/delete/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCSRFToken() },
      })
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then(() => {
          popup.remove();
          loadTerms();
        })
        .catch(error => console.error('Error deleting term:', error));
    });
    document.body.appendChild(popup);
  }

  function showSendResultConfirm(termId, termName) {
    const existingPopup = document.getElementById('send-result-popup');
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement('div');
    popup.id = 'send-result-popup';
    popup.className = 'modal-overlay';
    popup.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="send-result-modal-title">
        <h2 id="send-result-modal-title">Send Results</h2>
        <p>Are you sure you want to send results for <span class="fw-bold">${termName}</span>?</p>
        <p class="text-muted small">This will send result notifications to all students enrolled in this term.</p>
        <div class="d-flex justify-content-end gap-2">
          <button id="sendResultCancelBtn">Cancel</button>
          <button id="sendResultConfirmBtn">Send Results</button>
        </div>
      </div>
    `;
    const popupBox = popup.querySelector('div.modal-card');
    animateIn(popupBox);

    popup.querySelector('#sendResultCancelBtn').addEventListener('click', () => popup.remove());
    popup.addEventListener('click', (e) => {
      if (e.target === popup) popup.remove();
    });
    const escListener = (e) => {
      if (e.key === 'Escape') {
        popup.remove();
        document.removeEventListener('keydown', escListener);
      }
    };
    document.addEventListener('keydown', escListener);
    popup.querySelector('#sendResultConfirmBtn').addEventListener('click', () => {
      fetch(`/executives/terms/${termId}/send-results/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCSRFToken() },
      })
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then((data) => {
          popup.remove();
          // Show success message
          showNotification('Results sent successfully!', 'success');
        })
        .catch(error => {
          console.error('Error sending results:', error);
          showNotification('Failed to send results. Please try again.', 'error');
        });
    });
    document.body.appendChild(popup);
  }

  function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  function handleTermButtonClick(event) {
    document.querySelectorAll('.term-button').forEach(button => {
      button.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    showDatePopup(event.currentTarget);
  }

  function showDatePopup(button) {
    const existingPopup = document.getElementById('date-popup');
    if (existingPopup) existingPopup.remove();
    const termId = button.dataset.termId;

    fetch(`/executives/terms/`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        const term = data.terms.find(t => t.id == termId) || {};
        const popup = document.createElement('div');
        popup.id = 'date-popup';
        popup.className = 'modal-overlay';
        popup.innerHTML = `
           <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="tm-modal-title">
             <h2 id="tm-modal-title">Select Dates</h2>
             <div class="mb-3 d-flex align-items-center gap-2">
               <label class="mb-1 fw-semibold" style="min-width: 7rem;">Term Name</label>
               <input type="text" class="form-control" id="termName" value="${term.name || ''}" readonly>
             </div>
             <div class="mb-3 d-flex align-items-center gap-2">
               <label class="mb-1 fw-semibold" style="min-width: 7rem;">Academic Year</label>
               <input type="number" min="2000" max="2100" class="form-control" id="year" value="${term.year || ''}" readonly>
             </div>
             <div class="mb-3 d-flex align-items-center gap-2">
               <label class="mb-1 fw-semibold" style="min-width: 7rem;">Start Date</label>
               <input type="date" class="form-control" id="semStartDate" value="${term.semStart || ''}" readonly>
             </div>
             <div class="mb-3 d-flex align-items-center gap-2">
               <label class="mb-1 fw-semibold" style="min-width: 7rem;">End Date</label>
               <input type="date" class="form-control" id="endDate" value="${term.endDate || ''}" readonly>
             </div>
             <div class="mb-4 d-flex align-items-center gap-2">
               <label class="mb-1 fw-semibold" style="min-width: 7rem;">Result Date</label>
               <input type="date" class="form-control" id="resultDate" value="${term.resultDate || ''}" readonly>
             </div>
             <div class="d-flex justify-content-end gap-2">
               <button id="popupEditBtn">Edit</button>
               <button id="popupCancelBtn">Cancel</button>
               <button id="popupSaveBtn">Save</button>
             </div>
           </div>
         `;
        const popupBox = popup.querySelector('div.modal-card');
        animateIn(popupBox);

        popup.querySelector('#popupEditBtn').addEventListener('click', () => {
          const inputs = popup.querySelectorAll('input');
          inputs.forEach(input => {
            input.removeAttribute('readonly');
            animateIn(input);
          });
          inputs[0].focus();
        });

        popup.addEventListener('click', (e) => {
          if (e.target === popup || e.target.id === 'popupCancelBtn') {
            popup.remove();
          }
        });
        const escListener = (e) => {
          if (e.key === 'Escape') {
            popup.remove();
            document.removeEventListener('keydown', escListener);
          }
        };
        document.addEventListener('keydown', escListener);

        popup.querySelector('#popupSaveBtn').addEventListener('click', () => {
          const semStart = popup.querySelector('#semStartDate').value;
          const endDate = popup.querySelector('#endDate').value;
          const resultDate = popup.querySelector('#resultDate').value;
          const name = popup.querySelector('#termName').value;
          const year = popup.querySelector('#year').value;

          fetch(`/executives/terms/${termId}/update/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify({ semStart, endDate, resultDate, name, year })
          })
            .then(res => {
              if (!res.ok) throw new Error('Network response was not ok');
              return res.json();
            })
            .then(() => {
              popup.remove();
              loadTerms();
            })
            .catch(error => console.error('Error updating term dates:', error));
        });

        document.body.appendChild(popup);
      })
      .catch(error => console.error('Error fetching term data:', error));
  }

  function makeButtonEditable(button, term) {
    if (termButtonsContainer.querySelector('.new-term-input')) return;
    const labelSpan = button.querySelector('span:nth-child(2)');
    const currentValue = labelSpan ? labelSpan.textContent : button.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    input.placeholder = 'new';
    input.className = 'new-term-input flex-grow border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500';
    termButtonsContainer.replaceChild(input, button);
    input.focus();

    function finalizeEdit() {
      const value = input.value.trim();
      if (value && value !== currentValue) {
        fetch(`/executives/terms/${term.id}/update/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
          },
          body: JSON.stringify({ name: value })
        })
          .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
          })
          .then(() => {
            loadTerms();
          })
          .catch(error => console.error('Error updating term name:', error));
      } else {
        loadTerms();
      }
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finalizeEdit();
    });
    input.addEventListener('blur', finalizeEdit);
  }

  addNewTermBtn.addEventListener('click', () => {
    if (termButtonsContainer.querySelector('.new-term-input') || termButtonsContainer.querySelector('.new-term-row')) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Add new term (e.g. 2022-2023)';
    input.className = 'new-term-input flex-grow px-4 py-2 rounded';
    input.style.border = '2px solid #F5F5F5';
    const wrapper = document.createElement('div');
    wrapper.className = 'new-term-row';
    wrapper.appendChild(input);
    termButtonsContainer.insertBefore(wrapper, termButtonsContainer.firstChild);
    animateIn(wrapper);
    setTimeout(() => {
      input.focus();
    }, 0);

    function finalizeNewTerm() {
      const value = input.value.trim();
      if (value && !submitted) {
        submitted = true;
        fetch('/executives/terms/create/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
          },
          body: JSON.stringify({ name: value })
        })
          .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
          })
          .then(() => {
            loadTerms();
          })
          .catch(error => console.error('Error creating new term:', error));
      }
      wrapper.remove();
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finalizeNewTerm();
    });
    input.addEventListener('blur', finalizeNewTerm);
  });

  // CSRF helper
  function getCSRFToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('csrftoken=')) {
          cookieValue = decodeURIComponent(cookie.substring('csrftoken='.length));
          break;
        }
      }
    }
    return cookieValue;
  }

  // Initial load
  loadTerms();
});
