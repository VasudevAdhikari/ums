// University information

document.addEventListener('DOMContentLoaded', function () {
    const inputs = {
        logo: document.getElementById('inputLogo'),
        name: document.getElementById('inputName'),
        address: document.getElementById('inputAddress'),   
        email: document.getElementById('inputEmail'),
        website: document.getElementById('inputWebsite'),
        social: document.getElementById('inputSocialLink'),
        hours: document.getElementById('inputHours'),
        description: document.getElementById('inputDescription'),
        originalLogo: document.getElementById('originalLogo')
    };

    //==============start modify===========================
    const previews = {
        logos: document.querySelectorAll('.logoPreview'),
        name: document.getElementById('uniName'),
        address: document.getElementById('uniAddress'),
        email: document.getElementById('uniEmail'),
        website: document.getElementById('uniWebsite'),
        social: document.getElementById('uniSocialLink'),
        hours: document.getElementById('uniHours'),
        description: document.getElementById('uniDescription')
    };
    //============end modify=================================

    function updatePreview() {
        const fields = ['name', 'address', 'email', 'website', 'social', 'hours', 'description'];
        fields.forEach(field => {
            const value = inputs[field].value.trim();
            if (value !== "") {
                previews[field].textContent = value;
            }
        });
    }


    let newLogoBase64 = ""; // For tracking if a new image is uploaded

    // Live preview for text inputs
    Object.values(inputs).forEach(input => {
        if (input && input.type !== 'file') {
            input.addEventListener('input', updatePreview);
        }
    });

    // Handle logo upload preview
    inputs.logo.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                newLogoBase64 = event.target.result;
                previews.logos.forEach(img => img.src = newLogoBase64);
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('editModal').addEventListener('show.bs.modal', function () {
        // Set current text to inputs
        inputs.name.value = previews.name.textContent.trim();
        inputs.address.value = previews.address.textContent.trim();
        inputs.email.value = previews.email.textContent.trim();
        inputs.website.value = previews.website.textContent.trim();
        inputs.social.value = previews.social.textContent.trim();
        inputs.hours.value = previews.hours.textContent.trim();
        inputs.description.value = previews.description.textContent.trim();

        // Accessibility fix: ensure modal is not aria-hidden and not inert when shown
        this.removeAttribute('aria-hidden');
        this.removeAttribute('inert');
    });

    // Accessibility fix: remove aria-hidden and inert after modal is hidden
    document.getElementById('editModal').addEventListener('hidden.bs.modal', function () {
        this.removeAttribute('aria-hidden');
        this.removeAttribute('inert');
    });
});


// University information

// University Photos

// University Photos Management

//Edit and Delete function
document.addEventListener('DOMContentLoaded', function () {
    // Reset modal when closed
    const editModalElement = document.getElementById('editCaptionModal');
    editModalElement.addEventListener('hidden.bs.modal', resetEditModal);

    // Handle all edit/delete buttons inside photoGrid
    document.getElementById('photoGrid').addEventListener('click', function (event) {
        const btn = event.target.closest('button');
        if (!btn) return;

        const card = btn.closest('.card');
        const caption = card.querySelector('.uni-caption');

        if (btn.classList.contains('edit-btn')) {
            currentCaptionId = caption.id;
            document.getElementById('captionText').value = caption.textContent;
            new bootstrap.Modal(editModalElement).show();
        }

        if (btn.classList.contains('delete-btn')) {
            deleteTargetId = card.id;
            new bootstrap.Modal(document.getElementById('deleteConfirmModal')).show();
        }
    });

    // Handle edit form submission
    document.getElementById('editCaptionForm').addEventListener('submit', function (e) {
        e.preventDefault();
        if (!currentCaptionId) return;

        const newCaption = document.getElementById('captionText').value;
        const captionElem = document.getElementById(currentCaptionId);
        if (captionElem) {
            captionElem.textContent = newCaption;
        }

        bootstrap.Modal.getInstance(editModalElement).hide();
        resetEditModal();
    });

    // Handle delete confirmation
    document.getElementById('confirmDeleteBtn').addEventListener('click', function () {
        if (!deleteTargetId) return;

        const cardElement = document.getElementById(deleteTargetId);
        if (cardElement) {
            const cardCol = cardElement.closest('.col-md-4');
            if (cardCol) cardCol.remove();
        }

        deleteTargetId = '';
        bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
    });
});


// Reset the edit modal state
function resetEditModal() {
    document.getElementById('captionText').value = '';
    currentCaptionId = '';
}

// Global state holders
let currentCaptionId = '';
let deleteTargetId = '';

//Edit and Delete function

//Upload photos

document.getElementById('uploadPhotoForm').addEventListener('submit', handlePhotoUpload);

function handlePhotoUpload(event) {
    event.preventDefault();

    const fileInput = document.getElementById('newPhoto');
    const captionInput = document.getElementById('newCaption');
    const file = fileInput.files[0];
    const caption = captionInput.value;

    const reader = new FileReader();
    reader.onload = function (e) {
        const newCardId = 'photo-' + Date.now();
        const captionId = 'caption-' + Date.now();

        const photoGrid = document.getElementById('photoGrid');
        const col = document.createElement('div');
        col.className = 'col-8 col-sm-6 col-md-4 mb-4';
        col.innerHTML = `
            
           
              <div class="card position-relative shadow-sm" id="${newCardId}">
                <img src="${e.target.result}" class="card-img-top img-fluid" alt="Photo">
                <div class="card-body">
                  <p class="card-text uni-caption text-center" id="${captionId}">${caption}</p>
                </div>
                <div class="position-absolute top-0 end-0 m-2 d-flex gap-1">
                  <button class="btn btn-sm btn-light edit-btn" ><i class="fas fa-pen"></i></button>
                  <button class="btn btn-sm btn-danger delete-btn"><i class="fas fa-trash"></i></button>
                </div>
              </div>
           
        `;
        photoGrid.appendChild(col);

        // Reset and close modal
        fileInput.value = '';
        captionInput.value = '';
        bootstrap.Modal.getInstance(document.getElementById('uploadPhotoModal')).hide();
    };
    reader.readAsDataURL(file);

}
//Upload photos

// University Photos Management

// Partnership Add Section Start
let editingCard = null;
let editingCardId = null; // New: to track the partnership id

// Partnership image preview logic
const partnerImageInput = document.getElementById('image');
const partnerImagePreview = document.createElement('img');
partnerImagePreview.id = 'partnerImagePreview';
partnerImagePreview.className = 'img-fluid mb-2';
partnerImagePreview.style.maxHeight = '150px';
partnerImagePreview.style.display = 'none';

// Insert the preview image after the file input label
const fileUploadWrapper = partnerImageInput?.closest('.file-upload-wrapper');
if (fileUploadWrapper && !document.getElementById('partnerImagePreview')) {
    fileUploadWrapper.parentNode.insertBefore(partnerImagePreview, fileUploadWrapper.nextSibling);
}

// Show preview when a new file is selected
if (partnerImageInput) {
    partnerImageInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                partnerImagePreview.src = e.target.result;
                partnerImagePreview.style.display = 'block';
            };
            reader.readAsDataURL(this.files[0]);
        } else {
            partnerImagePreview.src = '';
            partnerImagePreview.style.display = 'none';
        }
    });
}

function openAddModal() {
    document.getElementById('partnershipForm').reset();
    editingCard = null;
    editingCardId = null;
    sessionStorage.setItem('partnershipMode', 'add'); // Track mode
    document.getElementById('partnershipModalLabel').textContent = 'Add Partnership';
    partnerImagePreview.src = '';
    partnerImagePreview.style.display = 'none';
    new bootstrap.Modal(document.getElementById('partnershipModal')).show();
}

function editPartnership(button) {
    editingCard = button.closest('.col-md-4');
    editingCardId = editingCard.getAttribute('data-partner-id');
    sessionStorage.setItem('partnershipMode', 'edit'); // Track mode

    const name = editingCard.querySelector('.card-title').textContent;
    const desc = editingCard.querySelectorAll('.card-text')[0].textContent.replace("Description: ", "");
    const type = editingCard.querySelectorAll('.card-text')[1].textContent.replace("Type: ", "");
    const imgElem = editingCard.querySelector('img.card-img-top');
    const imgSrc = imgElem ? imgElem.src : '';

    // Store the old name for backend reference
    sessionStorage.setItem('oldPartnershipName', name);

    document.getElementById('partnerName').value = name;
    document.getElementById('description').value = desc;
    document.getElementById('type').value = type;

    document.getElementById('partnershipModalLabel').textContent = 'Edit Partnership';

    if (imgSrc) {
        partnerImagePreview.src = imgSrc;
        partnerImagePreview.style.display = 'block';
    } else {
        partnerImagePreview.src = '';
        partnerImagePreview.style.display = 'none';
    }

    if (partnerImageInput) partnerImageInput.value = '';

    new bootstrap.Modal(document.getElementById('partnershipModal')).show();
}

async function deletePartnership(button) {
    const card = button.closest('.col-md-4');
    const partnerId = card.getAttribute('data-partner-id');
    const partnerName = card.querySelector('.card-title').textContent;

    if (await confirm("Are you sure you want to delete this partnership?")) {
        const formData = new FormData();
        formData.append('name', partnerId || partnerName);

        sendAjaxRequest('/executives/partnerships/delete/', formData, async function (data) {
            if (data.success) {
                card.remove();
            } else {
                await alert(data.error || "Failed to delete partnership.");
            }
        });
    }
}

document.getElementById('partnershipForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('partnerName').value;
    const description = document.getElementById('description').value;
    const type = document.getElementById('type').value;
    const imageInput = document.getElementById('image');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('type', type);
    if (imageInput.files.length > 0) {
        formData.append('image', imageInput.files[0]);
    }
    if (editingCardId && editingCard) {
        formData.append('id', editingCardId);
    }

    // Use sessionStorage to determine mode
    const mode = sessionStorage.getItem('partnershipMode');
    if (mode === 'edit') {
        const oldName = sessionStorage.getItem('oldPartnershipName');
        if (oldName) {
            formData.append('old_name', oldName);
        }
    }
    const url = (mode === 'edit')
        ? '/executives/partnerships/edit/'
        : '/executives/partnerships/add/';


    sendAjaxRequest(url, formData, async function (data) {
        if (data.success) {
            await alert(mode === 'edit'? 'Partnership editing successful': 'New Partnership Addition Successful');
            window.location.reload();
        } else {
            await alert(`${url} Failed`);
            console.error(data.error);
        }
    });
});

// ===== Certificate Section Start =====
let editingCertCard = null;
let editingCertId = null;
const certFileInput = document.getElementById('certificateFile');
const certFilePreview = document.createElement('div');
certFilePreview.id = 'certificateFilePreview';
certFilePreview.className = 'mb-2';

// Insert preview after file input
if (certFileInput && !document.getElementById('certificateFilePreview')) {
    certFileInput.parentNode.insertBefore(certFilePreview, certFileInput.nextSibling);
}

// Show preview for certificate file input
if (certFileInput) {
    certFileInput.addEventListener('change', function () {
        certFilePreview.innerHTML = '';
        if (this.files && this.files[0]) {
            const file = this.files[0];
            const reader = new FileReader();
            reader.onload = function (e) {
                if (file.type === 'application/pdf') {
                    certFilePreview.innerHTML = `<iframe src="${e.target.result}" class="w-100" style="height: 150px;"></iframe>`;
                } else {
                    certFilePreview.innerHTML = `<img src="${e.target.result}" class="img-fluid" style="max-height: 150px;">`;
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

function openAddCertModal() {
    document.getElementById('editForm').reset();
    editingCertCard = null;
    editingCertId = null;
    sessionStorage.setItem('certificateMode', 'add');
    certFilePreview.innerHTML = '';
    document.getElementById('certificateModalLabel').textContent = 'Add Certificate';
    new bootstrap.Modal(document.getElementById('certificateModal')).show();
}

function editCertificate(button) {
    editingCertCard = button.closest('.certificate-card');
    editingCertId = editingCertCard.getAttribute('data-cert-id');
    sessionStorage.setItem('certificateMode', 'edit');
    sessionStorage.setItem('oldCertificateId', editingCertId);

    const title = editingCertCard.querySelector('.certificate-title').textContent;
    const desc = editingCertCard.querySelector('.certificate-desc').textContent;
    const doc = editingCertCard.querySelector('iframe') || editingCertCard.querySelector('img');
    const docSrc = doc ? doc.getAttribute('src') : '';

    document.getElementById('certificateTitle').value = title;
    document.getElementById('certificateDesc').value = desc;
    document.getElementById('editIndex').value = ''; // not used for backend

    // Show preview
    certFilePreview.innerHTML = '';
    if (docSrc) {
        if (doc.tagName.toLowerCase() === 'iframe') {
            certFilePreview.innerHTML = `<iframe src="${docSrc}" class="w-100" style="height: 150px;"></iframe>`;
        } else {
            certFilePreview.innerHTML = `<img src="${docSrc}" class="img-fluid" style="max-height: 150px;">`;
        }
    }
    if (certFileInput) certFileInput.value = '';

    document.getElementById('certificateModalLabel').textContent = 'Edit Certificate';
    new bootstrap.Modal(document.getElementById('certificateModal')).show();
}

async function deleteCertificate(button) {
    const card = button.closest('.certificate-card');
    const certId = card.getAttribute('data-cert-id');
    if (await confirm("Are you sure you want to delete this certificate?")) {
        const formData = new FormData();
        formData.append('id', certId);
        sendAjaxRequest('/executives/certificates/delete/', formData, async function (data) {
            if (data.success) {
                card.remove();
            } else {
                await alert(data.error || "Failed to delete certificate.");
            }
        });
    }
}

document.getElementById('editForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const title = document.getElementById('certificateTitle').value;
    const desc = document.getElementById('certificateDesc').value;
    const fileInput = document.getElementById('certificateFile');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', desc);
    if (fileInput.files.length > 0) {
        formData.append('file', fileInput.files[0]);
    }
    if (editingCertId && editingCertCard) {
        formData.append('id', editingCertId);
    }

    const mode = sessionStorage.getItem('certificateMode');
    if (mode === 'edit') {
        const oldId = sessionStorage.getItem('oldCertificateId');
        if (oldId) {
            formData.append('old_id', oldId);
        }
    }
    const url = (mode === 'edit')
        ? '/executives/certificates/edit/'
        : '/executives/certificates/add/';

    sendAjaxRequest(url, formData, async function (data) {
        if (data.success) {
            await alert(mode === 'edit'? "Certificate editing successful": "New Certificate Addition Successful");
            window.location.reload();
        } else {
            await alert(`${url} Failed`);
            console.error(data.error);
        }
    });
});
// ===== Certificate Section End =====

// ===== University Photos Section Start =====
let editingPhotoCard = null;
let editingPhotoId = null;
const photoImageInput = document.getElementById('newPhoto');
const photoImagePreview = document.createElement('img');
photoImagePreview.id = 'photoImagePreview';
photoImagePreview.className = 'img-fluid mb-2';
photoImagePreview.style.maxHeight = '150px';
photoImagePreview.style.display = 'none';

// Insert preview after file input
if (photoImageInput && !document.getElementById('photoImagePreview')) {
    photoImageInput.parentNode.insertBefore(photoImagePreview, photoImageInput.nextSibling);
}

// Show preview for photo input
if (photoImageInput) {
    photoImageInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                photoImagePreview.src = e.target.result;
                photoImagePreview.style.display = 'block';
            };
            reader.readAsDataURL(this.files[0]);
        } else {
            photoImagePreview.src = '';
            photoImagePreview.style.display = 'none';
        }
    });
}

// Use event delegation for edit/delete buttons on photo cards
document.addEventListener('DOMContentLoaded', function () {
    const photoGrid = document.getElementById('photoGrid');
    if (photoGrid) {
        photoGrid.addEventListener('click', function (event) {
            const editBtn = event.target.closest('.edit-btn');
            const deleteBtn = event.target.closest('.delete-btn');
            if (editBtn) {
                event.preventDefault();
                editPhoto(editBtn);
            }
            if (deleteBtn) {
                event.preventDefault();
                deletePhoto(deleteBtn);
            }
        });
    }
});

function openAddPhotoModal() {
    document.getElementById('uploadPhotoForm').reset();
    editingPhotoCard = null;
    editingPhotoId = null;
    sessionStorage.setItem('photoMode', 'add');
    photoImagePreview.src = '';
    photoImagePreview.style.display = 'none';
    new bootstrap.Modal(document.getElementById('uploadPhotoModal')).show();
}

async function editPhoto(button) {
    editingPhotoCard = button.closest('.card');
    // Fix: getAttribute('data-photo-id') may be missing if not set on card
    // Always set data-photo-id on the card when rendering from backend!
    editingPhotoId = editingPhotoCard.getAttribute('data-photo-id');
    if (!editingPhotoId) {
        // Try to fallback: look for a unique identifier, or alert
        await alert("Photo ID not found. Please ensure data-photo-id is set on each card.");
        return;
    }
    sessionStorage.setItem('photoMode', 'edit');
    sessionStorage.setItem('oldPhotoId', editingPhotoId);

    const caption = editingPhotoCard.querySelector('.uni-caption').textContent;
    const imgElem = editingPhotoCard.querySelector('img.card-img-top');
    const imgSrc = imgElem ? imgElem.src : '';

    document.getElementById('newCaption').value = caption;

    if (imgSrc) {
        photoImagePreview.src = imgSrc;
        photoImagePreview.style.display = 'block';
    } else {
        photoImagePreview.src = '';
        photoImagePreview.style.display = 'none';
    }
    if (photoImageInput) photoImageInput.value = '';

    new bootstrap.Modal(document.getElementById('uploadPhotoModal')).show();
}

async function deletePhoto(button) {
    const card = button.closest('.card');
    const photoId = card.getAttribute('data-photo-id');
    if (!photoId) {
        await alert("Photo ID not found.");
        return;
    }
    if (await confirm("Are you sure you want to delete this photo?")) {
        const formData = new FormData();
        formData.append('id', photoId);
        sendAjaxRequest('/executives/photos/delete/', formData, async function (data) {
            if (data.success) {
                await alert('photo deletion successful');
                window.location.reload();
            } else {
                await alert(data.error || "Failed to delete photo.");
            }
        });
    }
}

document.getElementById('uploadPhotoForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const captionInput = document.getElementById('newCaption');
    const fileInput = document.getElementById('newPhoto');

    const formData = new FormData();
    formData.append('caption', captionInput.value);
    if (fileInput.files.length > 0) {
        formData.append('image', fileInput.files[0]);
    }
    // Fix: Always send old_id if editing, even if editingPhotoId is not set
    const mode = sessionStorage.getItem('photoMode');
    if (mode === 'edit') {
        const oldId = sessionStorage.getItem('oldPhotoId');
        if (oldId) {
            formData.append('old_id', oldId);
        } else if (editingPhotoId) {
            formData.append('old_id', editingPhotoId);
        }
    }
    const url = (mode === 'edit')
        ? '/executives/photos/edit/'
        : '/executives/photos/add/';

    sendAjaxRequest(url, formData, async function (data) {
        if (data.success) {
            await alert('Photo Editing Successful');
            window.location.reload();
        } else {
            await alert(data.error || "Failed to save photo.");
        }
    });
});
// ===== University Photos Section End =====

//input file upload design
function showSelectedFile(inputId, labelId) {
    const input = document.getElementById(inputId);
    const label = document.getElementById(labelId);

    if (input && label) {
        input.addEventListener('change', function () {
            label.textContent = this.files.length > 0 ? this.files[0].name : "No file selected";
        });
    }
}

showSelectedFile('inputLogo', 'fileNameLogo');
showSelectedFile('certificateFile', 'fileNameCertificate');
showSelectedFile('newPhoto', 'fileNamePhoto');
showSelectedFile('labImage', 'fileNameLab');
showSelectedFile('image', 'fileNamePartner');

// Remove any other submit/click handler for the form or the Save Changes button above this block!

// Defensive: Remove any previous submit handler before adding a new one
const uniInfoEditForm = document.getElementById('uni-info-edit');
if (uniInfoEditForm) {
    // Remove any existing submit event listeners by cloning and replacing the node
    const clone = uniInfoEditForm.cloneNode(true);
    uniInfoEditForm.parentNode.replaceChild(clone, uniInfoEditForm);

    clone.addEventListener('submit', async function(event) {
        event.preventDefault();
        // Confirm before saving changes
        if (!await confirm("Are you sure you want to save changes to university information?")) {
            return;
        }
        console.log("going to submit the edited details");

        const url = '/executives/uni_info_edit/';
        const formData = new FormData(clone);
        fetch(url, {
            method: 'POST',
            headers: {
                'X-CSRFToken': window.csrf
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Hide modal after successful save
                const modalEl = document.getElementById('editModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
                // Optionally show a success alert
                const successDiv = document.getElementById('uni-info-success');
                if (successDiv) {
                    successDiv.classList.remove('d-none');
                    setTimeout(() => successDiv.classList.add('d-none'), 1500);
                }
                window.location.reload();
            }
        });
    });
}

// University Info Description Truncate/Expand
function truncateText(text, wordLimit) {
    const words = text.trim().split(/\s+/);
    if (words.length <= wordLimit) return { truncated: text, isTruncated: false };
    return {
        truncated: words.slice(0, wordLimit).join(' ') + ' ...',
        isTruncated: true
    };
}

function setupDescriptionTruncate() {
    const descElem = document.getElementById('uniDescription');
    if (!descElem) return;
    const fullText = descElem.textContent.trim();
    const wordLimit = 200;
    const { truncated, isTruncated } = truncateText(fullText, wordLimit);

    if (!isTruncated) return; // No need to truncate

    function showTruncated() {
        descElem.innerHTML = `${truncated} <a href="#" id="descShowMore" style="color:#007bff;cursor:pointer;">Show more</a>`;
        document.getElementById('descShowMore').onclick = function(e) {
            e.preventDefault();
            showFull();
        };
    }

    function showFull() {
        descElem.innerHTML = `${fullText} <a href="#" id="descShowLess" style="color:#007bff;cursor:pointer;">Show less</a>`;
        document.getElementById('descShowLess').onclick = function(e) {
            e.preventDefault();
            showTruncated();
        };
    }

    showTruncated();
}

document.addEventListener('DOMContentLoaded', function () {
    // ...existing code...
    setupDescriptionTruncate();
    // ...existing code...
});

const labAddForm = document.getElementById('uploadLabForm');
labAddForm.addEventListener('submit', async (e)=> {
    e.stopPropagation();
    e.preventDefault();
    if (!await confirm('Are you sure to create this lab?')) return;
    labAddForm.submit();
});

// Expandable text sections for description, mission, vision
document.addEventListener('DOMContentLoaded', function () {
    function setupExpandableText(id, limit) {
        const textElem = document.getElementById(id);
        const link = document.querySelector(`a.read-more-link[data-target="${id}"]`);
        if (!textElem || !link) return;
        const fullText = textElem.textContent.trim();
        if (fullText.length <= limit) {
            link.style.display = 'none';
            return;
        }
        let expanded = false;
        function update() {
            if (expanded) {
                textElem.textContent = fullText;
                link.textContent = 'Read less';
            } else {
                textElem.textContent = fullText.slice(0, limit) + '...';
                link.textContent = 'Read more';
            }
        }
        link.addEventListener('click', function(e) {
            e.preventDefault();
            expanded = !expanded;
            update();
        });
        update();
    }
    setupExpandableText('desc-text', 180);
    setupExpandableText('mission-text', 180);
    setupExpandableText('vision-text', 180);
});