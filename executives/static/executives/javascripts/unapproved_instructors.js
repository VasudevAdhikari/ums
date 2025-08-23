document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('.icon-btn.approve').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.stopPropagation();
            if (!await confirm("Are you sure you want to approve this user?")) {
                return;
            }
            user_id=btn.getAttribute('user-id') || 0;
            dept_id=document.getElementById(`departmentSelection${user_id}`).value;
            role = document.getElementById(`roleSelection${user_id}`).value;
            window.location.href=`/executives/approve_instructor/${user_id}/${dept_id}/${role}`;
        });
    });

    document.querySelectorAll('.icon-btn.reject').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.stopPropagation();
            if (!await confirm("Are you sure you want to reject this user?")) {
                return;
            }
            user_id=btn.getAttribute('user-id') || 0;
            window.location.href=`/executives/reject_instructor/${user_id}`;
        });
    });
});
document.getElementById('userSearch').addEventListener('input', function () {
    const search = this.value.toLowerCase();
    // Close all user details rows when searching
    document.querySelectorAll('.user-details-row').forEach(detailsRow => {
        detailsRow.style.display = 'none';
    });
    document.querySelectorAll('#userTable tbody tr').forEach(row => {
        // Only filter main rows, not details/collapse rows
        if (row.querySelector('select')) {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(search) ? '' : 'none';
        }
    });
});
document.querySelectorAll('.user-row').forEach(row => {
        row.addEventListener('click', function (e) {
            // Ignore clicks on action buttons or profile pic
            if (e.target.closest('.icon-btn') || e.target.classList.contains('profile-pic')) return;
            const userId = row.getAttribute('data-user');
            const detailsRow = document.querySelector(`.user-details-row[data-user="${userId}"]`);
            if (detailsRow) {
                detailsRow.style.display = detailsRow.style.display === 'none' ? '' : 'none';
            }
        });
    });

    // Lightbox for profile picture
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    document.querySelectorAll('.profile-pic').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', function (e) {
            e.stopPropagation();
            lightboxImg.src = img.getAttribute('data-img');
            lightboxModal.classList.add('show');
            lightboxModal.style.display = 'flex';
        });
    });
    document.querySelector('.lightbox-close').addEventListener('click', function () {
        lightboxModal.classList.remove('show');
        lightboxModal.style.display = 'none';
        lightboxImg.src = '';
    });
    lightboxModal.addEventListener('click', function (e) {
        if (e.target === lightboxModal) {
            lightboxModal.classList.remove('show');
            lightboxModal.style.display = 'none';
            lightboxImg.src = '';
        }
    });