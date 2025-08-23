const MARKING_TYPES = window.marking_types;
const MAX_ROWS = 10;

let markingSchemeEditMode = false;

async function fetchMarkingScheme() {
  const batchId = window.batch_instructor.id;
  try {
    const response = await fetch(`/faculty/api/assessment_scheme/${batchId}/`);
    if (!response.ok) throw new Error("Failed to fetch marking scheme");
    const data = await response.json();
    if (data.scheme) {
      return Object.entries(data.scheme).map(([type, mark]) => ({
        type,
        mark,
      }));
    }
    return [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function saveMarkingSchemeToBackend(rows) {
  const batchId = window.batch_instructor.id;
  const scheme = {};
  rows.forEach((row) => {
    scheme[row.type] = Number(row.mark) || 0;
  });
  try {
    await fetch(`/faculty/api/assessment_scheme/${batchId}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": window.csrf_token,
      },
      body: JSON.stringify({ scheme }),
    });
    await alert("Marking scheme has been successfully changed.");
  } catch (err) {
    console.error("Failed to save marking scheme", err);
  }
}

function renderMarkingScheme(rows = [], readonly = true) {
  const section = document.getElementById("markingSchemeSection");
  section.innerHTML = "";

  if (rows.length === 0) {
    // No marking scheme yet, allow creation
    const btn = document.createElement("div");
    btn.textContent = "No Marking Scheme Provided Yet";
    btn.className = "create-scheme-btn";
    section.appendChild(btn);
    return;
  }

  // Table
  const table = document.createElement("table");
  table.className = "marking-table";
  table.innerHTML = rows
    .map(
      (row, idx) => `
    <tr>
      <td>
        ${readonly
          ? `<span>${row.type}</span>`
          : `<select class="mark-type-select" data-idx="${idx}">
              ${MARKING_TYPES.map(
            (type) =>
              `<option value="${type}" ${row.type === type ? "selected" : ""
              } ${rows.some((r, i) => r.type === type && i !== idx)
                ? "disabled"
                : ""
              }>${type}</option>`
          ).join("")}
            </select>`
        }
      </td>
      <td>
        ${readonly
          ? `<span>${row.mark} %</span>`
          : `<input type="number" min="0" max="100" value="${row.mark}" class="mark-input" style="width:70px;" data-idx="${idx}"> %`
        }
        ${!readonly
          ? `
          <button class="edit-btn remove-row-btn" data-idx="${idx}" title="Remove row">
            <i class="fa-solid fa-trash"></i>
          </button>
        `
          : ""
        }
      </td>
    </tr>
  `
    )
    .join("");
  section.appendChild(table);



  // Add row event
  const addBtn = document.getElementById("addMarkingRowBtn");
  if (addBtn) {
    addBtn.onclick = () => {
      syncMarkingSchemeRows(section, rows);
      const total = rows.reduce((sum, row) => sum + (Number(row.mark) || 0), 0);
      if (total >= 100) {
        showCustomWarning(
          "Total marking percentage cannot exceed <b>100%</b>. You cannot add another marking scheme."
        );
        return;
      }
      if (rows.length < MAX_ROWS) {
        rows.push(createEmptyRow(rows));
        renderMarkingScheme(rows, false);
      }
    };
  }

  // Remove row event
  section.querySelectorAll(".remove-row-btn").forEach((btn) => {
    btn.onclick = () => {
      const idx = +btn.dataset.idx;
      rows.splice(idx, 1);
      renderMarkingScheme(rows, false);
    };
  });

  // Prevent duplicate marking types
  section.querySelectorAll(".mark-type-select").forEach((select) => {
    select.onchange = function () {
      const idx = +this.dataset.idx;
      rows[idx].type = this.value;
      renderMarkingScheme(rows, false);
    };
  });

}

function createEmptyRow(rows) {
  const used = rows.map((r) => r.type);
  const type = MARKING_TYPES.find((t) => !used.includes(t)) || MARKING_TYPES[0];
  return { type, mark: 0 };
}

function validateMarkingScheme(section, rows) {
  const inputs = section.querySelectorAll(".mark-input");
  let total = 0;
  inputs.forEach((input) => {
    total += Number(input.value) || 0;
  });
  if (total > 100) {
    showCustomWarning("Total marking percentage cannot exceed <b>100%</b>.");
  }
}

function showCustomWarning(message) {
  const popup = document.getElementById("customWarningPopup");
  const msg = document.getElementById("customWarningMessage");
  const okBtn = document.getElementById("customWarningOkBtn");
  msg.innerHTML = message;
  popup.style.display = "flex";
  okBtn.onclick = () => {
    popup.style.display = "none";
  };
}

function syncMarkingSchemeRows(section, rows) {
  const typeSelects = section.querySelectorAll(".mark-type-select");
  const markInputs = section.querySelectorAll(".mark-input");
  typeSelects.forEach((select, idx) => {
    rows[idx].type = select.value;
  });
  markInputs.forEach((input, idx) => {
    rows[idx].mark = Number(input.value) || 0;
  });
}

function showLoading(targetId) {
  const target = document.getElementById(targetId);
  if (target) {
    target.innerHTML = `
      <div style="display:flex;justify-content:center;align-items:center;height:120px;">
        <img src="https://i.imgur.com/llF5iyg.gif" alt="Loading..." style="height:48px;">
      </div>
    `;
  }
}

async function renderAllSections() {
  // Show loading for all sections
  showLoading("markingSchemeSection");
  showLoading("activitySection");
  showLoading("yourDocsGrid");
  showLoading("referredDocsGrid");
  // If you have other instructor grids, show loading there too

  // Fetch all data in parallel
  const markingPromise = fetchMarkingScheme();
  const assessmentsPromise = fetchAssessments();
  console.log(assessmentsPromise);
  const docsPromise = fetchDocuments();
  const referredDocsPromise = fetchReferredDocuments();

  // Wait for all
  const [markingRows, assessmentsByType, docsData, referredDocs] =
    await Promise.all([
      markingPromise,
      assessmentsPromise,
      docsPromise,
      referredDocsPromise,
    ]);

  // Render marking scheme
  renderMarkingScheme(markingRows, markingRows.length > 0 ? true : false);

  // Render assessments
  renderAssessmentsWithData(markingRows, assessmentsByType);

  // Render documents
  renderDocumentsWithData(docsData, referredDocs);
}

// Modified renderAssessments to accept data
function renderAssessmentsWithData(markingRows, assessmentsByType) {
  const section = document.getElementById("activitySection");
  if (!section) return;
  section.innerHTML = "";

  const assessmentTypes = markingRows.map((row) => row.type);

  assessmentTypes.forEach((type) => {
    // Section title and add button
    const sectionTitle = document.createElement("div");
    sectionTitle.className = "item-section-title";
    sectionTitle.innerHTML = `
      ${type}
      <button class="add-card-btn" data-type="${type}" title="Add ${type}">
        <i class="fa-solid fa-plus"></i>
      </button>
    `;
    section.appendChild(sectionTitle);

    // Grid
    const grid = document.createElement("div");
    grid.className = "item-grid";
    grid.id = `assessmentGrid-${type}`;
    const assessments = assessmentsByType[type] || [];
    grid.innerHTML = assessments
      .map(
        (a, i) => `
          <div class="item-card">
            <div style="display: flex; align-items: center; gap: 6px; padding: 8px;">
              <button class="item-card-edit" data-type="${type}" data-id="${a.id}" title="Edit" 
                onclick="window.location.href = '/faculty/${type.toLowerCase().replace(/\s+/g, '')}_creation/${a.id}/';">
                <i class="fa-solid fa-pen"></i>
              </button>

              <button class="item-card-delete" data-type="${type}" data-id="${a.id}" title="Delete">
                <i class="fa-solid fa-trash"></i>
              </button>

              <button class="item-card-view-results" title="View Results" 
                onclick="window.location.href = '${type.toLowerCase().replace(/\s+/g, '') === 'quiz'
                  ? `/faculty/quiz_results/${a.id}`
                  : `/faculty/assessment_submissions/${a.id}`
                }';">
                <i class="fa-solid fa-chart-column"></i>
              </button>
            </div>

            <div class="item-card-image">
              <i class="fa-solid fa-cloud card-icon"></i>
            </div>
            <div class="item-card-title">${a.title || type + " " + (i + 1)}</div>
          </div>
        `
      )
      .join("");

    section.appendChild(grid);
    grid.querySelectorAll(".item-card-delete").forEach((deleteBtn) => {
      deleteBtn.addEventListener("click", async () => {
        const assessmentId = deleteBtn.getAttribute("data-id");
        if (!await confirm("Are you sure to remove this assessment?")) {
          return;
        }
        const ok = await deleteAssessment(assessmentId);
        if (ok) {
          await alert("Assessment deleted successfully");
          renderAllSections();
        }
      });
    });
  });

  section.querySelectorAll(".add-card-btn").forEach((btn) => {
    btn.onclick = async function () {
      const type = btn.getAttribute("data-type");
      if (!await confirm(`Create a new assessment for "${type}"?`)) return;
      const ok = await createAssessment(type);
      if (ok) renderAllSections();
    };
  });
}

// Modified renderDocuments to accept data
function renderDocumentsWithData(docsData, referredDocs) {
  const yourId = docsData.you;
  const instructors = docsData.instructors;
  const byInstructor = docsData.by_instructor;

  // Documents By You
  const yourDocsGrid = document.getElementById("yourDocsGrid");
  if (yourDocsGrid) {
    yourDocsGrid.innerHTML = "";
    if (byInstructor[yourId]) {
      yourDocsGrid.innerHTML = byInstructor[yourId]
        .map(
          (doc, i) => `
        <div class="item-card">
          <div style="display:flex;align-items:center;gap:6px;padding:8px;">
            <button class="item-card-download" title="Download" onclick="window.open('${doc.file_link}', '_blank')"><i class="fa-solid fa-download"></i></button>
            <button class="item-card-delete" title="Delete" onclick="deleteDocument(${doc.id})"><i class="fa-solid fa-trash"></i></button>
          </div>
          <div class="item-card-image">
            <i class="fa-solid fa-file card-icon""></i>
          </div>
          <div class="item-card-title">${doc.name}</div>
          <button class="refer-btn" onclick="referDocumentHandler(${doc.id})">Refer to Students</button>
        </div>
      `
        )
        .join("");
    }
  }

  // Remove all previous other instructor sections
  document
    .querySelectorAll(".other-instructor-section")
    .forEach((el) => el.remove());

  // Documents By Other Instructors - create elements dynamically
  window.other_instructors.forEach((otherInstructorId) => {
    // Create section title row
    const sectionTitleRow = document.createElement("div");
    console.log(byInstructor[otherInstructorId]);
    sectionTitleRow.className =
      "item-section-title-row other-instructor-section";
    sectionTitleRow.innerHTML = `<span class="item-section-title">Documents By ${byInstructor[otherInstructorId] ? byInstructor[otherInstructorId][0].uploader_name : ""}</span>`;
    // Create item grid
    const grid = document.createElement("div");
    grid.className = "item-grid other-instructor-section";
    grid.id = `docsGrid-${otherInstructorId}`;

    // Try all key types: string, int, stringified int
    let docs = byInstructor[otherInstructorId];
    if (!docs) docs = byInstructor[parseInt(otherInstructorId)];
    if (!docs) docs = byInstructor[String(parseInt(otherInstructorId))];
    if (!docs) docs = [];

    grid.innerHTML = docs
      .map(
        (doc, i) => `
      <div class="item-card">
        <div style="display:flex;align-items:center;gap:6px;padding:8px;">
          <button class="item-card-download" title="Download" onclick="window.open('${doc.file_link
          }', '_blank')"><i class="fa-solid fa-download"></i></button>
        </div>
        <div class="item-card-image">
          <i class="fa-solid fa-file card-icon"></i>
        </div>
        <div class="item-card-title">${doc.name}<br>${doc.uploader_name ||
          instructors[otherInstructorId] ||
          instructors[parseInt(otherInstructorId)] ||
          instructors[String(parseInt(otherInstructorId))] ||
          otherInstructorId
          }</div>
        <button class="refer-btn" onclick="referDocumentHandler(${doc.id
          })">Refer to Students</button>
      </div>
    `
      )
      .join("");

    // Insert after yourDocsGrid
    const parent = document.querySelector(".course-card");
    parent.appendChild(sectionTitleRow);
    parent.appendChild(grid);
  });

  // Referred Documents
  const referredDocsGrid = document.getElementById("referredDocsGrid");
  if (referredDocsGrid) {
    referredDocsGrid.innerHTML = referredDocs
      .map(
        (doc, i) => `
      <div class="item-card">
        <div style="display:flex;align-items:center;gap:6px;padding:8px;">
          <button class="item-card-download" title="Download" onclick="window.open('${doc.file_link}', '_blank')"><i class="fa-solid fa-download"></i></button>
          <button class="item-card-delete" title="Delete" onclick="deleteReferredDocument(${doc.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
        <div class="item-card-image">
          <i class="fa-solid fa-file card-icon"></i>
        </div>
        <div class="item-card-title">${doc.name}<br>${doc.uploader_name}</div>
      </div>
    `
      )
      .join("");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  renderAllSections();
});

let activities = {
  quizzes: [{ title: "Quiz 1" }, { title: "Quiz 2" }, { title: "Quiz 3" }],
  assignments: [
    { title: "Assignment 1" },
    { title: "Assignment 2" },
    { title: "Assignment 3" },
  ],
};

if (typeof pdfjsLib === "undefined") {
  await alert("PDF.js is not loaded! Please check your script order.");
}

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
}

function handleFileUpload(event, cardIdx) {
  const file = event.target.files[0];
  const previewBox = document.getElementById(`docImagePreview-${cardIdx}`);

  if (!file) return;

  const ext = file.name.split(".").pop().toLowerCase();

  if (ext === "pdf") {
    const reader = new FileReader();
    reader.onload = function (e) {
      const typedarray = new Uint8Array(e.target.result);
      pdfjsLib
        .getDocument({ data: typedarray })
        .promise.then(function (pdf) {
          pdf
            .getPage(1)
            .then(function (page) {
              const viewport = page.getViewport({ scale: 1 });
              const canvas = document.createElement("canvas");
              const context = canvas.getContext("2d");
              canvas.height = 80;
              canvas.width = (80 * viewport.width) / viewport.height;
              const renderContext = {
                canvasContext: context,
                viewport: page.getViewport({
                  scale: canvas.height / viewport.height,
                }),
              };
              page.render(renderContext).promise.then(function () {
                const previewUrl = canvas.toDataURL();
                saveDocData(file, status, cardIdx, previewUrl);
              });
            })
            .catch(function () {
              const iconUrl = encodeSVG(
                '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#eee"/><text x="20" y="50" font-size="40" fill="#888">P</text></svg>'
              );
              saveDocData(file, status, cardIdx, iconUrl);
            });
        })
        .catch(function () {
          const iconUrl = encodeSVG(
            '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#eee"/><text x="20" y="50" font-size="40" fill="#888">P</text></svg>'
          );
          saveDocData(file, status, cardIdx, iconUrl);
        });
    };
    reader.readAsArrayBuffer(file);
  } else if (["doc", "docx", "ppt", "pptx"].includes(ext)) {
    let icon = "";
    if (ext.startsWith("doc")) {
      icon =
        '<i class="fa-solid fa-file-word" style="font-size:40px;color:#2b579a;"></i>';
    } else {
      icon =
        '<i class="fa-solid fa-file-powerpoint" style="font-size:40px;color:#d24726;"></i>';
    }
    previewBox.innerHTML = icon;
  } else {
    previewBox.innerHTML = '<i class="fa-solid fa-file card-icon"></i>';
  }
}

let referredDocs = [];
let yourDocs = [];

let editingDocIdx = null;
let isNewDoc = false;

function downloadDoc(idx) {
  const doc = yourDocs[idx];
  if (!doc.fileBlob) return;
  const url = URL.createObjectURL(doc.fileBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.fileName || "document";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openEditDocPopup(docIdx) {
  document.getElementById("editDocPopup").style.display = "flex";
  document.getElementById("editDocForm").dataset.docIdx = docIdx;
  document.getElementById("editDocForm").reset();
}
function closeEditDocPopup() {
  document.getElementById("editDocPopup").style.display = "none";
  isNewDoc = false;
  editingDocIdx = null;
}

function setupEditDocButtons() {
  document
    .querySelectorAll("#yourDocsGrid .item-card-edit")
    .forEach((btn, idx) => {
      btn.onclick = function () {
        isNewDoc = false;
        openEditDocPopup(idx);
      };
    });
}

const docAddForm = document.getElementById("editDocForm");
docAddForm.onsubmit = async function (e) {
  e.preventDefault();
  if (!await confirm("Are you sure to add this document")) return;
  docAddForm.submit();
};

function saveDocData(file, status, docIdx, previewUrl) {
  const docData = {
    title: file.name,
    owner: "You",
    fileName: file.name,
    fileBlob: file,
    fileType: file.type,
    status: status,
    previewUrl: previewUrl,
  };
  if (isNewDoc) {
    yourDocs.push(docData);
  } else {
    yourDocs[docIdx] = docData;
  }
  closeEditDocPopup();
  isNewDoc = false;
  editingDocIdx = null;
}

document.getElementById("addYourDocBtn").onclick = function () {
  isNewDoc = true;
  editingDocIdx = yourDocs.length;
  openEditDocPopup(editingDocIdx);
};

setupEditDocButtons();

function encodeSVG(svg) {
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

async function downloadDrDoc(idx) {
  const doc = drDocs[idx];
  if (!doc.fileBlob) {
    await alert("No file available for download.");
    return;
  }
  const url = URL.createObjectURL(doc.fileBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.fileName || doc.title || "document";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function fetchAssessments() {
  // await alert('fetchAssessment()');
  const batchId = window.batch_instructor.id;
  try {
    const response = await fetch(`/faculty/api/assessments/${batchId}/`);
    if (!response.ok) throw new Error("Failed to fetch assessments");
    const data = await response.json();
    console.log(data);
    return data;
  } catch (err) {
    console.error(err);
    return {};
  }
}

async function deleteAssessment(assessmentId) {
  // await alert('fetchAssessment()');
  const batchId = window.batch_instructor.id;
  try {
    const response = await fetch(
      `/faculty/api/assessments/delete/${assessmentId}/`
    );
    if (!response.ok) throw new Error("Failed to delete assessments");
    const data = await response.json();
    console.log(data);
    return data;
  } catch (err) {
    console.error(err);
    return {};
  }
}

async function createAssessment(type) {
  // await alert(type);
  const batchId = window.batch_instructor.id;
  try {
    const response = await fetch(`/faculty/api/assessments/${batchId}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": window.csrf_token,
      },
      body: JSON.stringify({ type }),
    });
    if (!response.ok) throw new Error("Failed to create assessment");
    await alert("Assessment created successfully.");
    renderAssessments();
    return true;
  } catch (err) {
    await alert("Failed to create assessment.");
    return false;
  }
}

async function renderAssessments() {
  // Find the section to render assessments
  const section = document.getElementById("activitySection");
  if (!section) return;
  section.innerHTML = "";

  // Get current marking scheme types
  const markingRows = await fetchMarkingScheme();
  const assessmentTypes = markingRows.map((row) => row.type);

  // Get assessments grouped by type
  const assessmentsByType = await fetchAssessments();
  console.log(assessmentsByType);

  assessmentTypes.forEach((type) => {
    // Section title and add button
    const sectionTitle = document.createElement("div");
    sectionTitle.className = "item-section-title";
    sectionTitle.innerHTML = `
      ${type}
      <button class="add-card-btn" data-type="${type}" title="Add ${type}">
        <i class="fa-solid fa-plus"></i>
      </button>
    `;
    section.appendChild(sectionTitle);

    // Grid
    const grid = document.createElement("div");
    grid.className = "item-grid";
    grid.id = `assessmentGrid-${type}`;
    const assessments = assessmentsByType[type] || [];
    grid.innerHTML = assessments
      .map(
        (a, i) => `
      <div class="item-card">
        <div style="display: flex; align-items: center; gap: 6px; padding: 8px;">
          <button class="item-card-edit" data-type="${type}" data-id="${a.id}" title="Edit" 
            onclick="window.location.href = '/faculty/${type.toLowerCase().replace(/\s+/g, '')}_creation/${a.id}/';">
            <i class="fa-solid fa-pen"></i>
          </button>

          <button class="item-card-delete" data-type="${type}" data-id="${a.id}" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>

          <button class="item-card-view-results" title="View Results" 
            onclick="window.location.href = (type.toLowerCase().replace(/\s+/g, '') == 'quiz') 
              ? '/faculty/quiz_results/${a.id}' 
              : '/faculty/assessment_submissions/${a.id}';">
            <i class="fa-solid fa-chart-column"></i>
          </button>
        </div>

        <div class="item-card-image">
          <i class="fa-solid fa-cloud card-icon"></i>
        </div>
        <div class="item-card-title">${a.title || type + " " + (i + 1)}</div>
      </div>
    `
      )
      .join("");
    section.appendChild(grid);
    grid.querySelectorAll(".item-card-delete").forEach((deleteBtn) => {
      deleteBtn.addEventListener("click", async () => {
        const assessmentId = deleteBtn.getAttribute("data-id");
        // await alert(assessmentId);
        if (!await confirm("Are you sure to remove this assessment?")) {
          return;
        }
        const ok = await deleteAssessment(assessmentId);
        if (ok) {
          await alert("Assessment deleted successfully");
          renderAssessments();
        }
      });
    });

    // Add assessment event
    section.querySelectorAll(".add-card-btn").forEach((btn) => {
      btn.onclick = async function () {
        const type = btn.getAttribute("data-type");
        if (!await confirm(`Create a new assessment for "${type}"?`)) return;
        const ok = await createAssessment(type);
        if (ok) renderAssessments();
      };
    });
    // Edit/delete logic can be added here as needed
  });
}

async function fetchDocuments() {
  const courseId = window.batch_instructor.course__id;
  const instructorId = window.instructor?.id || null;
  try {
    const response = await fetch(`/faculty/api/documents/${courseId}/`);
    if (!response.ok) throw new Error("Failed to fetch documents");
    const data = await response.json(); // { by_instructor: {user_id: [doc, ...]}, instructors: {user_id: name}, you: user_id }
    // Ensure 'you' is set to window.instructor.id if available
    if (instructorId) {
      data.you = instructorId.toString();
    }
    return data;
  } catch (err) {
    console.error(err);
    return { by_instructor: {}, instructors: {}, you: instructorId };
  }
}

async function fetchReferredDocuments() {
  const batchInstructorId = window.batch_instructor.id;
  try {
    const response = await fetch(
      `/faculty/api/referred_documents/${batchInstructorId}/`
    );
    if (!response.ok) throw new Error("Failed to fetch referred documents");
    return await response.json(); // [{...doc}, ...]
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function addDocument(formData) {
  try {
    const response = await fetch(`/faculty/api/documents/add/`, {
      method: "POST",
      headers: { "X-CSRFToken": window.csrf_token },
      body: formData,
    });
    if (!response.ok) throw new Error("Failed to add document");
    await alert("Document added successfully.");
    renderDocuments();
    return true;
  } catch (err) {
    await alert("Failed to add document.");
    return false;
  }
}

async function referDocument(documentId) {
  const batchInstructorId = window.batch_instructor.id;
  try {
    const response = await fetch(
      `/faculty/api/refer_document/${batchInstructorId}/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": window.csrf_token,
        },
        body: JSON.stringify({ document_id: documentId }),
      }
    );

    // Parse the JSON response
    const data = await response.json();

    // Check if response was ok and backend returned success
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to refer document");
    }

    await alert("Document referred successfully.");
    window.location.reload();
    return true;

  } catch (err) {
    await alert(err);
    return false;
  }
}

async function renderDocuments() {
  const docsData = await fetchDocuments();
  const referredDocs = await fetchReferredDocuments();
  const yourId = docsData.you;
  const instructors = docsData.instructors;
  const byInstructor = docsData.by_instructor;

  // Documents By You (using window.instructor.id if available)
  const yourDocsGrid = document.getElementById("yourDocsGrid");
  yourDocsGrid.innerHTML = "";
  if (byInstructor[yourId]) {
    yourDocsGrid.innerHTML = byInstructor[yourId]
      .map(
        (doc, i) => `
      <div class="item-card">
        <div style="display:flex;align-items:center;gap:6px;padding:8px;">
          <button class="item-card-download" title="Download" onclick="window.open('${doc.file_link}', '_blank')"><i class="fa-solid fa-download"></i></button>
          <button class="item-card-delete" title="Delete" onclick="deleteDocument(${doc.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
        <div class="item-card-image">
          <i class="fa-solid fa-file card-icon"></i>
        </div>
        <div class="item-card-title">${doc.name}</div>
        <button class="refer-btn" onclick="referDocumentHandler(${doc.id})">Refer to Students</button>
      </div>
    `
      )
      .join("");
  }
  // Add button
  const addBtn = document.createElement("button");
  addBtn.className = "add-card-btn";
  addBtn.id = "addYourDocBtn";
  addBtn.title = "Add Document";
  addBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
  addBtn.onclick = showAddDocumentPopup;
  // yourDocsGrid.parentElement.querySelector('.item-section-title-row').appendChild(addBtn);

  // Documents By Others
  Object.entries(byInstructor).forEach(([userId, docs]) => {
    if (userId == yourId) return;
    const grid = document.getElementById(`docsGrid-${userId}`);
    if (!grid) return;
    grid.innerHTML = docs
      .map(
        (doc, i) => `
      <div class="item-card">
        <div style="display:flex;align-items:center;gap:6px;padding:8px;">
          <button class="item-card-download" title="Download" onclick="window.open('${doc.file_link}', '_blank')"><i class="fa-solid fa-download"></i></button>
        </div>
        <div class="item-card-image">
          <i class="fa-solid fa-file card-icon"></i>
        </div>
        <div class="item-card-title">${doc.name}<br>${doc.uploader_name}</div>
        <button class="refer-btn" onclick="referDocumentHandler(${doc.id})">Refer to Students</button>
      </div>
    `
      )
      .join("");
  });

  // Referred Documents (no add-card-btn beside title)
  const referredDocsGrid = document.getElementById("referredDocsGrid");
  referredDocsGrid.innerHTML = referredDocs
    .map(
      (doc, i) => `
    <div class="item-card">
      <div style="display:flex;align-items:center;gap:6px;padding:8px;">
        <button class="item-card-download" title="Download" onclick="window.open('${doc.file_link}', '_blank')"><i class="fa-solid fa-download"></i></button>
        <button class="item-card-delete" title="Delete" onclick="deleteReferredDocument(${doc.id})"><i class="fa-solid fa-trash"></i></button>
      </div>
        <div class="item-card-image">
          <i class="fa-solid fa-file card-icon"></i>
        </div>
      <div class="item-card-title">${doc.name}<br>${doc.uploader_name}</div>
    </div>
  `
    )
    .join("");
}

function showAddDocumentPopup() {
  // Create a popup div
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.top = "0";
  popup.style.left = "0";
  popup.style.width = "100vw";
  popup.style.height = "100vh";
  popup.style.background = "rgba(0,0,0,0.3)";
  popup.style.display = "flex";
  popup.style.alignItems = "center";
  popup.style.justifyContent = "center";
  popup.style.zIndex = "9999";

  popup.innerHTML = `
    <div style="background:#fff;padding:2rem;border-radius:1rem;min-width:320px;max-width:90vw;box-shadow:0 2px 16px #0002;">
      <h3>Add Document</h3>
      <form id="addDocForm">
        <label style="display:block;margin-bottom:12px;">
          Document Name:<br>
          <input type="text" id="addDocName" required style="width:100%;margin-top:4px;">
        </label>
        <label style="display:block;margin-bottom:12px;">
          Document File:<br>
          <input type="file" id="addDocFile" required style="width:100%;margin-top:4px;">
        </label>
        <label style="display:block;margin-bottom:12px;">
          Access Status:<br>
          <select id="addDocAccess" style="width:100%;margin-top:4px;">
            <option value="A">Public</option>
            <option value="B">Private</option>
          </select>
        </label>
        <div style="margin-top:18px;">
          <button type="submit" class="save-btn">Save</button>
          <button type="button" class="cancel-btn" id="cancelAddDocBtn">Cancel</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(popup);

  document.getElementById("cancelAddDocBtn").onclick = function () {
    popup.remove();
  };

  document.getElementById("addDocForm").onsubmit = async function (e) {
    e.preventDefault();
    const name = document.getElementById("addDocName").value.trim();
    const fileInput = document.getElementById("addDocFile");
    const access = document.getElementById("addDocAccess").value;
    const file = fileInput.files[0];
    if (!name || !file) {
      await alert("Please provide both document name and file.");
      return;
    }
    if (!await confirm("Are you sure you want to add this document?")) return;
    const formData = new FormData();
    formData.append("name", name);
    formData.append("access_status", access);
    formData.append("file", file);
    formData.append("course_id", window.batch_instructor.course__id);
    const ok = await addDocument(formData);
    if (ok) {
      popup.remove();
      renderDocuments();
    }
  };
}

window.referDocumentHandler = async function (documentId) {
  if (!await confirm("Refer this document to students?")) return;
  const ok = await referDocument(documentId);
  if (ok) renderDocuments();
};

window.deleteDocument = async function (documentId) {
  if (!await confirm("Are you sure to delete this document permanently?")) return;
  fetch(`/faculty/document/delete/${documentId}/`)
    .then((r) =>
      r.ok
        ? r.text().then(async () => {
          await alert("Document Deleted successfully");
          renderDocuments();
        })
        : console.log("Error:", r.error)
    )
    .catch((e) => console.log("Error:", e));
};

window.deleteReferredDocument = async function (documentId) {
  if (!await confirm("Are you sure to unrefer this document?")) return;
  fetch(`/faculty/batch_instructor_document/delete/${documentId}/`)
    .then((r) =>
      r.ok
        ? r.text().then(async () => {
          await alert("Document Unreffered successfully");
          renderDocuments();
        })
        : console.log("Error:", r.error)
    )
    .catch((e) => console.log("Error:", e));
};
