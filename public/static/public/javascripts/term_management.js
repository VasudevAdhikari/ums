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

    // button.addEventListener('click', handleTermButtonClick);
    // button.addEventListener('dblclick', () => makeButtonEditable(button, term));
    buttonWrapper.appendChild(button);
    // buttonWrapper.appendChild(viewDetailsBtn);
    termButtonsContainer.appendChild(buttonWrapper);
  }
  // Initial load
  loadTerms();
});
