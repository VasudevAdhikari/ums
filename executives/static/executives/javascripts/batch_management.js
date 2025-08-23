const toggleBtn = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebarClose');
const tabContainerBox = document.getElementById('tabContainerBox');
const addBtn = document.getElementById('addBtn');
const majorModal = document.getElementById('majorModal');
const closeMajorModal = document.getElementById('closeMajorModal');
const majorSelect = document.getElementById('majorSelect');
const semCheckboxList = document.getElementById('semCheckboxList');
const submitMajorBatch = document.getElementById('submitMajorBatch');
const tabContentMsg = document.getElementById('tabContentMsg');
const searchBar = document.querySelector('.search-bar');
const modalOverlay = document.getElementById('modalOverlay');
const editTabsBtn = document.getElementById('editTabsBtn');
const deleteTabModal = document.getElementById('deleteTabModal');
const closeDeleteTabModal = document.getElementById('closeDeleteTabModal');
const confirmDeleteTab = document.getElementById('confirmDeleteTab');
const cancelDeleteTab = document.getElementById('cancelDeleteTab');

let editMode = false;
let tabToDelete = null;

toggleBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
    toggleBtn.classList.add('hide');
    // Shrink tab container when sidebar is open
    if (tabContainerBox) tabContainerBox.classList.add('sidebar-open');
});

sidebarClose.addEventListener('click', () => {
    sidebar.classList.remove('open');
    toggleBtn.classList.remove('hide');
    // Restore tab container when sidebar is closed
    if (tabContainerBox) tabContainerBox.classList.remove('sidebar-open');
});

// Inject semester checkboxes
document.getElementById('majorSelect').onchange = () => {
    if (semCheckboxList) {
        semCheckboxList.innerHTML = '';
        window.ALL_SEMESTERS.forEach(semester => {
            if (semester.fields.degree == parseInt(document.getElementById('majorSelect').value)) {
                const label = document.createElement('label');
                label.innerHTML = `<input type="checkbox" value="${semester.pk}"> ${semester.fields.semester_name}`;
                semCheckboxList.appendChild(label);
            }
        });
    }
}


// Show modal with overlay
addBtn.onclick = () => {
    majorModal.style.display = "flex";
    if (modalOverlay) modalOverlay.style.display = "block";
};

// Hide modal and overlay
closeMajorModal.onclick = () => {
    majorModal.style.display = "none";
    if (modalOverlay) modalOverlay.style.display = "none";
};

// Hide modal when clicking outside
window.onclick = (e) => {
    if (e.target === majorModal) {
        majorModal.style.display = "none";
        if (modalOverlay) modalOverlay.style.display = "none";
    }
    if (e.target === modalOverlay) {
        majorModal.style.display = "none";
        modalOverlay.style.display = "none";
    }
};

// Handle submit
submitMajorBatch.onclick = async () => {
    const major = majorSelect.value;
    document.getElementById('majorModal').style.display='none';
    document.getElementById('modalOverlay').style.display='none';
    const checkedSems = Array.from(semCheckboxList.querySelectorAll("input:checked")).map(cb => cb.value);

    if (!major) {
        await alert("Please select a major.");
        return;
    }
    if (checkedSems.length === 0) {
        await alert("Please select at least one semester.");
        return;
    }

    // Confirm creation
    if (!await confirm(`Create batch for major "${major}" with semesters: ${checkedSems.join(", ")}?`)) {
        return;
    }

    // Async POST to /executives/batchs/edit/
    try {
        const CSRFToken = window.getCsrfToken();
        if (!await confirm('Are you sure to edit batch with provided data')) return;
        const resp = await fetch("/executives/batches/edit/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRFToken": CSRFToken,
            },
            body: JSON.stringify({
                term_id: window.TERM_ID,
                semesters: checkedSems
            })
        });
        if (!resp.ok) {
            throw new Error("Failed to create batch.");
        }
        if (resp.result) {
            console.log(resp.result);
            if(resp.messsage) await alert(resp.message);
            else await alert('Batch Data Edited Successfully');
        }
        window.location.reload();
        // Remove the intro message if present
        if (tabContentMsg) tabContentMsg.style.display = "none";

        // Create the new tab
        const tab = document.createElement("div");
        tab.className = "created-tab";
        tab.textContent = major;

        // Add delete button if in edit mode
        addDeleteBtnIfEditMode(tab);

        // Create the sem list (hidden by default)
        const semList = document.createElement("div");
        semList.className = "created-sem-list";
        semList.style.display = "none";
        semList.innerHTML = checkedSems.map(sem => `<div class="created-sem-item" style="cursor:pointer;" data="${sem}"></div>`).join("");

        tab.onclick = function () {
            semList.classList.toggle("open");
            semList.style.display = semList.classList.contains("open") ? "block" : "none";
        };

        // Add click handler for each sem item (after adding to DOM)
        tabContainerBox.appendChild(tab);
        tabContainerBox.appendChild(semList);

        // Attach click event for each sem item
        Array.from(semList.getElementsByClassName("created-sem-item")).forEach(semItem => {
            semItem.onclick = function (e) {
                e.stopPropagation(); // Prevent toggling the sem list
                // Check if a subject tab already exists after this sem item
                let next = semItem.nextElementSibling;
                if (next && next.classList.contains("subject-tab")) {
                    next.style.display = next.style.display === "none" ? "block" : "none";
                    return;
                }
                // Create subject tab
                const subjectTab = document.createElement("div");
                subjectTab.className = "subject-tab";
                subjectTab.style.margin = "12px 0 0 0";
                subjectTab.style.background = "#003366";
                subjectTab.style.borderRadius = "10px";
                subjectTab.style.boxShadow = "0 2px 8px rgba(44,62,80,0.08)";
                subjectTab.style.padding = "18px 22px";
                subjectTab.style.display = "block";
                // 3x2 grid of subject buttons
                const grid = document.createElement("div");
                grid.style.display = "grid";
                grid.style.gridTemplateColumns = "repeat(3, 1fr)";
                grid.style.gap = "12px";
                for (let i = 1; i <= 6; i++) {
                    const btn = document.createElement("button");
                    btn.textContent = `Subject ${i}`;
                    btn.className = "subject-btn";
                    btn.style.background = "#FFFFFF";
                    btn.style.color = "#FFFFFF";
                    btn.style.border = "none";
                    btn.style.borderRadius = "8px";
                    btn.style.padding = "18px 0";
                    btn.style.fontWeight = "bold";
                    btn.style.fontSize = "1rem";
                    btn.style.cursor = "pointer";
                    btn.style.transition = "background 0.2s";
                    // btn.setAttribute('course-data', )
                    // Replace subject button click logic:
                    btn.onclick = function (ev) {
                        ev.stopPropagation();
                        showSubjectPopup(btn, semItem.textContent, major);
                    };
                    grid.appendChild(btn);
                }
                subjectTab.appendChild(grid);
                // Insert after this sem item
                semItem.parentNode.insertBefore(subjectTab, semItem.nextSibling);
            };
        });

        // Reset modal
        majorSelect.value = "";
        semCheckboxList.querySelectorAll("input").forEach(cb => cb.checked = false);
        majorModal.style.display = "none";
        if (modalOverlay) modalOverlay.style.display = "none";
    } catch (err) {
        console.error(err);
        await alert("Error: " + err.message);
    }
};

// SEARCH FUNCTIONALITY for created tabs
if (searchBar) {
    searchBar.addEventListener("input", function () {
        const query = this.value.trim().toLowerCase();
        // Search/filter created-tab elements in the tab container
        const createdTabs = document.querySelectorAll('.created-tab');
        let anyVisible = false;
        createdTabs.forEach(tab => {
            if (tab.textContent.toLowerCase().includes(query)) {
                tab.style.display = "";
                // Also show its sem-list if open
                const semList = tab.nextElementSibling;
                if (semList && semList.classList.contains('created-sem-list') && semList.classList.contains('open')) {
                    semList.style.display = "block";
                }
                anyVisible = true;
            } else {
                tab.style.display = "none";
                // Hide its sem-list too
                const semList = tab.nextElementSibling;
                if (semList && semList.classList.contains('created-sem-list')) {
                    semList.style.display = "none";
                }
            }
        });
        // Optionally, hide the intro message if searching
        if (tabContentMsg) {
            tabContentMsg.style.display = query === "" && createdTabs.length === 0 ? "block" : "none";
        }
    });
}

// Helper: subject name -> code and teacher options
const subjectOptions = [
    {
        name: "Mathematics",
        code: ["MATH101", "MATH102", "MATH103"],
        teachers: ["Dr. Euler", "Dr. Gauss", "Ms. Noether"]
    },
    {
        name: "Physics",
        code: ["PHYS201", "PHYS202", "PHYS203"],
        teachers: ["Dr. Newton", "Dr. Feynman", "Ms. Curie"]
    },
    {
        name: "Computer Science",
        code: ["CS301", "CS302", "CS303"],
        teachers: ["Mr. Turing", "Ms. Hopper", "Dr. Knuth"]
    }
];

// Add this function at the end of your script
function showSubjectPopup(subjectBtn, semName, majorName) {
    // Remove existing popup if any
    let oldPopup = document.getElementById('subjectPopupModal');
    if (oldPopup) oldPopup.remove();

    // Get stored data for this button
    let subjectData = subjectBtn._subjectData || null;
    console.log(subjectData);

    // Get course data from button
    let courseData = subjectBtn._courseData || {};
    // Use courseData for subject name and code
    let subjectNameValue = courseData.course_name || "";
    let subjectCodeValue = courseData.course_code || "";

    // Create overlay
    let overlay = document.createElement('div');
    overlay.id = 'subjectPopupModal';
    overlay.className = 'edit-subject-popup';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.18)';
    overlay.style.backdropFilter = 'blur(2px)';
    overlay.style.zIndex = 3000;
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';

    // Modal box
    let modal = document.createElement('div');
    modal.style.background = '#FFFFFF';
    modal.style.borderRadius = '14px';
    modal.style.boxShadow = '0 8px 32px rgba(44,106,156,0.13)';
    modal.style.padding = '32px 28px 24px 28px';
    modal.style.width = '350px';
    modal.style.position = 'relative';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'stretch';

    // Close button
    let closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '12px';
    closeBtn.style.right = '18px';
    closeBtn.style.fontSize = '2rem';
    closeBtn.style.color = '#1a4d80';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => overlay.remove();
    modal.appendChild(closeBtn);

    // Title
    let title = document.createElement('h2');
    title.textContent = subjectData ? "Subject Details" : "Edit Subject";
    title.style.color = '#003366';
    title.style.margin = '0 0 18px 0';
    title.style.textAlign = 'center';
    modal.appendChild(title);

    // --- EDIT MODE ---
    function renderEditMode() {
        modal.innerHTML = '';
        modal.appendChild(closeBtn);
        let title = document.createElement('h2');
        title.textContent = "Edit Subject";
        title.style.color = '#003366';
        title.style.margin = '0 0 18px 0';
        title.style.textAlign = 'center';
        modal.appendChild(title);

        // 1. Subject Name (readonly text input)
        let subjectNameLabel = document.createElement('label');
        subjectNameLabel.textContent = "Subject Name:";
        subjectNameLabel.style.marginBottom = "6px";
        modal.appendChild(subjectNameLabel);

        let subjectNameInput = document.createElement('input');
        subjectNameInput.type = "text";
        subjectNameInput.readOnly = true;
        subjectNameInput.value = subjectNameValue;
        subjectNameInput.style.marginBottom = "14px";
        modal.appendChild(subjectNameInput);

        // 2. Subject Code (readonly text input)
        let subjectCodeLabel = document.createElement('label');
        subjectCodeLabel.textContent = "Subject Code:";
        subjectCodeLabel.style.marginBottom = "6px";
        modal.appendChild(subjectCodeLabel);

        let subjectCodeInput = document.createElement('input');
        subjectCodeInput.type = "text";
        subjectCodeInput.readOnly = true;
        subjectCodeInput.value = subjectCodeValue;
        subjectCodeInput.style.marginBottom = "14px";
        modal.appendChild(subjectCodeInput);

        // 3. Teacher (select box)
        let teacherLabel = document.createElement('label');
        teacherLabel.textContent = "Teacher:";
        teacherLabel.style.marginBottom = "6px";
        modal.appendChild(teacherLabel);

        let teacherSelect = document.createElement('select');
        teacherSelect.id = "subjectTeacherToSubmit"
        teacherSelect.style.marginBottom = "14px";
        let departmentId = courseData.department_id;
        // await alert(departmentId);
        (window.ALL_INSTRUCTORS || []).forEach(instr => {
            // await alert(instr.department);
            if (instr.department == departmentId) {
                let o = document.createElement('option');
                o.value = instr.id;
                o.textContent = instr.name;
                // Optionally add profile image as background
                if (instr.profile) {
                    o.style.backgroundImage = `url('${instr.profile}')`;
                    o.style.backgroundRepeat = "no-repeat";
                    o.style.backgroundSize = "24px 24px";
                    o.style.paddingLeft = "28px";
                }
                teacherSelect.appendChild(o);
            }
        });
        modal.appendChild(teacherSelect);

        // 4. Classroom 1
        let classroom1Label = document.createElement('label');
        classroom1Label.textContent = "Classroom 1:";
        classroom1Label.style.marginBottom = "6px";
        modal.appendChild(classroom1Label);

        let classroom1Select = document.createElement('input');
        classroom1Select.id = "classroom1ToSubmit"
        classroom1Select.type = "text";
        classroom1Select.maxLength = 20;
        classroom1Select.placeholder = "Enter classroom";
        classroom1Select.style.marginBottom = "8px";
        modal.appendChild(classroom1Select);

        let classTime1Label = document.createElement('label');
        classTime1Label.textContent = "Class Times (Room 1):";
        classTime1Label.style.marginBottom = "6px";
        modal.appendChild(classTime1Label);

        let classTime1Select = document.createElement('select');
        classTime1Select.id = "classTime1ToSubmit"
        for (let i = 1; i <= 5; i++) {
            let o = document.createElement('option');
            o.value = i;
            o.textContent = i;
            classTime1Select.appendChild(o);
        }
        classTime1Select.style.marginBottom = "14px";
        modal.appendChild(classTime1Select);

        // 5. Classroom 2 (optional)
        let classroom2Label = document.createElement('label');
        classroom2Label.textContent = "Classroom 2 (optional):";
        classroom2Label.style.marginBottom = "6px";
        modal.appendChild(classroom2Label);

        let classroom2Select = document.createElement('input');
        classroom2Select.id = "classroom2ToSubmit";
        classroom2Select.type = "text";
        classroom2Select.placeholder = "Another classroom (optional)";
        classroom2Select.maxLength = 20;
        classroom2Select.style.marginBottom = "8px";
        modal.appendChild(classroom2Select);

        let classTime2Label = document.createElement('label');
        classTime2Label.textContent = "Class Times (Room 2):";
        classTime2Label.style.marginBottom = "6px";
        modal.appendChild(classTime2Label);

        let classTime2Select = document.createElement('select');
        classTime2Select.id = "classTime2ToSubmit";
        let emptyOpt2 = document.createElement('option');
        emptyOpt2.value = "";
        emptyOpt2.textContent = "--";
        classTime2Select.appendChild(emptyOpt2);
        for (let i = 1; i <= 5; i++) {
            let o = document.createElement('option');
            o.value = i;
            o.textContent = i;
            classTime2Select.appendChild(o);
        }
        classTime2Select.style.marginBottom = "18px";
        modal.appendChild(classTime2Select);

        // Set initial values if editing
        if (subjectBtn._subjectData) {
            teacherSelect.value = subjectBtn._subjectData.teacher;
            classroom1Select.value = subjectBtn._subjectData.classroom1;
            classTime1Select.value = subjectBtn._subjectData.classTime1;
            classroom2Select.value = subjectBtn._subjectData.classroom2;
            classTime2Select.value = subjectBtn._subjectData.classTime2;
        }

        // Submit button
        let btnRow = document.createElement('div');
        btnRow.className = "subject-popup-btn-row";
        let submitBtn = document.createElement('button');
        submitBtn.textContent = "Submit";
        submitBtn.className = "subject-submit-btn";
        submitBtn.onclick = async function () {
            teacherToSubmit = document.getElementById('subjectTeacherToSubmit').value;
            classroom1ToSubmit = document.getElementById('classroom1ToSubmit').value;
            class1TimesToSubmit = document.getElementById('classTime1ToSubmit').value;
            classroom2ToSubmit = document.getElementById('classroom2ToSubmit').value;
            class2TimesToSubmit = document.getElementById('classTime2ToSubmit').value;
            // lag ja gale
            dataToSubmit = {
                batch_instructor_id: window.clicked_batch_instructor,
                instructor_id: teacherToSubmit,
                classroom1: classroom1ToSubmit,
                class_time1: class1TimesToSubmit,
                classroom2: classroom2ToSubmit,
                class_time2: class2TimesToSubmit
            }
            console.log(dataToSubmit);

            if (!await confirm('Are you sure to edit batch with provided data')) return;

            fetch("/executives/batch_instructor/edit/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": window.getCsrfToken()
                },
                body: JSON.stringify(dataToSubmit)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json(); // or response.text() if the response is not JSON
                })
                .then(async data => {
                    console.log("Success:", data);
                    if (data.success) await alert('Batch Data Updated Successfully');
                    window.location.reload();
                })
                .catch(error => {
                    console.error("Error:", error);
                });

        };
        btnRow.appendChild(submitBtn);

        modal.appendChild(btnRow);
    }

    // Initial render
    if (subjectData) {
        renderViewMode();
    } else {
        renderEditMode();
    }

    // Show modal
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

// Toggle edit mode for tabs
editTabsBtn.onclick = function () {
    editMode = !editMode;
    const createdTabs = document.querySelectorAll('.created-tab');
    createdTabs.forEach(tab => {
        let btn = tab.querySelector('.delete-tab-btn');
        if (editMode) {
            if (!btn) {
                btn = document.createElement('button');
                btn.className = 'delete-tab-btn';
                btn.innerHTML = '&minus;';
                btn.title = "Delete Tab";
                btn.onclick = async function (e) {
                    if (await confirm('Are you sure you want to remove all the courses related to this semester for this term?')) {
                        // await alert(tab.getAttribute('degree-id'))
                        const resp = await fetch("/executives/batch_instructor/delete/", {
                            method: "POST",
                            headers: {
                                "Accept": "application/json",
                                "X-Requested-With": "XMLHttpRequest",
                                "X-CSRFToken": window.getCsrfToken(),
                            },
                            body: JSON.stringify({
                                "term_id": window.TERM_ID,
                                "degree_id": tab.getAttribute('degree-id')
                            })
                        });
                        if (!resp.ok) throw new Error("Failed to delete batch instructors.");
                        else {
                            await alert('deletion successful');
                            window.location.reload();
                        }
                    }
                };
                tab.style.position = "relative";
                tab.appendChild(btn);
            } else {
                btn.style.display = "flex";
            }
        } else {
            if (btn) btn.style.display = "none";
        }
    });
};

// Hide delete modal
function closeDeleteModal() {
    deleteTabModal.style.display = "none";
    if (modalOverlay) {
        modalOverlay.style.display = "none";
        modalOverlay.style.pointerEvents = "none";
    }
    tabToDelete = null;
}

closeDeleteTabModal.onclick = closeDeleteModal;
cancelDeleteTab.onclick = closeDeleteModal;

// Confirm delete
confirmDeleteTab.onclick = function () {
    window.location.reload();
};

// When a new tab is created, add delete button if in edit mode
function addDeleteBtnIfEditMode(tab) {
    if (editMode) {
        let btn = tab.querySelector('.delete-tab-btn');
        if (!btn) {
            btn = document.createElement('button');
            btn.className = 'delete-tab-btn';
            btn.innerHTML = '&minus;';
            btn.title = "Delete Tab";
            btn.onclick = function (e) {
                e.stopPropagation();
                tabToDelete = tab;
                deleteTabModal.style.display = "flex";
                if (modalOverlay) {
                    modalOverlay.style.display = "block";
                    modalOverlay.style.pointerEvents = "auto";
                }
            };
            tab.style.position = "relative";
            tab.appendChild(btn);
        } else {
            btn.style.display = "flex";
        }
    }
}

// Render batches for the current term only on page load
async function renderAllBatches() {
    try {
        const resp = await fetch("/executives/batches/list/", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRFToken": typeof window.getCsrfToken === "function" ? window.getCsrfToken() : ""
            },
            body: JSON.stringify({ term_id: window.TERM_ID })
        });
        if (!resp.ok) throw new Error("Failed to fetch batches: " + resp.status);
        const data = await resp.json();
        console.log("batches data:", data);

        tabContainerBox.innerHTML = "";

        (data.majors || []).forEach(major => {
            const tab = document.createElement("div");
            tab.className = "created-tab";
            tab.textContent = major.degree_name ?? "Major";
            tab.setAttribute('degree-id', major.degree_id ?? "");
            addDeleteBtnIfEditMode(tab);

            const semList = document.createElement("div");
            semList.className = "created-sem-list";
            semList.style.display = "none";

            (major.semesters || []).forEach(sem => {
                const semItem = document.createElement("div");
                semItem.className = "created-sem-item";
                semItem.dataset.semId = String(sem.semester_id ?? "");
                semItem.setAttribute('batch_instructor', sem.batch_instructor_id);
                semItem.style.cursor = "pointer";
                // semItem.textContent = sem.semester_name ?? "Semester";
                semItem._semData = sem;
                semItem.setAttribute('data', sem.semester_name)
                semList.appendChild(semItem);
            });

            tab.onclick = function () {
                const open = semList.style.display !== "none";
                semList.style.display = open ? "none" : "block";
                semList.classList.toggle("open", !open);
            };

            tabContainerBox.appendChild(tab);
            tabContainerBox.appendChild(semList);

            const semesterKey = (function detectSemesterKeyOnCourses(courses) {
                if (!Array.isArray(courses) || courses.length === 0) return null;
                const sample = courses.find(c => c && typeof c === "object");
                if (!sample) return null;
                const keys = Object.keys(sample);
                const candidates = keys.filter(k => /^(semester(_)?id|sem(_)?id|semesterId|semester_number|semester)$/i.test(k));
                return candidates.length ? candidates[0] : null;
            })(major.courses);

            Array.from(semList.getElementsByClassName("created-sem-item")).forEach(semItem => {

                // Apply flex container styles
                semItem.style.display = 'flex';
                semItem.style.justifyContent = 'space-between';
                semItem.style.alignItems = 'center';
                semItem.style.padding = '10px';

                // Create left element
                const leftItem = document.createElement('div');
                leftItem.textContent = semItem.getAttribute('data');
                leftItem.style.backgroundColor = '#f0f0f0'; // optional styling
       
                // Create right element
                const rightItem = document.createElement('button');
                rightItem.textContent = 'Details';
                rightItem.style.borderRadius = '10px';
                rightItem.style.boxShadow = '1px 1px 2px var(--primary-light)';
                rightItem.style.backgroundColor = '#ffe44d'; // optional styling

                rightItem.onclick = () => {
                    window.location.href = `/executives/batch_statistics/${semItem.getAttribute('batch_instructor')}/`;
                }

                leftItem.onclick = function (e) {
                    console.log('left item clicked');
                    e.stopPropagation();

                    let next = semItem.nextElementSibling;
                    if (next && next.classList.contains("subject-tab")) {
                        next.style.display = next.style.display === "none" ? "block" : "none";
                        return;
                    }

                    const subjectTab = document.createElement("div");
                    subjectTab.className = "subject-tab";
                    subjectTab.style.margin = "12px 0 0 0";
                    subjectTab.style.background = "var(--bg-gray)";
                    subjectTab.style.borderRadius = "10px";
                    subjectTab.style.boxShadow = "0 2px 8px rgba(44,62,80,0.08)";
                    subjectTab.style.padding = "18px 22px";
                    subjectTab.style.display = "block";

                    const grid = document.createElement("div");
                    grid.style.display = "grid";
                    grid.style.gridTemplateColumns = "repeat(3, 1fr)";
                    grid.style.gap = "16px";

                    let coursesForThisSem = [];
                    const sem = semItem._semData || { semester_id: semItem.dataset.semId };

                    if (Array.isArray(sem.courses) && sem.courses.length > 0) {
                        coursesForThisSem = sem.courses;
                    } else if (Array.isArray(major.courses) && major.courses.length > 0) {
                        if (semesterKey) {
                            coursesForThisSem = major.courses.filter(course =>
                                course && course[semesterKey] != null &&
                                String(course[semesterKey]) === String(sem.semester_id ?? semItem.dataset.semId)
                            );
                        } else if (major.courses.every(c => c.semester_id !== undefined)) {
                            coursesForThisSem = major.courses.filter(course =>
                                course && course.semester_id != null &&
                                String(course.semester_id) === String(sem.semester_id ?? semItem.dataset.semId)
                            );
                        } else {
                            console.warn(`No semester mapping found for major "${major.degree_name}". Provide either sem.courses or a semester-id property on each course.`);
                        }
                    }

                    if (!Array.isArray(coursesForThisSem) || coursesForThisSem.length === 0) {
                        const emptyMsg = document.createElement("div");
                        emptyMsg.textContent = "No courses assigned to this semester.";
                        emptyMsg.style.padding = "8px 4px";
                        subjectTab.appendChild(emptyMsg);
                        subjectTab.appendChild(grid);
                        semItem.parentNode.insertBefore(subjectTab, semItem.nextSibling);
                        return;
                    }

                    coursesForThisSem.forEach(course => {
                        const btn = document.createElement("button");
                        btn.type = "button";
                        btn.className = "subject-btn";

                        // Styling container inside button for layout
                        btn.style.display = "flex";
                        btn.style.flexDirection = "column";
                        btn.style.alignItems = "flex-start";
                        btn.style.padding = "12px 14px";
                        btn.style.borderRadius = "8px";
                        btn.style.border = `1px solid var(--primary-light)`;
                        btn.style.backgroundColor = "var(--bg-light)";
                        btn.style.color = "var(--text-dark)";
                        btn.style.cursor = "pointer";
                        btn.style.transition = "background-color 0.3s ease";

                        btn.onmouseover = () => btn.style.backgroundColor = "var(--primary-light)";
                        btn.onmouseout = () => btn.style.backgroundColor = "var(--bg-light)";
                        btn.onfocus = () => btn.style.outline = `2px solid var(--primary-dark)`;
                        btn.onblur = () => btn.style.outline = "none";

                        // Course name with graduation cap icon (unicode 🎓)
                        const courseNameDiv = document.createElement("div");
                        courseNameDiv.style.fontSize = "1.1rem";
                        courseNameDiv.style.fontWeight = "700";
                        courseNameDiv.style.color = "var(--primary)";
                        courseNameDiv.style.display = "flex";
                        courseNameDiv.style.alignItems = "center";
                        courseNameDiv.style.gap = "6px";
                        courseNameDiv.textContent = course.course_name || course.course_code || "Course";
                        // prepend graduation cap icon
                        const gradIcon = document.createElement("span");
                        gradIcon.textContent = "🎓";
                        gradIcon.style.fontSize = "1.2rem";
                        courseNameDiv.prepend(gradIcon);
                        
                        // prepend graduation cap icon
                        const editIcon = document.createElement("span");
                        editIcon.innerHTML = '<i class="fas fa-pencil-alt me-2"></i>';
                        editIcon.style.fontSize = "1.2rem";
                        courseNameDiv.append(editIcon);
                        btn.appendChild(courseNameDiv);

                        // Instructor name with instructor icon (👨‍🏫)
                        const instructorDiv = document.createElement("div");
                        instructorDiv.style.fontSize = "0.85rem";
                        instructorDiv.style.color = "var(--primary-dark)";
                        instructorDiv.style.marginTop = "4px";
                        instructorDiv.style.display = "flex";
                        instructorDiv.style.alignItems = "center";
                        instructorDiv.style.gap = "6px";
                        instructorDiv.textContent = course.instructor?.name || "No Instructor";
                        const instrIcon = document.createElement("span");
                        instrIcon.textContent = "👨‍🏫";
                        instrIcon.style.fontSize = "1rem";
                        instructorDiv.prepend(instrIcon);
                        btn.appendChild(instructorDiv);

                        // Room1 and Room2 container
                        const roomsDiv = document.createElement("div");
                        roomsDiv.style.marginTop = "8px";
                        roomsDiv.style.display = "flex";
                        roomsDiv.style.gap = "10px";

                        // Room 1 box
                        const room1Box = document.createElement("div");
                        room1Box.textContent = `Room 1: ${course.rooms?.room1 || "-"} (${course.rooms?.times1 || "-"} times)`;
                        room1Box.style.backgroundColor = "var(--bg-light)";
                        room1Box.style.border = `1px solid var(--primary-light)`;
                        room1Box.style.borderRadius = "6px";
                        room1Box.style.padding = "4px 8px";
                        room1Box.style.fontSize = "0.85rem";
                        room1Box.style.color = "var(--text-dark)";
                        roomsDiv.appendChild(room1Box);

                        // Room 2 box
                        const room2Box = document.createElement("div");
                        room2Box.textContent = `Room 2: ${course.rooms?.room2 || "-"} (${course.rooms?.times2 || "-"} times)`;
                        room2Box.style.backgroundColor = "var(--bg-light)";
                        room2Box.style.border = `1px solid var(--primary-light)`;
                        room2Box.style.borderRadius = "6px";
                        room2Box.style.padding = "4px 8px";
                        room2Box.style.fontSize = "0.85rem";
                        room2Box.style.color = "var(--text-dark)";
                        roomsDiv.appendChild(room2Box);

                        const ratingBox = document.createElement("button");
                        ratingBox.textContent = `Ratings`;
                        ratingBox.style.backgroundColor = "var(--secondary)";
                        ratingBox.style.border = `1px solid var(--primary-light)`;
                        ratingBox.style.borderRadius = "6px";
                        ratingBox.style.padding = "4px 8px";
                        ratingBox.style.fontSize = "0.85rem";
                        ratingBox.style.color = "var(--primary-dark)";
                        // ratingBox.onclick = window.location.href = `/executives/rating_review/${course.batchInstructorId}/`;
                        roomsDiv.appendChild(ratingBox);

                        btn.appendChild(roomsDiv);

                        btn.dataset.batchInstructorId = String(course.batch_instructor_id ?? "");
                        btn._courseData = course;

                        editIcon.addEventListener("click", (ev) => {
                            ev.stopPropagation();
                            window.clicked_batch_instructor = course.batch_instructor_id;
                            showSubjectPopup(btn, semItem.textContent, major.degree_name);
                        });

                        ratingBox.addEventListener("click", (ev) => {
                            ev.stopPropagation();
                            window.location.href = `/executives/rating_review/${course.batch_instructor_id}/`;x
                        });

                        grid.appendChild(btn);
                    });

                    subjectTab.appendChild(grid);
                    semItem.parentNode.insertBefore(subjectTab, semItem.nextSibling);
                };
                // Append items to container
                semItem.appendChild(leftItem);
                semItem.appendChild(rightItem);
            });
        });
    } catch (err) {
        console.error("Error rendering batches:", err);
        if (typeof tabContentMsg !== "undefined" && tabContentMsg) tabContentMsg.style.display = "block";
    }
}

// Call on page load
document.addEventListener("DOMContentLoaded", renderAllBatches);


/*
[
{"type": "Core", "course_code": "CS 101", "course_name": "Basic Programming with Python", "course_hours": 4, "course_credits": 4}, 
{"type": "Elective", "co urse_code": "CS 101", "course_name": "Basic Programming with Python", "course_hours": 4, "course_credits": 4}]
*/
