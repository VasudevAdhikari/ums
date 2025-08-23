
// Function to navigate to lab details page
function navigateToLabDetails(labId) {
    window.location.href = `lab-details.html?id=${labId}`;
}

// Initialize tooltips
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
});


document.addEventListener('DOMContentLoaded', function () {
    // Get all navbar links (including dropdown items)
    const navLinks = document.querySelectorAll('.dropdown-item');

    // Get the navbar collapse element
    const navbarCollapse = document.querySelector('.navbar-collapse');

    // Add click event to each link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Check if navbar is expanded (mobile view)
            if (navbarCollapse.classList.contains('show')) {
                // Trigger the collapse
                const toggleBtn = document.querySelector('.navbar-toggler');
                if (toggleBtn) {
                    toggleBtn.click(); // Simulate click on toggle button
                }
            }
        });
    });
});
