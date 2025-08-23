const DEGREE_KEY = "degrees_data_v1";

// Get degrees from localStorage or use mock data if not present
function getDegrees() {
  const data = window.ALL_DEGREES;
  if (data) return data;
}

function renderDegrees(degrees) {
  const grid = document.getElementById("degreeGrid");
  grid.innerHTML = "";
  if (degrees)
    degrees.forEach((degree, index) => {
      const card = document.createElement("div");
      card.className = "degree-card fade-in";
      card.innerHTML = `
      <div class="degree-card-header">
        <div class="degree-img">
          <img src="${degree.image}" alt="${degree.title}">
        </div>
        <div class="degree-info">
          <h3 class="degree-title">${degree.title}</h3>
          <span class="degree-code">${degree.code}</span>
          <div class="degree-faculty">
            <i class="fa-solid fa-graduation-cap"></i>
            ${degree.faculty.name}
          </div>
        </div>
      </div>
      
      <div class="degree-card-content">
        <p class="degree-description">${
          degree.description || "No description available"
        }</p>
        
        <div class="degree-stats">
          <div class="degree-stat">
            <div class="degree-stat-value">${degree.duration}</div>
            <div class="degree-stat-label">Years</div>
          </div>
          <div class="degree-stat">
            <div class="degree-stat-value">${degree.credit}</div>
            <div class="degree-stat-label">Credits</div>
          </div>
          <div class="degree-stat">
            <div class="degree-stat-value">${degree.courses}</div>
            <div class="degree-stat-label">Courses</div>
          </div>
        </div>
      </div>
      
      <div class="card-actions">
        <button class="view-btn">
          <i class="fa-solid fa-eye"></i>
          View
        </button>
        <button class="delete-btn">
          <i class="fa-solid fa-trash-can"></i>
          Delete
        </button>
      </div>
    `;

      // View button functionality
      card.querySelector(".view-btn").onclick = function () {
        showDegreeDetailsModal(degree);
        sessionStorage.setItem('degree-id', degree.id);
      };

      // Delete button functionality
      card.querySelector(".delete-btn").onclick = function () {
        showDeleteConfirm(() => {
          // Redirect to backend delete URL
          if (degree.id) {
            window.location.href = `/executives/degree/delete/${degree.id}`;
          } else if (degree.code) {
            window.location.href = `/executives/degree/delete/${degree.code}`;
          } else {
            showWarningBox("Cannot delete: degree ID or code missing.");
          }
        });
      };

      grid.appendChild(card);
    });
}

// Show degree details modal
function showDegreeDetailsModal(degree, degreeIndex = null, isAddMode = false) {
  // Remove existing modal if any
  const oldModal = document.getElementById("degreeDetailsModal");
  if (oldModal) oldModal.remove();

  // Clone degree object for editing
  let editing = isAddMode ? true : false;
  let tempDegree = JSON.parse(JSON.stringify(degree));
  let selectedFaculty = degree.faculty || null;
  let descriptionExpanded = false;
  let selectedImageFile = null; // Store selected image file

  const modal = document.createElement("div");
  modal.id = "degreeDetailsModal";
  modal.className = "modal-overlay";

  function renderModalContent() {
    // Always sync input fields before re-rendering modal content if editing
    if (editing) {
      const titleInput = document.getElementById("edit-title");
      const codeInput = document.getElementById("edit-code");
      const durationInput = document.getElementById("edit-duration");
      if (titleInput) tempDegree.title = titleInput.value;
      if (codeInput) tempDegree.code = codeInput.value;
      if (durationInput) tempDegree.duration = durationInput.value;
    }
    // Calculate totals
    let totalCredit = 0,
      totalCourses = 0,
      totalHours = 0;
    if (tempDegree.syllabus && tempDegree.syllabus.length) {
      tempDegree.syllabus.forEach((sem) => {
        let semWeeks = sem.total_weeks || 16;
        sem.courses.forEach((course) => {
          totalCredit += Number(course.credit) || 0;
          totalHours += (Number(course.hours) || 0) * semWeeks;
        });
        totalCourses += sem.courses.length;
      });
    }

    // Editable fields or static text
    function field(name, value, type = "text", extra = "") {
      return editing
        ? `<input type="${type}" id="edit-${name}" value="${value}" class="form-input" ${extra}>`
        : `<span>${value}</span>`;
    }

    // Image upload section for add/edit mode
    let imageUploadHtml = "";
    if (editing) {
      imageUploadHtml = `
        <div class="image-upload-section mb-3">
          <label class="form-label d-block mb-2">
            <i class="fa-solid fa-image"></i> Degree Image
          </label>
          <div class="image-upload-container row align-items-center g-2">
            <div class="col-12 col-md-5 text-center mb-2 mb-md-0">
              <div class="image-preview border rounded shadow-sm p-2 bg-light" id="degreeImagePreview" style="min-height:120px;display:flex;align-items:center;justify-content:center;">
                <img src="${
                  tempDegree.image || "./img/bachelor.png"
                }" alt="Degree Image" id="previewImg" class="img-fluid rounded" style="max-height:100px;max-width:100%;object-fit:cover;">
              </div>
            </div>
            <div class="col-12 col-md-7 d-flex flex-column flex-md-row justify-content-center align-items-center gap-2">
              <input type="file" id="degreeImageInput" accept="image/*" style="display: none;">
              <button type="button" class="btn btn-primary upload-image-btn mb-2 mb-md-0" onclick="document.getElementById('degreeImageInput').click()">
                <i class="fa-solid fa-upload"></i> Choose Image
              </button>
              <button type="button" class="btn btn-outline-danger remove-image-btn ms-md-2" onclick="removeDegreeImage()" style="display: ${
                tempDegree.image && tempDegree.image !== "./img/bachelor.png"
                  ? "inline-block"
                  : "none"
              };">
                <i class="fa-solid fa-trash"></i> Remove
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // Faculty selection UI and Degree Description textarea
    let facultyHtml = "";
    if (editing) {
      facultyHtml = `
        <div class="faculty-section">
          <div class="faculty-label">
            <i class="fa-solid fa-graduation-cap"></i>
            Faculty
          </div>
          <button type="button" id="chooseFacultyBtn" class="choose-faculty-btn">
            ${
              selectedFaculty
                ? `<img src="${
                    window.ALL_FACULTIES.find(
                      (faculty) => faculty.id === selectedFaculty.id
                    ).photo
                  }" alt="Faculty Photo" class="faculty-avatar">${
                    selectedFaculty.name
                  }`
                : '<i class="fa-solid fa-plus"></i> Choose Faculty'
            }
          </button>
        </div>
        <div class="description-section">
          <div class="description-label">
            <i class="fa-solid fa-align-left"></i>
            Degree Description
          </div>
          <textarea id="edit-description" class="form-input form-textarea" placeholder="Enter degree description...">${
            tempDegree.description ? tempDegree.description : ""
          }</textarea>
        </div>
      `;
    } else {
      facultyHtml = `
        <div class="faculty-section">
          <div class="faculty-label">
            <i class="fa-solid fa-graduation-cap"></i>
            Faculty
          </div>
          ${
            selectedFaculty
              ? `<div class="d-flex align-center gap-2"><img src="${
                  window.ALL_FACULTIES.find(
                    (faculty) => faculty.id === selectedFaculty.id
                  ).photo
                }" alt="Faculty Photo" class="faculty-avatar">${
                  selectedFaculty.name
                }</div>`
              : '<span style="color:#888;">Not chosen</span>'
          }
        </div>
        <div class="description-section">
          <div class="description-label">
            <i class="fa-solid fa-align-left"></i>
            Degree Description
          </div>
          <div class="description-content">
            <p class="description-text ${
              !descriptionExpanded ? "collapsed" : ""
            }">${
        tempDegree.description
          ? tempDegree.description
          : "No description available"
      }</p>
            ${
              tempDegree.description && tempDegree.description.length > 150
                ? `<button class="read-more-btn" onclick="toggleDescription()">${
                    descriptionExpanded
                      ? '<i class="fa-solid fa-chevron-up"></i> Read Less'
                      : '<i class="fa-solid fa-chevron-down"></i> Read More'
                  }</button>`
                : ""
            }
          </div>
        </div>
      `;
    }

    // Editable courses table
    let semestersHtml = "";
    if (tempDegree.syllabus && tempDegree.syllabus.length) {
      semestersHtml = tempDegree.syllabus
        .map((sem, sIdx) => {
          let semCredit = 0,
            semHours = 0;
          // Add total_weeks field if not present
          if (
            editing &&
            (typeof sem.total_weeks === "undefined" || sem.total_weeks === null)
          ) {
            sem.total_weeks = 16;
          }
          const rows = sem.courses
            .map((course, cIdx) => {
              semCredit += Number(course.credit) || 0;
              semHours += Number(course.hours) || 0;
              return editing
                ? `
            <tr>
              <td><span>${course.code}</span></td>
              <td><span>${course.title}</span></td>
              <td><span>${course.credit}</span></td>
              <td><span>${course.hours}</span></td>
              <td>
                <select data-sem="${sIdx}" data-course="${cIdx}" class="edit-course-field course-type-select" data-field="type">
                  <option value="Core" ${
                    course.type === "Core" ? "selected" : ""
                  }>Core</option>
                  <option value="Elective" ${
                    course.type === "Elective" ? "selected" : ""
                  }>Elective</option>
                  <option value="Supporting" ${
                    course.type === "Supporting" ? "selected" : ""
                  }>Supporting</option>
                  <option value="Extra Curricular" ${
                    course.type === "Extra Curricular" ? "selected" : ""
                  }>Extra Curricular</option>
                </select>
              </td>
              <td>
                <button type="button" class="remove-course-btn course-remove-btn" data-sem="${sIdx}" data-course="${cIdx}" title="Remove">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
          `
                : `
            <tr>
              <td>${course.code}</td>
              <td>${course.title}</td>
              <td>${course.credit}</td>
              <td>${course.hours}</td>
              <td>${course.type}</td>
            </tr>
          `;
            })
            .join("");
          return `
          <div class="semester-item">
            <div class="semester-header">
              <div class="semester-title">
                <i class="fa-solid fa-book"></i>
                Semester ${sem.semester}
              </div>
              ${
                editing
                  ? `<div class="semester-actions">
                <button type="button" class="semester-action-btn remove-semester-btn" data-sem="${sIdx}" title="Remove Semester">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>`
                  : ""
              }
            </div>
            <div class="semester-content">
              <div class="semester-weeks">
                <span class="weeks-label">Total Weeks to Study:</span>
                ${
                  editing
                    ? `<input type='number' min='1' max='52' value='${sem.total_weeks}' data-sem-weeks='${sIdx}' class='edit-semester-weeks weeks-input'>`
                    : `<span>${sem.total_weeks || 16}</span>`
                }
              </div>
              <table class="courses-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Title</th>
                    <th>Credit</th>
                    <th>Hours</th>
                    <th>Type</th>
                    ${editing ? `<th></th>` : ""}
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
              <div class="text-center mb-1">
                <strong>Total Credits:</strong> ${semCredit} &nbsp; | &nbsp; <strong>Total Hours:</strong> ${semHours}
              </div>
              ${
                editing
                  ? `<button type="button" class="add-course-btn" data-sem="${sIdx}">
                <i class="fa-solid fa-plus"></i> Add Course
              </button>`
                  : ""
              }
            </div>
          </div>
        `;
        })
        .join("");
    } else {
      semestersHtml = `<div class="text-center" style="color:#888;padding:2rem;">No syllabus data available.</div>`;
    }

    // Modal actions
    let actionsHtml = "";
    if (editing && isAddMode) {
      sessionStorage.setItem('mode', 'add');
      actionsHtml = `
        <button id="saveDegreeBtn" class="modal-action-btn">
          <i class="fa-solid fa-save"></i> Save
        </button>
        <button id="closeDegreeDetailsBtn" class="modal-action-btn">
          <i class="fa-solid fa-times"></i> Close
        </button>
      `;
    } else if (editing) {
      sessionStorage.setItem('mode', 'edit');
      actionsHtml = `
        <button id="saveDegreeBtn" class="modal-action-btn">
          <i class="fa-solid fa-save"></i> Save
        </button>
        <button id="cancelEditBtn" class="modal-action-btn">
          <i class="fa-solid fa-times"></i> Cancel
        </button>
      `;
    } else {
      actionsHtml = `
        <button id="editDegreeBtn" class="modal-action-btn">
          <i class="fa-solid fa-edit"></i> Edit
        </button>
        <button id="closeDegreeDetailsBtn" class="modal-action-btn">
          <i class="fa-solid fa-times"></i> Close
        </button>
      `;
    }
    // document.getElementById('showAddModalBtn').addEventListener('click', ()=> {
    //   sessionStorage.setItem('mode', 'add');
    // })
    // document.getElementById('editDegreeBtn').addEventListener('click', ()=> {
    //   sessionStorage.setItem('mode', 'edit');
    // })

    // Two-column layout for Add New Degree (editing && isAddMode)
    if (editing) {
      // Use two-column layout for both add and edit
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">
              <i class="fa-solid fa-graduation-cap"></i>
              ${isAddMode ? "Add New Degree" : "Edit Degree"}
            </h2>
            <div class="modal-actions">
              ${actionsHtml}
            </div>
          </div>
          <div class="modal-body">
            <div class="add-degree-grid row g-4">
              <div class="col-12 col-md-6">
                <div class="form-group mb-3">
                  <label class="form-label">Degree Name</label>
                  ${field("title", tempDegree.title)}
                </div>
                <div class="form-group mb-3">
                  <label class="form-label">Degree Code</label>
                  ${field("code", tempDegree.code)}
                </div>
                <div class="form-group mb-3">
                  <label class="form-label">Duration (Years)</label>
                  ${field(
                    "duration",
                    tempDegree.duration,
                    "number",
                    "min='1' max='10'"
                  )}
                </div>
                ${imageUploadHtml}
                ${facultyHtml}
              </div>
              <div class="col-12 col-md-6">
                <div class="syllabus-section">
                  <h3 class="syllabus-title">
                    <i class="fa-solid fa-list"></i>
                    Syllabus Structure
                  </h3>
                  <div>
                    ${semestersHtml}
                    <button type="button" class="add-semester-btn">
                      <i class="fa-solid fa-plus"></i> Add Semester
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      // ...existing code...
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">
              <i class="fa-solid fa-graduation-cap"></i>
              ${isAddMode ? "Add New Degree" : "Degree Details"}
            </h2>
            <div class="modal-actions">
              ${actionsHtml}
            </div>
          </div>
          <div class="modal-body">
            ${
              editing
                ? `<div class="edit-form">${/* ...existing code... */ ""}
                  <div class="form-row">
                    <div class="form-group form-col">
                      <label class="form-label">Degree Name</label>
                      ${field("title", tempDegree.title)}
                    </div>
                    <div class="form-group form-col">
                      <label class="form-label">Degree Code</label>
                      ${field("code", tempDegree.code)}
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group form-col">
                      <label class="form-label">Duration (Years)</label>
                      ${field(
                        "duration",
                        tempDegree.duration,
                        "number",
                        "min='1' max='10'"
                      )}
                    </div>
                  </div>
                  ${imageUploadHtml}
                  ${facultyHtml}
                </div>`
                : `<div class="degree-details-section">${
                    /* ...existing code... */ ""
                  }
                  <div class="degree-details-header">
                    <div class="degree-details-image">
                      <img src="${tempDegree.image}" alt="Degree Image">
                    </div>
                    <div class="degree-details-info">
                      <h1 class="degree-details-title">${tempDegree.title}</h1>
                      <span class="degree-details-code">${
                        tempDegree.code
                      }</span>
                      <div class="degree-details-meta">
                        <div class="degree-meta-item">
                          <div class="degree-meta-icon">
                            <i class="fa-solid fa-clock"></i>
                          </div>
                          <div class="degree-meta-content">
                            <h4>Duration</h4>
                            <p>${tempDegree.duration} Years</p>
                          </div>
                        </div>
                        <div class="degree-meta-item">
                          <div class="degree-meta-icon">
                            <i class="fa-solid fa-star"></i>
                          </div>
                          <div class="degree-meta-content">
                            <h4>Total Credits</h4>
                            <p>${totalCredit}</p>
                          </div>
                        </div>
                        <div class="degree-meta-item">
                          <div class="degree-meta-icon">
                            <i class="fa-solid fa-book"></i>
                          </div>
                          <div class="degree-meta-content">
                            <h4>Total Courses</h4>
                            <p>${totalCourses}</p>
                          </div>
                        </div>
                        <div class="degree-meta-item">
                          <div class="degree-meta-icon">
                            <i class="fa-solid fa-clock"></i>
                          </div>
                          <div class="degree-meta-content">
                            <h4>Total Hours</h4>
                            <p>${totalHours}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  ${facultyHtml}
                </div>`
            }
            <div class="syllabus-section">
              <h3 class="syllabus-title">
                <i class="fa-solid fa-list"></i>
                Syllabus Structure
              </h3>
              <div>
                ${semestersHtml}
                ${
                  editing
                    ? `<button type="button" class="add-semester-btn">
                      <i class="fa-solid fa-plus"></i> Add Semester
                    </button>`
                    : ""
                }
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Set up image upload functionality
    if (editing) {
      setupImageUpload();
    }
  }

  // Global function for toggling description
  window.toggleDescription = function () {
    descriptionExpanded = !descriptionExpanded;
    const descText = modal.querySelector(".description-text");
    const readMoreBtn = modal.querySelector(".read-more-btn");
    const icon = readMoreBtn.querySelector("i");

    if (descriptionExpanded) {
      descText.classList.remove("collapsed");
      readMoreBtn.innerHTML =
        '<i class="fa-solid fa-chevron-up"></i> Read Less';
    } else {
      descText.classList.add("collapsed");
      readMoreBtn.innerHTML =
        '<i class="fa-solid fa-chevron-down"></i> Read More';
    }
  };

  // Global function for removing degree image
  window.removeDegreeImage = function () {
    tempDegree.image = "./img/bachelor.png";
    const previewImg = document.getElementById("previewImg");
    if (previewImg) {
      previewImg.src = "./img/bachelor.png";
    }
    const removeBtn = document.querySelector(".remove-image-btn");
    if (removeBtn) {
      removeBtn.style.display = "none";
    }
    selectedImageFile = null;
  };

  // Setup image upload functionality
  function setupImageUpload() {
    const imageInput = modal.querySelector("#degreeImageInput");
    if (imageInput) {
      imageInput.onchange = function (e) {
        const file = e.target.files[0];
        if (file) {
          selectedImageFile = file;
          const reader = new FileReader();
          reader.onload = function (e) {
            tempDegree.image = e.target.result;
            const previewImg = document.getElementById("previewImg");
            if (previewImg) {
              previewImg.src = e.target.result;
            }
            const removeBtn = document.querySelector(".remove-image-btn");
            if (removeBtn) {
              removeBtn.style.display = "inline-block";
            }
          };
          reader.readAsDataURL(file);
        }
      };
    }
  }

  // Global function for removing degree image
  window.removeDegreeImage = function () {
    tempDegree.image = "./img/bachelor.png";
    const previewImg = document.getElementById("previewImg");
    if (previewImg) {
      previewImg.src = "./img/bachelor.png";
    }
    const removeBtn = document.querySelector(".remove-image-btn");
    if (removeBtn) {
      removeBtn.style.display = "none";
    }
    selectedImageFile = null;
  };

  // Setup image upload functionality
  function setupImageUpload() {
    const imageInput = modal.querySelector("#degreeImageInput");
    if (imageInput) {
      imageInput.onchange = function (e) {
        const file = e.target.files[0];
        if (file) {
          selectedImageFile = file;
          const reader = new FileReader();
          reader.onload = function (e) {
            tempDegree.image = e.target.result;
            const previewImg = document.getElementById("previewImg");
            if (previewImg) {
              previewImg.src = e.target.result;
            }
            const removeBtn = document.querySelector(".remove-image-btn");
            if (removeBtn) {
              removeBtn.style.display = "inline-block";
            }
          };
          reader.readAsDataURL(file);
        }
      };
    }
  }

  // Initial render
  renderModalContent();
  document.body.appendChild(modal);

  // Set up image upload functionality
  if (editing) {
    setupImageUpload();
  }

  // Modal actions event delegation
  function setModalEvents() {
    // Close (when not editing or when adding a new degree)
    const closeBtn = modal.querySelector("#closeDegreeDetailsBtn");
    if (closeBtn && (!editing || isAddMode))
      closeBtn.onclick = () => modal.remove();

    // Edit
    const editBtn = modal.querySelector("#editDegreeBtn");
    if (editBtn)
      editBtn.onclick = () => {
        editing = true;
        renderModalContent();
        setModalEvents();
        setEditEvents();
      };

    // Cancel (only when editing)
    const cancelBtn = modal.querySelector("#cancelEditBtn");
    if (cancelBtn && editing)
      cancelBtn.onclick = () => {
        editing = false;
        tempDegree = JSON.parse(JSON.stringify(degree));
        renderModalContent();
        setModalEvents();
      };

    // Save
    const saveBtn = modal.querySelector("#saveDegreeBtn");
    if (saveBtn)
      saveBtn.onclick = () => {
        // Validate all courses: code and title must not be empty
        let invalid = false;
        if (tempDegree.syllabus && tempDegree.syllabus.length) {
          tempDegree.syllabus.forEach((sem, sIdx) => {
            sem.courses.forEach((course, cIdx) => {
              if (!course.code.trim() || !course.title.trim()) {
                invalid = true;
              }
            });
          });
        }
        if (invalid) {
          showWarningBox(
            "Every course must have a non-empty <b>code</b> and <b>title</b>."
          );
          return;
        }

        // Save edited fields
        tempDegree.title = modal.querySelector("#edit-title").value;
        tempDegree.code = modal.querySelector("#edit-code").value;
        tempDegree.duration = modal.querySelector("#edit-duration").value;
        // Save degree description
        const descInput = modal.querySelector("#edit-description");
        if (descInput) tempDegree.description = descInput.value;

        // Recalculate totals
        let totalCredit = 0,
          totalCourses = 0,
          totalHours = 0;
        if (tempDegree.syllabus && tempDegree.syllabus.length) {
          tempDegree.syllabus.forEach((sem) => {
            let semWeeks = sem.total_weeks || 16;
            sem.courses.forEach((course) => {
              totalCredit += Number(course.credit) || 0;
              totalHours += (Number(course.hours) || 0) * semWeeks;
            });
            totalCourses += sem.courses.length;
          });
        }
        tempDegree.credit = totalCredit;
        tempDegree.courses = totalCourses;
        tempDegree.total_hours = totalHours;

        // Compose degreeData for logging
        const degreeData = {
          name: tempDegree.title,
          code: tempDegree.code,
          faculty:
            tempDegree.faculty && tempDegree.faculty.id
              ? tempDegree.faculty.id
              : null,
          description: tempDegree.description || "",
          total_credits: tempDegree.credit,
          total_courses: tempDegree.courses,
          total_hours: tempDegree.total_hours,
          degree_image: tempDegree.image,
          duration: document.getElementById('edit-duration').value,
          semesters: (tempDegree.syllabus || []).map((sem, idx) => ({
            semester_name: `Semester ${sem.semester || idx + 1}`,
            duration_weeks: sem.total_weeks || 16,
            syllabus_structure: (sem.courses || []).map((course) => ({
              course_code: course.code,
              course_name: course.title,
              course_credits: course.credit,
              course_hours: course.hours,
              type: course.type,
            })),
          })),
        };

        // Show confirmation modal for both add and edit
        const confirmModal = document.createElement("div");
        confirmModal.id = "confirmSaveModal";
        confirmModal.className = "modal-overlay";
        confirmModal.innerHTML = `
          <div class="faculty-selection-modal">
            <div class="faculty-modal-header">
              <h3 class="faculty-modal-title">
                <i class="fa-solid fa-save"></i>
                Are you sure?
              </h3>
            </div>
            <div class="text-center mb-3">
              <p>Are you sure you want to submit this degree?</p>
            </div>
            <div class="faculty-modal-actions">
              <button id="confirmSaveBtn" class="faculty-modal-btn primary">Yes, Submit</button>
              <button id="cancelSaveBtn" class="faculty-modal-btn secondary">Cancel</button>
            </div>
          </div>
        `;
        document.body.appendChild(confirmModal);
        document.getElementById("confirmSaveBtn").onclick = function () {
          confirmModal.remove();
          console.log(
            degreeData
          );
          mode = sessionStorage.getItem('mode');
          url = mode=='edit'? `/executives/api/degree/edit/${sessionStorage.getItem('degree-id')}/`: '/executives/api/degree/add/';
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': window.CSRF_TOKEN, // include CSRF token here
            },
            body: JSON.stringify(degreeData)
          })
          .then(response => response.json())
          .then(async (data) => {
            console.log(data);
            if (data.success) await alert("Degree Data Updated Successfully");
            modal.remove();
            window.location.reload();
          })
          .catch(async (error) => {
            console.error('Error:', error);
            await alert(error);
          });
        };
        document.getElementById("cancelSaveBtn").onclick = function () {
          confirmModal.remove();
        };
      };
  }

  function syncDegreeFieldsFromInputs() {
    if (!editing) return;
    const titleInput = modal.querySelector("#edit-title");
    const codeInput = modal.querySelector("#edit-code");
    let durationInput = modal.querySelector("#edit-duration");
    if (titleInput) tempDegree.title = titleInput.value;
    if (codeInput) tempDegree.code = codeInput.value;
    if (durationInput) tempDegree.duration = durationInput.value;
  }

  // Set events for editing fields and courses
  function setEditEvents() {
    // Faculty choose button event
    const chooseFacultyBtn = modal.querySelector("#chooseFacultyBtn");
    if (chooseFacultyBtn) {
      chooseFacultyBtn.onclick = function (e) {
        e.preventDefault();
        // Always sync input values before opening faculty selection
        const titleInput = modal.querySelector("#edit-title");
        const codeInput = modal.querySelector("#edit-code");
        const durationInput = modal.querySelector("#edit-duration");
        const descInput = modal.querySelector("#edit-description");
        if (titleInput) tempDegree.title = titleInput.value;
        if (codeInput) tempDegree.code = codeInput.value;
        if (durationInput) tempDegree.duration = durationInput.value;
        if (descInput) tempDegree.description = descInput.value;
        showFacultySelectionModal(function (faculty) {
          // Sync again before re-rendering
          const titleInput2 = modal.querySelector("#edit-title");
          const codeInput2 = modal.querySelector("#edit-code");
          const durationInput2 = modal.querySelector("#edit-duration");
          const descInput2 = modal.querySelector("#edit-description");
          if (titleInput2) tempDegree.title = titleInput2.value;
          if (codeInput2) tempDegree.code = codeInput2.value;
          if (durationInput2) tempDegree.duration = durationInput2.value;
          if (descInput2) tempDegree.description = descInput2.value;
          selectedFaculty = faculty;
          tempDegree.faculty = faculty;
          renderModalContent();
          setModalEvents();
          setEditEvents();
        });
        titleInput.value = tempDegree.title;
        codeInput.value = tempDegree.code;
        durationInput.value = tempDegree.duration;
        descInput.value = tempDegree.description;
      };
    }

    // Course field edits
    modal.querySelectorAll(".edit-course-field").forEach((input) => {
      input.addEventListener("input", function (e) {
        const semIdx = +this.dataset.sem;
        const courseIdx = +this.dataset.course;
        const field = this.dataset.field;
        tempDegree.syllabus[semIdx].courses[courseIdx][field] = this.value;

        // Recalculate totals
        let totalCredit = 0,
          totalCourses = 0,
          totalHours = 0;
        tempDegree.syllabus.forEach((sem) => {
          sem.courses.forEach((course) => {
            totalCredit += Number(course.credit) || 0;
            totalHours += Number(course.hours) || 0;
          });
          totalCourses += sem.courses.length;
        });

        // Update totals in modal (if you use IDs for totals)
        const creditCell = modal.querySelector("#totalCreditCell");
        const coursesCell = modal.querySelector("#totalCoursesCell");
        const hoursCell = modal.querySelector("#totalHoursCell");
        if (creditCell) creditCell.textContent = totalCredit;
        if (coursesCell) coursesCell.textContent = totalCourses;
        if (hoursCell) hoursCell.textContent = totalHours;
      });
    });

    // Remove course
    modal.querySelectorAll(".remove-course-btn").forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        const semIdx = +this.dataset.sem;
        const courseIdx = +this.dataset.course;
        // Save scroll position
        const scrollable = modal.querySelector(".modal-body");
        const scrollTop = scrollable ? scrollable.scrollTop : 0;

        // Sync degree fields before changing syllabus
        const titleInput = modal.querySelector("#edit-title");
        const codeInput = modal.querySelector("#edit-code");
        const durationInput = modal.querySelector("#edit-duration");
        const descInput = modal.querySelector("#edit-description");
        if (titleInput) tempDegree.title = titleInput.value;
        if (codeInput) tempDegree.code = codeInput.value;
        if (durationInput) tempDegree.duration = durationInput.value;
        if (descInput) tempDegree.description = descInput.value;

        tempDegree.syllabus[semIdx].courses.splice(courseIdx, 1);

        renderModalContent();
        setModalEvents();
        setEditEvents();

        // Restore scroll position
        const newScrollable = modal.querySelector(".modal-body");
        if (newScrollable) newScrollable.scrollTop = scrollTop;
      });
    });

    // Add course (open course selection modal)
    modal.querySelectorAll(".add-course-btn").forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        const semIdx = +this.dataset.sem;
        // Save scroll position
        const scrollable = modal.querySelector(".modal-body");
        const scrollTop = scrollable ? scrollable.scrollTop : 0;

        // Sync degree fields before changing syllabus
        const titleInput = modal.querySelector("#edit-title");
        const codeInput = modal.querySelector("#edit-code");
        const durationInput = modal.querySelector("#edit-duration");
        const descInput = modal.querySelector("#edit-description");
        if (titleInput) tempDegree.title = titleInput.value;
        if (codeInput) tempDegree.code = codeInput.value;
        if (durationInput) tempDegree.duration = durationInput.value;
        if (descInput) tempDegree.description = descInput.value;

        // Show course selection modal
        showCourseSelectionModal((selectedCourse) => {
          tempDegree.syllabus[semIdx].courses.push({
            code: selectedCourse.course_code,
            title: selectedCourse.course_name,
            credit: selectedCourse.course_credits,
            hours: selectedCourse.course_hours,
            type: "Core",
          });
          renderModalContent();
          setModalEvents();
          setEditEvents();
          // Restore scroll position
          const newScrollable = modal.querySelector(".modal-body");
          if (newScrollable) newScrollable.scrollTop = scrollTop;
        });
      });
    });

    // Semester weeks input events
    modal.querySelectorAll(".edit-semester-weeks").forEach((input) => {
      input.addEventListener("input", function (e) {
        const semIdx = +this.dataset.semWeeks;
        let val = parseInt(this.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 52) val = 52;
        tempDegree.syllabus[semIdx].total_weeks = val;
        // Don't re-render entire modal, just update the value
        tempDegree.syllabus[semIdx].total_weeks = val;
      });
    });

    // Add course selection modal function
    function showCourseSelectionModal(onSelect) {
      // Remove any existing modal
      const oldModal = document.getElementById("courseSelectionModal");
      if (oldModal) oldModal.remove();

      // Fetch all courses (simulate with mock data or fetch from backend if available)
      // Replace this with an AJAX call if you have an API endpoint
      const allCourses = window.ALL_COURSES;

      let filteredCourses = allCourses;

      const modal = document.createElement("div");
      modal.id = "courseSelectionModal";
      modal.className = "modal-overlay";

      function renderCourseList() {
        const rows = filteredCourses
          .map(
            (course) => `
          <tr class="course-select-row" style="cursor:pointer;" data-code="${course.course_code}" course-id="${course.course_id}">
            <td>${course.course_code}</td>
            <td>${course.course_name}</td>
            <td>${course.course_credits}</td>
            <td>${course.course_hours}</td>
          </tr>
        `
          )
          .join("");
        return rows;
      }

      modal.innerHTML = `
        <div class="faculty-selection-modal">
          <div class="faculty-modal-header">
            <h3 class="faculty-modal-title">
              <i class="fa-solid fa-book"></i>
              Select a Course
            </h3>
          </div>
          <input id="courseSearchInput" type="text" placeholder="Search by code or name..." class="faculty-search-input">
          <div class="faculty-list">
            <table class="courses-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Credits</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody id="courseListBody">
                ${renderCourseList()}
              </tbody>
            </table>
          </div>
          <div class="faculty-modal-actions">
            <button id="closeCourseSelectBtn" class="faculty-modal-btn secondary">Cancel</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Search functionality
      const searchInput = modal.querySelector("#courseSearchInput");
      searchInput.oninput = function () {
        const q = this.value.trim().toLowerCase();
        filteredCourses = allCourses.filter(
          (c) =>
            c.course_code.toLowerCase().includes(q) ||
            c.course_name.toLowerCase().includes(q)
        );
        modal.querySelector("#courseListBody").innerHTML = renderCourseList();
        setRowEvents();
      };

      // Row click event
      function setRowEvents() {
        modal.querySelectorAll(".course-select-row").forEach((row) => {
          row.onclick = function () {
            const code = this.getAttribute("data-code");
            const id = this.getAttribute("course-id");
            const course = allCourses.find((c) => c.course_code === code);
            if (course) {
              modal.remove();
              onSelect(course);
            }
          };
        });
      }
      setRowEvents();

      // Cancel button
      modal.querySelector("#closeCourseSelectBtn").onclick = () =>
        modal.remove();
    }

    // Faculty selection modal
    function showFacultySelectionModal(onSelect) {
      const oldModal = document.getElementById("facultySelectionModal");
      if (oldModal) oldModal.remove();
      // Use window.ALL_FACULTIES if available, else mock
      const faculties = window.ALL_FACULTIES;
      let filtered = faculties;
      const modal = document.createElement("div");
      modal.id = "facultySelectionModal";
      modal.className = "modal-overlay";

      function renderList() {
        return filtered
          .map(
            (f) => `
          <div class="faculty-item" data-id="${f.id}">
            <img src="${f.photo}" alt="Faculty Photo" class="faculty-avatar-large">
            <span class="faculty-name">${f.name}</span>
          </div>
        `
          )
          .join("");
      }

      modal.innerHTML = `
        <div class="faculty-selection-modal">
          <div class="faculty-modal-header">
            <h3 class="faculty-modal-title">
              <i class="fa-solid fa-graduation-cap"></i>
              Select a Faculty
            </h3>
          </div>
          <input id="facultySearchInput" type="text" placeholder="Search faculty..." class="faculty-search-input">
          <div class="faculty-list" id="facultyListBody">
            ${renderList()}
          </div>
          <div class="faculty-modal-actions">
            <button id="closeFacultySelectBtn" class="faculty-modal-btn secondary">Cancel</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Search
      modal.querySelector("#facultySearchInput").oninput = function () {
        const q = this.value.trim().toLowerCase();
        filtered = faculties.filter((f) => f.name.toLowerCase().includes(q));
        modal.querySelector("#facultyListBody").innerHTML = renderList();
        setRowEvents();
      };

      function setRowEvents() {
        modal.querySelectorAll(".faculty-item").forEach((row) => {
          row.onclick = function () {
            const id = this.getAttribute("data-id");
            const faculty = faculties.find((f) => String(f.id) === String(id));
            if (faculty) {
              modal.remove();
              onSelect(faculty);
            }
          };
        });
      }
      setRowEvents();
      modal.querySelector("#closeFacultySelectBtn").onclick = () =>
        modal.remove();
    }

    // Remove semester
    modal.querySelectorAll(".remove-semester-btn").forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        const semIdx = +this.dataset.sem;
        showDeleteSemesterConfirm(() => {
          // Save scroll position
          const scrollable = modal.querySelector(".modal-body");
          const scrollTop = scrollable ? scrollable.scrollTop : 0;

          // Sync degree fields before changing syllabus
          const titleInput = modal.querySelector("#edit-title");
          const codeInput = modal.querySelector("#edit-code");
          const durationInput = modal.querySelector("#edit-duration");
          const descInput = modal.querySelector("#edit-description");
          if (titleInput) tempDegree.title = titleInput.value;
          if (codeInput) tempDegree.code = codeInput.value;
          if (durationInput) tempDegree.duration = durationInput.value;
          if (descInput) tempDegree.description = descInput.value;

          tempDegree.syllabus.splice(semIdx, 1);

          renderModalContent();
          setModalEvents();
          setEditEvents();

          // Restore scroll position
          const newScrollable = modal.querySelector(".modal-body");
          if (newScrollable) newScrollable.scrollTop = scrollTop;
        });
      });
    });

    // Add semester
    const addSemesterBtn = modal.querySelector(".add-semester-btn");
    if (addSemesterBtn) {
      addSemesterBtn.addEventListener("click", function (e) {
        e.preventDefault();
        // Save scroll position
        const scrollable = modal.querySelector(".modal-body");
        const scrollTop = scrollable ? scrollable.scrollTop : 0;

        // --- Sync degree fields before changing syllabus ---
        const titleInput = modal.querySelector("#edit-title");
        const codeInput = modal.querySelector("#edit-code");
        const durationInput = modal.querySelector("#edit-duration");
        const descInput = modal.querySelector("#edit-description");
        if (titleInput) tempDegree.title = titleInput.value;
        if (codeInput) tempDegree.code = codeInput.value;
        if (durationInput) tempDegree.duration = durationInput.value;
        if (descInput) tempDegree.description = descInput.value;

        // Ensure syllabus is always an array
        if (!Array.isArray(tempDegree.syllabus)) {
          tempDegree.syllabus = [];
        }

        let nextSem = 1;
        if (tempDegree.syllabus.length > 0) {
          nextSem = Math.max(...tempDegree.syllabus.map((s) => s.semester)) + 1;
        }
        tempDegree.syllabus.push({
          semester: nextSem,
          courses: [],
        });

        renderModalContent();
        setModalEvents();
        setEditEvents();

        // Restore scroll position
        const newScrollable = modal.querySelector(".modal-body");
        if (newScrollable) newScrollable.scrollTop = scrollTop;
      });
    }
  }

  setModalEvents();
  if (editing) setEditEvents();
}

// Custom confirm modal
function showDeleteConfirm(onConfirm) {
  const oldModal = document.getElementById("deleteConfirmModal");
  if (oldModal) oldModal.remove();

  const modal = document.createElement("div");
  modal.id = "deleteConfirmModal";
  modal.className = "modal-overlay";

  modal.innerHTML = `
    <div class="faculty-selection-modal">
      <div class="faculty-modal-header">
        <h3 class="faculty-modal-title">
          <i class="fa-solid fa-exclamation-triangle"></i>
          Confirm Delete
        </h3>
      </div>
      <div class="text-center mb-3">
        <p>Are you sure you want to delete this degree?</p>
      </div>
      <div class="faculty-modal-actions">
        <button id="confirmDeleteBtn" class="faculty-modal-btn primary">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
        <button id="cancelDeleteBtn" class="faculty-modal-btn secondary">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("confirmDeleteBtn").onclick = () => {
    modal.remove();
    onConfirm();
  };
  document.getElementById("cancelDeleteBtn").onclick = () => {
    modal.remove();
  };
}

// Warning box function
function showWarningBox(message, reload = false) {
  // Remove any existing warning
  const oldWarn = document.getElementById("customWarningBox");
  if (oldWarn) oldWarn.remove();

  const warn = document.createElement("div");
  warn.id = "customWarningBox";
  warn.className = "modal-overlay";
  warn.innerHTML = `
    <div class="faculty-selection-modal">
      <div class="faculty-modal-header">
        <h3 class="faculty-modal-title">
          <i class="fa-solid fa-info-circle"></i>
          Information
        </h3>
      </div>
      <div class="text-center mb-3">
        <div>${message}</div>
      </div>
      <div class="faculty-modal-actions">
        <button id="closeWarningBoxBtn" class="faculty-modal-btn primary">OK</button>
      </div>
    </div>
  `;

  document.body.appendChild(warn);
  document.getElementById("closeWarningBoxBtn").onclick = () => {
    warn.remove();
    if (reload) window.location.reload();
  };
}

// Render on page load
const degrees = getDegrees();
renderDegrees(degrees);

// sidebar toggle code
const sidebar = document.getElementById("sidebarMenu");
const toggleBtn = document.getElementById("sidebarToggle");

function handleSidebarToggle() {
  if (window.innerWidth > 900) {
    document.body.classList.toggle("sidebar-closed");
  } else {
    document.body.classList.toggle("sidebar-open");
  }
  // Always close sidebar on mobile when resizing up
  if (window.innerWidth > 900) {
    document.body.classList.remove("sidebar-open");
  }
}

if (toggleBtn) {
  toggleBtn.onclick = handleSidebarToggle;
}

// Optional: Reset sidebar state on resize
window.addEventListener("resize", () => {
  if (window.innerWidth > 900) {
    document.body.classList.remove("sidebar-open");
    // Show sidebar by default on desktop
    document.body.classList.remove("sidebar-closed");
  } else {
    // Hide sidebar by default on mobile
    document.body.classList.remove("sidebar-closed");
  }
});

function showDeleteSemesterConfirm(onConfirm) {
  const oldModal = document.getElementById("deleteSemesterConfirmModal");
  if (oldModal) oldModal.remove();

  const modal = document.createElement("div");
  modal.id = "deleteSemesterConfirmModal";
  modal.className = "modal-overlay";

  modal.innerHTML = `
    <div class="faculty-selection-modal">
      <div class="faculty-modal-header">
        <h3 class="faculty-modal-title">
          <i class="fa-solid fa-exclamation-triangle"></i>
          Delete Semester
        </h3>
      </div>
      <div class="text-center mb-3">
        <p>Are you sure you want to delete this entire semester?</p>
        <p class="text-danger"><strong>All courses in this semester will be removed.</strong></p>
      </div>
      <div class="faculty-modal-actions">
        <button id="confirmDeleteSemesterBtn" class="faculty-modal-btn primary">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
        <button id="cancelDeleteSemesterBtn" class="faculty-modal-btn secondary">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("confirmDeleteSemesterBtn").onclick = () => {
    modal.remove();
    onConfirm();
  };
  document.getElementById("cancelDeleteSemesterBtn").onclick = () => {
    modal.remove();
  };
}

// Add Degree Modal
document.getElementById("showAddModalBtn").onclick = function () {
  // Create a blank degree object
  const newDegree = {
    title: "",
    code: "",
    duration: "",
    credit: 0,
    courses: 0,
    image: "./img/bachelor.png",
    syllabus: [],
  };
  // Show the modal in editing mode
  showDegreeDetailsModal(newDegree, null, true);
};

function filterDegrees(query) {
  const degrees = getDegrees();
  const q = query.trim().toLowerCase();
  if (!q) {
    renderDegrees(degrees);
    return;
  }
  const filtered = degrees.filter(
    (d) => d.title.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)
  );
  renderDegrees(filtered);
}

const searchInput = document.getElementById("degreeSearchInput");
const searchBtn = document.getElementById("degreeSearchBtn");

if (searchInput && searchBtn) {
  searchBtn.onclick = () => filterDegrees(searchInput.value);
  searchInput.oninput = () => filterDegrees(searchInput.value);
}
