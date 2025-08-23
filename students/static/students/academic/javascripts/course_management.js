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

function renderMarkingScheme(rows = [], readonly = true) {
  const section = document.getElementById("markingSchemeSection");
  section.innerHTML = "";

  if (rows.length === 0) {
    // You can create elements here
  }

  // Header
  const header = document.createElement("div");
  header.className = "marking-header";
  header.innerHTML = `
    <span>Marking Scheme</span>
    ${readonly ? `` : ` `}
  `;
  section.appendChild(header);

  // Table
  const table = document.createElement("table");
  table.className = "marking-table";
  table.innerHTML = rows
    .map(
      (row, idx) => `
    <tr>
      <td>
        ${
          readonly
            ? `<span>${row.type}</span>`
            : `<select class="mark-type-select" data-idx="${idx}">
              ${MARKING_TYPES.map(
                (type) =>
                  `<option value="${type}" ${
                    row.type === type ? "selected" : ""
                  } ${
                    rows.some((r, i) => r.type === type && i !== idx)
                      ? "disabled"
                      : ""
                  }>${type}</option>`
              ).join("")}
            </select>`
        }
      </td>
      <td>
        ${
          readonly
            ? `<span>${row.mark} %</span>`
            : `<input type="number" min="0" max="100" value="${row.mark}" class="mark-input" style="width:70px;" data-idx="${idx}"> %`
        }
        ${
          !readonly
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

  // Edit button event
  if (readonly) {
    const editBtn = document.getElementById("editMarkingSchemeBtn");
    if (editBtn) {
      editBtn.onclick = () => {
        markingSchemeEditMode = true;
        renderMarkingScheme(rows, false);
      };
    }
    return;
  }

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
      <div class="item-card assessment" data-id="${a.id}" type="${a.type}" type_id="${a.type_id}">
        <div style="display: flex; align-items: center; gap: 6px; padding: 8px;">
        </div>
        <div class="item-card-image">
          <i class="fa-solid fa-cloud card-icon"></i>
        </div>
        <div class="item-card-title">${a.title || type + " " + (i + 1)}</div>
        <div class="item-card-due">Due:${a.end_time || '-'}</div>
      </div>
    `
      )
      .join("");
    section.appendChild(grid);
  });

  section.querySelectorAll(".add-card-btn").forEach((btn) => {
    btn.onclick = async function () {
      const type = btn.getAttribute("data-type");
      if (!await confirm(`Create a new assessment for "${type}"?`)) return;
      const ok = await createAssessment(type);
      if (ok) renderAllSections();
    };
  });
  document.querySelectorAll('.assessment').forEach(assessment => {
    assessment.addEventListener('click', () => {
      const assessment_id = assessment.getAttribute('data-id');
      const type = assessment.getAttribute('type');
      const type_id = assessment.getAttribute('type_id');
      window.location.href = `/students/academics/assessment/${assessment_id}?type=${encodeURIComponent(type_id)}`;
    });
  });
}

// Modified renderDocuments to accept data
function renderDocumentsWithData(docsData, referredDocs) {
  // Referred Documents
  const referredDocsGrid = document.getElementById("referredDocsGrid");
  if (referredDocsGrid) {
    referredDocsGrid.innerHTML = referredDocs
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

  assessmentTypes.forEach((type) => {
    // Section title and add button
    const sectionTitle = document.createElement("div");
    sectionTitle.className = "item-section-title";
    sectionTitle.innerHTML = `
      ${type}
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
      <div class="item-card assessment" data-id="${a.id}" type="${a.type}" type_id="${a.type_id}">
        <div style="display: flex; align-items: center; gap: 6px; padding: 8px;">
        </div>
        <div class="item-card-image">
          <i class="fa-solid fa-cloud card-icon"></i>
        </div>  
        <div class="item-card-title">${a.title || type + " " + (i + 1)}</div>
        <div class="item-card-due">Due:${a.end_time || '-'}</div>
      </div>
    `
      )
      .join("");
    section.appendChild(grid);
  });

  // Add assessment event
  section.querySelectorAll(".add-card-btn").forEach((btn) => {
    btn.onclick = async function () {
      const type = btn.getAttribute("data-type");
      if (!await confirm(`Create a new assessment for "${type}"?`)) return;
      const ok = await createAssessment(type);
      if (ok) renderAssessmentsx();
    };
  });
  // Edit/delete logic can be added here as needed

    document.querySelectorAll('.assessment').forEach(assessment => {
    assessment.addEventListener('click', () => {
      const assessment_id = assessment.getAttribute('data-id');

      window.location.href = `/students/academics/assessment/${assessment_id}`;
    });
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

  // Referred Documents (no add-card-btn beside title)
  const referredDocsGrid = document.getElementById("referredDocsGrid");
  referredDocsGrid.innerHTML = referredDocs
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
    </div>
  `
    )
    .join("");
}
