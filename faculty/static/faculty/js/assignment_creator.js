const students = window.ALL_STUDENTS;
let selectedStudents = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeStudentModal();
    setupEventListeners();
    // updateClockDisplay();

    if (window.assignment_data) {
        fillAssignmentForm(window.assignment_data);
    }
});

function initializeStudentModal() {
    const studentsGrid = document.getElementById('studentsGrid');
    studentsGrid.innerHTML = '';
    students.forEach(student => {
        const studentCard = createStudentCard(student);
        studentsGrid.appendChild(studentCard);
    });
}

function createStudentCard(student) {
    const card = document.createElement('div');
    card.className = 'student-card';
    card.dataset.studentId = student.id;
    card.innerHTML = `
        <div class="student-checkbox">
            <label class="checkbox-container">
                <input type="checkbox" onchange="toggleStudentSelection(${student.id})">
                <span class="checkmark"></span>
            </label>
        </div>
        <div class="student-avatar">${student.avatar}</div>
        <div class="student-info">
            <div class="student-name">${student.name}</div>
            <div class="student-details">
                ${student.email}<br>
                Semester: ${student.semester}
            </div>
        </div>
    `;
    card.addEventListener('click', function(e) {
        if (e.target.type !== 'checkbox' && !e.target.closest('.checkbox-container')) {
            const checkbox = card.querySelector('input[type="checkbox"]');
            checkbox.checked = !checkbox.checked;
            toggleStudentSelection(student.id);
        }
    });
    return card;
}

function openStudentModal() {
    const modal = document.getElementById('studentModal');
    modal.classList.add('show');
    modal.style.display = 'flex';
}

function closeStudentModal() {
    const modal = document.getElementById('studentModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function toggleStudentSelection(studentId) {
    const card = document.querySelector(`[data-student-id="${studentId}"]`);
    const checkbox = card.querySelector('input[type="checkbox"]');
    if (checkbox.checked) {
        if (!selectedStudents.includes(studentId)) {
            selectedStudents.push(studentId);
        }
        card.classList.add('selected');
    } else {
        selectedStudents = selectedStudents.filter(id => id !== studentId);
        card.classList.remove('selected');
    }
    updateSelectAllCheckbox();
}

function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllStudents');
    const studentCheckboxes = document.querySelectorAll('.student-card input[type="checkbox"]');
    if (selectAllCheckbox.checked) {
        selectedStudents = students.map(s => s.id);
        studentCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
            checkbox.closest('.student-card').classList.add('selected');
        });
    } else {
        selectedStudents = [];
        studentCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
            checkbox.closest('.student-card').classList.remove('selected');
        });
    }
}

function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAllStudents');
    selectAllCheckbox.checked = selectedStudents.length === students.length;
}

function confirmStudentSelection() {
    updateSelectedStudentsDisplay();
    closeStudentModal();
}

function updateSelectedStudentsDisplay() {
    const selectedCount = document.getElementById('selectedCount');
    selectedCount.textContent = `${selectedStudents.length} students selected`;
}

function setupStudentSearch() {
    const searchInput = document.getElementById('studentSearch');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const studentCards = document.querySelectorAll('.student-card');
        studentCards.forEach(card => {
            const studentName = card.querySelector('.student-name').textContent.toLowerCase();
            const studentEmail = card.querySelector('.student-details').textContent.toLowerCase();
            if (studentName.includes(searchTerm) || studentEmail.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}


// File/Image Preview
function previewFiles(input, containerId, isImage) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    Array.from(input.files).forEach((file, idx) => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'file-preview';
        if (isImage) {
            const img = document.createElement('img');
            img.className = 'preview-img';
            img.alt = file.name;
            const reader = new FileReader();
            reader.onload = function(e) {
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            fileDiv.appendChild(img);
        } else {
            fileDiv.textContent = file.name;
        }
        container.appendChild(fileDiv);
    });
}

// Download and set file/image input for existing files/images
async function setFileInputFromUrl(input, url, filename) {
    try {
        const response = await fetch(url);
        if (!response.ok) return;
        const blob = await response.blob();
        let file;
        try {
            file = new File([blob], filename, { type: blob.type });
        } catch (e) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(new File([blob], filename, { type: blob.type }));
            file = dataTransfer.files[0];
        }
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.setAttribute('data-original', filename);
        input.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) {}
}

async function fillAssignmentForm(assignment) {
    if (document.getElementById('assignmentTitle')) {
        document.getElementById('assignmentTitle').value = assignment.title || '';
    }
    // document.getElementById('assignmentDuration').value = assignment.time_limit || 30;
    // updateClockDisplay();
    if (assignment.start_time) document.getElementById('assignmentStart').value = assignment.start_time;
    if (assignment.end_time) document.getElementById('assignmentEnd').value = assignment.end_time;
    selectedStudents = assignment.students || [];
    document.querySelectorAll('.student-card input[type="checkbox"]').forEach(checkbox => {
        const studentId = parseInt(checkbox.closest('.student-card').dataset.studentId);
        checkbox.checked = selectedStudents.includes(studentId);
        if (checkbox.checked) {
            checkbox.closest('.student-card').classList.add('selected');
        } else {
            checkbox.closest('.student-card').classList.remove('selected');
        }
    });
    updateSelectedStudentsDisplay();
    updateSelectAllCheckbox();
    document.getElementById('assignmentQuestion').value = assignment.question || '';

    // Existing files
    const filesPreview = document.getElementById('filesPreview');
    filesPreview.innerHTML = '';
    if (assignment.files && assignment.files.length > 0) {
        const fileInput = document.getElementById('assignmentFiles');
        for (const fname of assignment.files) {
            const url = `/media/assignment_files/${fname}`;
            // Show preview
            const fileDiv = document.createElement('div');
            fileDiv.className = 'file-preview';
            fileDiv.textContent = fname;
            // Optionally, add a download link
            const a = document.createElement('a');
            a.href = url;
            a.textContent = 'Download';
            a.target = '_blank';
            a.style.marginLeft = '10px';
            fileDiv.appendChild(a);
            filesPreview.appendChild(fileDiv);
            // Optionally, set file input (for backend consistency)
            await setFileInputFromUrl(fileInput, url, fname);
        }
    }
    // Existing images
    const imagesPreview = document.getElementById('imagesPreview');
    imagesPreview.innerHTML = '';
    if (assignment.images && assignment.images.length > 0) {
        const imageInput = document.getElementById('assignmentImages');
        for (const iname of assignment.images) {
            const url = `/media/assignment_images/${iname}`;
            // Show preview
            const imgDiv = document.createElement('div');
            imgDiv.className = 'file-preview';
            const img = document.createElement('img');
            img.className = 'preview-img';
            img.alt = iname;
            img.src = url;
            imgDiv.appendChild(img);
            // Optionally, add a download link
            const a = document.createElement('a');
            a.href = url;
            a.textContent = 'Download';
            a.target = '_blank';
            a.style.marginLeft = '10px';
            imgDiv.appendChild(a);
            imagesPreview.appendChild(imgDiv);
            // Optionally, set file input (for backend consistency)
            await setFileInputFromUrl(imageInput, url, iname);
        }
    }
}

function setupEventListeners() {
    document.getElementById('openStudentModal').addEventListener('click', openStudentModal);
    document.getElementById('assignmentForm').addEventListener('submit', handleFormSubmission);
    setupStudentSearch();
    document.getElementById('assignmentFiles').addEventListener('change', function() {
        previewFiles(this, 'filesPreview', false);
    });
    document.getElementById('assignmentImages').addEventListener('change', function() {
        previewFiles(this, 'imagesPreview', true);
    });
    document.getElementById('studentModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeStudentModal();
        }
    });
}

async function handleFormSubmission(event) {
    event.preventDefault();
    if (selectedStudents.length === 0) {
        await alert('Please select at least one student for the assignment.');
        return;
    }
    const title = document.getElementById('assignmentTitle').value;
    const totalMark = document.getElementById('totalMarks').value;
    const question = document.getElementById('assignmentQuestion').value;
    // const timeLimit = parseInt(document.getElementById('assignmentDuration').value) || 30;
    const startTime = document.getElementById('assignmentStart').value;
    const endTime = document.getElementById('assignmentEnd').value;
    const filesInput = document.getElementById('assignmentFiles');
    const imagesInput = document.getElementById('assignmentImages');
    const files = Array.from(filesInput.files);
    const images = Array.from(imagesInput.files);

    const fileNames = files.map(f => f.name);
    const imageNames = images.map(f => f.name);

    const assignment = {
        title: title,
        students: selectedStudents,
        total_mark: totalMark,
        question: question,
        files: fileNames,
        images: imageNames
    };

    const formData = new FormData();
    formData.append('assignment', JSON.stringify(assignment));
    formData.append('start_time', startTime);
    formData.append('end_time', endTime);
    formData.append('assessment_id', window.ASSESSMENT_ID);

    files.forEach(file => {
        formData.append('files', file, file.name);
    });
    images.forEach(file => {
        formData.append('images', file, file.name);
    });

    if (!confirm("Are you sure to save assignment data?")) return;

    fetch('/faculty/create_assignment/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': window.CSRF_TOKEN
        },
        body: formData
    })
    .then(response => response.json())
    .then(async data => {
        if (data.success) {
            await alert('Assignment created successfully');
            window.location.href = `/faculty/course_management/${window.BATCH_INSTRUCTOR_ID}`;
        } else {
            console.error('Server error:', data);
            await alert('Failed to create assignment: ' + (data.message || data.error || 'Unknown error'));
        }
    })
    .catch(async (error) => {
        console.error('Error:', error);
        await alert('An error occurred while creating the assignment.');
    });
}