document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('.icon-btn.approve').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.stopPropagation();
            if (!await confirm("Are you sure you want to approve this user?")) {
                e.preventDefault();
            }
        });
    });

    document.querySelectorAll('.icon-btn.reject').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.stopPropagation();
            if (!await confirm("Are you sure you want to reject this user?")) {
                e.preventDefault();
            }
        });
    });

    // FIX: Move search event listener here and update logic
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', function () {
            const search = this.value.toLowerCase();
            document.querySelectorAll('#userTable tbody tr').forEach(row => {
                // If you want to exclude detail/collapse rows, add a class to main rows and filter by that
                // For now, filter all rows except those with class 'details-row'
                if (!row.classList.contains('details-row')) {
                    const text = row.innerText.toLowerCase();
                    row.style.display = text.includes(search) ? '' : 'none';
                }
            });
        });
    }

    document.querySelectorAll('#userTable tbody tr').forEach(row => {
        const editBtn = row.querySelector('.icon-btn.edit');
        const viewBtn = row.querySelector('.icon-btn.view');
        const marksInput = row.querySelector('.marks-input');
        const marksText = row.querySelector('.marks-text');

        if (marksInput) {
            // Only allow integer input
            marksInput.addEventListener('input', function () {
                this.value = this.value.replace(/[^0-9]/g, '');
            });
        }

        if (editBtn && marksInput && marksText) {
            editBtn.addEventListener('click', function () {
                marksText.classList.add('d-none');
                marksInput.classList.remove('d-none');
                editBtn.classList.add('d-none'); // Hide edit button permanently
                marksInput.focus();
            });

            // Remove saveBtn click logic, handle save on blur or Enter
            marksInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    marksText.textContent = marksInput.value;
                    marksText.classList.remove('d-none');
                    marksInput.classList.add('d-none');
                    // editBtn stays hidden
                } else if (e.key === 'Escape') {
                    marksInput.value = marksText.textContent;
                    marksText.classList.remove('d-none');
                    marksInput.classList.add('d-none');
                    // editBtn stays hidden
                }
            });

            marksInput.addEventListener('blur', function () {
                marksText.textContent = marksInput.value;
                marksText.classList.remove('d-none');
                marksInput.classList.add('d-none');
                // editBtn stays hidden
            });
        }

        // Image enlarge on click
        const img = row.querySelector('.avatar');
        if (img) {
            img.style.cursor = "pointer";
            img.addEventListener('click', function () {
                // Create overlay
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = 0;
                overlay.style.left = 0;
                overlay.style.width = '100vw';
                overlay.style.height = '100vh';
                overlay.style.background = 'rgba(0,0,0,0.85)';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.zIndex = 9999;

                // Create enlarged image
                const bigImg = document.createElement('img');
                bigImg.src = img.src;
                bigImg.alt = img.alt;
                bigImg.style.maxWidth = '99vw';
                bigImg.style.maxHeight = '99vh';
                bigImg.style.width = 'auto';
                bigImg.style.height = 'auto';
                bigImg.style.objectFit = 'contain';
                bigImg.style.borderRadius = '1rem';
                bigImg.style.boxShadow = '0 8px 32px 0 rgba(0,0,0,0.25)';
                bigImg.style.background = '#fff';
                bigImg.style.display = 'block';
                bigImg.style.imageRendering = 'auto';

                overlay.appendChild(bigImg);

                // Remove overlay on click
                overlay.addEventListener('click', function () {
                    overlay.remove();
                });

                document.body.appendChild(overlay);
            });
        }
    });
});