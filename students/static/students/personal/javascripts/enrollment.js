document.addEventListener('DOMContentLoaded', function() {
    const $term = document.getElementById('term-select');
    const $batch = document.getElementById('batch-select');
    const $coursesSection = document.getElementById('courses-section');
    const $submit = document.getElementById('submit-enrollment');
    let coursesData = {};
    let presentTypes = [];
    const csrfToken = document.querySelector('[name=csrf-token]').content;

    function resetBatch() {
        $batch.innerHTML = '<option value="">Select Batch</option>';
        $batch.disabled = true;
        $coursesSection.style.display = 'none';
        $coursesSection.innerHTML = '';
        $submit.disabled = true;
        presentTypes = [];
    }

    function resetCourses() {
        $coursesSection.style.display = 'none';
        $coursesSection.innerHTML = '';
        $submit.disabled = true;
        presentTypes = [];
    }

    $term.addEventListener('change', function() {
        const termId = $term.value;
        resetBatch();
        if (!termId) return;
        fetch(`/students/personal/enrollment/get_batches/?term_id=${termId}`)
            .then(res => res.json())
            .then(resp => {
                if (resp.success) {
                    $batch.disabled = false;
                    resp.batches.forEach(batch => {
                        const opt = document.createElement('option');
                        opt.value = batch.id;
                        opt.textContent = `${batch.name} (${batch.semester__degree__code})`;
                        $batch.appendChild(opt);
                    });
                }
            });
    });

    $batch.addEventListener('change', function() {
        const batchId = $batch.value;
        resetCourses();
        if (!batchId) return;
        fetch(`/students/personal/enrollment/get_courses/?batch_id=${batchId}`)
            .then(res => res.json())
            .then(resp => {
                if (resp.success) {
                    coursesData = resp.courses;
                    renderCourses(resp.courses);
                }
            });
    });

    function renderCourses(grouped) {
        let html = '';
        presentTypes = [];
        Object.keys(grouped).forEach(type => {
            if (!grouped[type] || grouped[type].length === 0) return;
            presentTypes.push(type);
            html += `<div class="course-group mb-4"><div class="group-title text-uppercase mb-2">${type}</div>`;
            grouped[type].forEach(course => {
                const readonly = type === 'Core' ? 'readonly checked disabled' : '';
                const checked = readonly ? 'checked' : '';
                const inputType = 'checkbox';
                html += `<div class="course-cart${readonly ? ' readonly' : ''}">
                    <i class="fa-solid fa-book"></i>
                    <div class="course-info">
                        <div class="course-title">${course.course_code} - ${course.course_name}</div>
                        <div class="course-meta">${course.description || ''}</div>
                        <div class="course-meta">
                            <span class="me-3"><i class="fa-solid fa-clock me-1"></i> ${course.total_hours} hrs/week</span>
                            <span class="me-3"><i class="fa-solid fa-coins me-1"></i> ${course.credits} credits</span>
                            <span class="badge bg-secondary text-dark">${course.type}</span>
                        </div>
                    </div>
                    <input type="${inputType}" class="form-check-input ms-2 course-select" data-type="${type}" value="${course.course_id}" ${readonly} ${checked} />
                </div>`;
            });
            html += '</div>';
        });
        $coursesSection.innerHTML = html;
        $coursesSection.style.display = '';
        updateSubmitState();
    }

    function updateSubmitState() {
        // For each present type, at least one course must be selected
        let allTypesSelected = true;
        presentTypes.forEach(type => {
            const inputs = $coursesSection.querySelectorAll(`.course-select[data-type="${type}"]`);
            let typeSelected = false;
            inputs.forEach(input => {
                if (input.checked) {
                    typeSelected = true;
                }
            });
            if (!typeSelected) {
                allTypesSelected = false;
            }
        });
        $submit.disabled = !allTypesSelected;
    }

    $coursesSection.addEventListener('change', function(e) {
        if (e.target.classList.contains('course-select')) {
            updateSubmitState();
        }
    });

    $submit.addEventListener('click', async function() {
        if (! await confirm('Are you sure to submit the enrollment form?')) {
            return;
        }
        const termId = $term.value;
        const batchId = $batch.value;
        let selectedCourses = [];
        $coursesSection.querySelectorAll('.course-select:checked').forEach(input => {
            selectedCourses.push(input.value);
        });
        data = JSON.stringify({
            term_id: termId, batch_id: batchId, course_ids: selectedCourses
        })
        console.log({ term_id: termId, batch_id: batchId, course_ids: selectedCourses });
        
        fetch('/students/personal/enrollment/submit/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: data
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not OK');
            }
            return response.json();
        })
        .then(async result => {
            await alert('Enrollment Successful');
        })
        .catch(error => {
            console.error('Error:', error);
        });
        
    });
});
