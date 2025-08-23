const fullLabDesc = document.getElementById('labDescText')
    ? document.getElementById('labDescText').getAttribute('data-full') || document.getElementById('labDescText').textContent.trim()
    : '';

function getFirstNWords(text, n) {
    return text.split(' ').slice(0, n).join(' ') + '...';
}

function setLabDesc(truncated) {
    const descText = document.getElementById('labDescText');
    const descToggle = document.getElementById('labDescToggle');
    if (truncated) {
        descText.textContent = getFirstNWords(fullLabDesc, 20);
        descToggle.innerHTML = '&#x25BC;';
    } else {
        descText.textContent = fullLabDesc;
        descToggle.innerHTML = '&#x25B2;';
    }
    descToggle.setAttribute('data-truncated', truncated ? '1' : '0');
}

function setupLabDescToggle() {
    const descToggle = document.getElementById('labDescToggle');
    descToggle.onclick = function () {
        const truncated = descToggle.getAttribute('data-truncated') === '1';
        setLabDesc(!truncated);
    };
    setLabDesc(true);
}

// Ensure setup runs after DOM is loaded and after toggling to Lab Details
document.addEventListener('DOMContentLoaded', function () {
    setupLabDescToggle();
});

// Utility to create and show the popup for editing
function showEditPopup(label, value, onSave, opts = {}) {
    // Remove any existing popup
    // await alert(`${label} ${value}`);
    const existing = document.getElementById('edit-popup-backdrop');
    if (existing) existing.remove();

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'edit-popup-backdrop';
    backdrop.className = 'edit-popup-backdrop';

    // Create popup
    const popup = document.createElement('div');
    popup.className = 'edit-popup';

    // Title
    const title = document.createElement('div');
    title.className = 'edit-popup-title';
    title.textContent = `Edit ${label}`;
    popup.appendChild(title);

    // Input, textarea, or file
    let input;
    if (opts.file) {
        input = document.createElement('input');
        input.type = 'file';
        input.className = 'edit-popup-input';
        input.accept = opts.accept || '';
        popup.appendChild(input);
    } else if (opts.textarea) {
        input = document.createElement('textarea');
        input.className = 'edit-popup-textarea';
        input.value = value;
        input.rows = opts.rows || 8;
        input.style.resize = 'vertical';
        popup.appendChild(input);
    } else {
        input = document.createElement('input');
        input.className = 'edit-popup-input';
        input.type = 'text';
        input.value = value;
        popup.appendChild(input);
    }

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'edit-popup-save';
    saveBtn.textContent = 'Save Changes';
    saveBtn.style.display = opts.file ? 'inline-block' : 'none';
    popup.appendChild(saveBtn);

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'edit-popup-cancel';
    cancelBtn.textContent = 'Cancel';
    popup.appendChild(cancelBtn);

    // Show save button only if value changed (for text/textarea)
    if (!opts.file) {
        input.addEventListener('input', function () {
            saveBtn.style.display = input.value !== value ? 'inline-block' : 'none';
        });
    }

    // Save handler
    saveBtn.onclick = async function () {
        if (opts.file) {
            if (!input.files || !input.files[0]) return;
            if (await confirm('Are you sure you want to upload this file?')) {
                onSave(input.files[0]);
                document.body.removeChild(backdrop);
                location.reload();
            }
        } else {
            if (await confirm('Are you sure you want to save changes?')) {
                onSave(input.value);
                document.body.removeChild(backdrop);
                location.reload();
            }
        }
    };

    // Cancel handler
    cancelBtn.onclick = function () {
        document.body.removeChild(backdrop);
    };

    // Close popup on backdrop click
    backdrop.onclick = function (e) {
        if (e.target === backdrop) {
            document.body.removeChild(backdrop);
        }
    };

    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);
    input.focus();
}

// Fallback parsing for JSON data
function _fromJSON(id, fallback) {
    try { 
        const el = document.getElementById(id); 
        if (!el) {
            console.warn(`Element with id '${id}' not found`);
            return fallback;
        }
        
        console.log(`Element found for ${id}:`, el);
        console.log(`Element tagName: ${el.tagName}`);
        console.log(`Element className: ${el.className}`);
        console.log(`Element id: ${el.id}`);
        
        // Get the text content and parse it as JSON
        const textContent = el.textContent || el.innerText;
        console.log(`Raw content for ${id}:`, textContent);
        console.log(`Content length: ${textContent ? textContent.length : 0}`);
        console.log(`Content trimmed: ${textContent ? textContent.trim() : 'N/A'}`);
        
        if (!textContent || textContent.trim() === '') {
            console.warn(`Element '${id}' has no text content`);
            return fallback;
        }
        
        const parsed = JSON.parse(textContent);
        console.log(`Successfully parsed ${id}:`, parsed);
        return parsed;
    } catch (e) { 
        console.warn(`Failed to parse JSON from ${id}:`, e);
        console.warn(`Element content was:`, el ? (el.textContent || el.innerText) : 'Element not found');
        return fallback; 
    }
}

// Call setupEditIcons after DOMContentLoaded and after toggling to Lab Details
document.addEventListener('DOMContentLoaded', function () {
    // Debug: Check what's in the script elements
    console.log('Script elements found:', {
        allProjectLeaders: document.getElementById('allProjectLeaders'),
        allProjectMembers: document.getElementById('allProjectMembers'),
        allLabHeads: document.getElementById('allLabHeads'),
        departments: document.getElementById('departments'),
        currentLabDept: document.getElementById('currentLabDept')
    });
    
    // Initialize global variables using _fromJSON for all variables
    window.allProjectLeaders = _fromJSON('allProjectLeaders', []);
    window.allProjectMembers = _fromJSON('allProjectMembers', []);
    window.allLabHeads = _fromJSON('allLabHeads', []);
    window.departments = _fromJSON('departments', []);
    window.currentLabDept = _fromJSON('currentLabDept', {});

    // Debug logging
    console.log('Data initialization complete:', {
        allProjectLeaders: window.allProjectLeaders,
        allProjectMembers: window.allProjectMembers,
        allLabHeads: window.allLabHeads,
        departments: window.departments,
        currentLabDept: window.currentLabDept
    });

    // Set lab department ID for filtering
    window.lab_department_id = window.currentLabDept.id || null;
    
    setupLabDescToggle();
    setupEditIcons();
});

// Attach edit icon click handlers for each editable-group
function setupEditIcons() {
    // Lab Name (main title)
    document.querySelectorAll('h1.editable-group .edit-icon').forEach(icon => {
        icon.onclick = function (e) {
            e.stopPropagation();
            showEditPopup('Lab Name', document.querySelector('h1.editable-group').childNodes[0].textContent.trim(), function (val) {
                ajaxLabAPI(
                    `/executives/api/labs/edit/${encodeURIComponent(window.currentLabKey)}/`,
                    'POST',
                    { lab_name: val },
                    (response) => { location.reload(); },
                    async (error) => { await alert('Failed to update lab name'); }
                );
            });
        };
    });

    // Lab Location
    document.querySelectorAll('.lab-location .edit-icon').forEach(icon => {
        icon.onclick = function (e) {
            e.stopPropagation();
            showEditPopup('Location', document.querySelector('.lab-location').textContent.replace('📍', '').replace('✎', '').trim(), function (val) {
                ajaxLabAPI(
                    `/executives/api/labs/edit/${encodeURIComponent(window.currentLabKey)}/`,
                    'POST',
                    { location: val },
                    (response) => { location.reload(); },
                    async (error) => { await alert('Failed to update lab location'); }
                );
            });
        };
    });

    // Lab Department
    document.querySelectorAll('.lab-department-info .edit-icon').forEach(icon => {
        icon.onclick = function (e) {
            e.stopPropagation();
            showDepartmentSelectPopup(function (deptId, deptName) {
                ajaxLabAPI(
                    `/executives/api/labs/update_department/${encodeURIComponent(window.currentLabKey)}/`,
                    'POST',
                    { department_id: deptId, department_name: deptName },
                    async (response) => { 
                        if (response.success) {
                            location.reload();
                        } else {
                            await alert('Failed to update lab department');
                        }
                    },
                    async (error) => { await alert('Failed to update lab department'); }
                );
            });
        };
    });

    // Head of Lab Name
    document.querySelectorAll('.lab-head-name .edit-icon').forEach(icon => {
        icon.onclick = function (e) {
            e.stopPropagation();
            showEditPopup('Head Name', document.querySelector('.lab-head-name').childNodes[0].textContent.trim(), function (val) {
                ajaxLabAPI(
                    `/executives/api/labs/edit/${encodeURIComponent(window.currentLabKey)}/`,
                    'POST',
                    { head_of_lab: val },
                    (response) => { location.reload(); },
                    async (error) => { await alert('Failed to update head of lab'); }
                );
            });
        };
    });

    // Head of Lab Title (select from popup)
    document.querySelectorAll('.lab-head-title .edit-icon').forEach(icon => {
        icon.onclick = function (e) {
            e.stopPropagation();
            const currentName = document.querySelector('.lab-head-title').childNodes[0].textContent.trim();
            showHeadSelectPopup(currentName, function (profile) {
                ajaxLabAPI(
                    `/executives/api/labs/edit/${encodeURIComponent(window.currentLabKey)}/`,
                    'POST',
                    { head_of_lab: profile },
                    (response) => {location.reload(); },
                    async (error) => { await alert('Failed to update head of lab'); }
                );
            });
        };
    });

    // Head of Lab Dept
    document.querySelectorAll('.lab-head-dept .edit-icon').forEach(icon => {
        icon.onclick = function (e) {
            e.stopPropagation();
            showEditPopup('Department', document.querySelector('.lab-head-dept').childNodes[0].textContent.trim(), function (val) {
                ajaxLabAPI(
                    `/executives/api/labs/edit/${encodeURIComponent(window.currentLabKey)}/`,
                    'POST',
                    { department: val },
                    (response) => { location.reload(); },
                    async (error) => { await alert('Failed to update department'); }
                );
            });
        };
    });

    // Lab Description: use textarea in popup
    document.querySelectorAll('.lab-description .edit-icon').forEach(icon => {
        icon.onclick = function (e) {
            e.stopPropagation();
            showEditPopup(
                'Lab Description',
                document.getElementById('labDescText').getAttribute('description'),
                function (val) {
                    ajaxLabAPI(
                        `/executives/api/labs/edit/${encodeURIComponent(window.currentLabKey)}/`,
                        'POST',
                        { description: val },
                        (response) => { location.reload(); },
                        async (error) => { await alert('Failed to update lab description'); }
                    );
                },
                { textarea: true, rows: 20 }
            );
        };
    });

    // Lab Photos Title (not a real field, so skip API)

    // Lab Photo Images: add delete button instead of edit icon
    document.querySelectorAll('.lab-photo').forEach((img, idx) => {
        // Remove any existing edit icon for photos
        const editIcon = img.parentElement.querySelector('.edit-icon-photo');
        if (editIcon) editIcon.remove();

        // Add delete button if not already present
        if (!img.parentElement.querySelector('.delete-photo-btn') && window.lagjagale) {
            console.log(`lagjagale ${lagjagale}`);
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-photo-btn';
            delBtn.title = 'Delete Photo';
            delBtn.innerHTML = '<i class="fa fa-trash"></i>';
            delBtn.onclick = async function (e) {
                e.stopPropagation();
                if (await confirm('Are you sure you want to delete this photo?')) {
                    ajaxLabAPI(
                        `/executives/api/labs/delete_photo/${encodeURIComponent(window.currentLabKey)}/`,
                        'POST',
                        { photo_key: img.src },
                        (response) => { location.reload(); },
                        async (error) => { await alert('Failed to delete photo'); }
                    );
                }
            };
            img.parentElement.appendChild(delBtn);
        }
    });

    // Project Name
    document.querySelectorAll('.project-title.editable-group .edit-icon').forEach(icon => {
        icon.onclick = function (e) {
            e.stopPropagation();
            const titleElem = icon.parentElement;
            const projectId = titleElem.closest('.project-card').getAttribute('data-project-id');
            showEditPopup('Project Name', titleElem.childNodes[0].textContent.trim(), function (val) {
                updateProject(window.currentLabKey, projectId, { title: val }, null, () => location.reload());
            });
        };
    });

    // Project Tags
    document.querySelectorAll('.project-header .project-tags .project-tags-edit').forEach(editIcon => {
        editIcon.onclick = function (e) {
            e.stopPropagation();
            const tagsDiv = editIcon.parentElement;
            const tagSpans = Array.from(tagsDiv.querySelectorAll('.project-tag'));
            const tagsValue = tagSpans.map(t => t.textContent.trim()).join(', ');
            const projectId = tagsDiv.closest('.project-card').getAttribute('data-project-id');
            showEditPopup('Project Tags', tagsValue, async function (val) {
                if (await confirm('Are you sure you want to save these tags?')) {
                    const tagsObj = {};
                    val.split(',').forEach((tag, idx) => { tagsObj[`tag${idx+1}`] = tag.trim(); });
                    updateProject(window.currentLabKey, projectId, { tags: tagsObj }, null, () => location.reload());
                }
            });
        };
    });

    // Project Description
    document.querySelectorAll('.project-desc-block .project-desc-text').forEach(descElem => {
        const projectId = descElem.closest('.project-card').getAttribute('data-project-id');
        if (!descElem.parentElement.querySelector('.edit-icon')) {
            const editIcon = document.createElement('span');
            editIcon.className = 'edit-icon';
            editIcon.title = 'Edit';
            editIcon.innerHTML = '&#9998;';
            editIcon.onclick = function (e) {
                e.stopPropagation();
                showEditPopup(
                    'Project Description',
                    descElem.getAttribute('data-full') || descElem.textContent,
                    function (val) {
                        updateProject(window.currentLabKey, projectId, { description: val }, null, () => location.reload());
                    },
                    { textarea: true, rows: 10 }
                );
            };
            descElem.parentElement.appendChild(editIcon);
        }
        descElem.style.cursor = 'pointer';
    });

    // Project Demo Link
    document.querySelectorAll('.project-links-block .editable-group').forEach(group => {
        const link = group.querySelector('a.project-link');
        const editIcon = group.querySelector('.edit-icon');
        const projectId = group.closest('.project-card') ? group.closest('.project-card').getAttribute('data-project-id') : null;
        if (link && editIcon && projectId) {
            editIcon.onclick = function (e) {
                e.stopPropagation();
                showEditPopup('Live Demo Link', link.href, function (val) {
                    updateProject(window.currentLabKey, projectId, { project_demo: val }, null, () => location.reload());
                });
            };
        }
    });

    // Project GitHub Link
    document.querySelectorAll('.project-links-block .editable-group').forEach(group => {
        const link = group.querySelector('a.project-link');
        const editIcon = group.querySelector('.edit-icon');
        const projectId = group.closest('.project-card') ? group.closest('.project-card').getAttribute('data-project-id') : null;
        if (link && editIcon && projectId) {
            editIcon.onclick = function (e) {
                e.stopPropagation();
                showEditPopup('GitHub Link', link.href, function (val) {
                    updateProject(window.currentLabKey, projectId, { project_link: val }, null, () => location.reload());
                });
            };
        }
    });

    // Project Attachment (file)
    document.querySelectorAll('.project-links-block .editable-group').forEach(group => {
        const link = group.querySelector('a.project-link.project-attachment-link');
        const editIcon = group.querySelector('.edit-icon');
        const projectId = group.closest('.project-card') ? group.closest('.project-card').getAttribute('data-project-id') : null;
        if (link && editIcon && projectId) {
            editIcon.onclick = function (e) {
                e.stopPropagation();
                showEditPopup('Project Attachment', '', function (file) {
                    updateProject(window.currentLabKey, projectId, {}, { attachment: file }, () => location.reload());
                }, { file: true, accept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" });
            };
        }
        if (link) {
            link.addEventListener("click", async function (e) {
                e.preventDefault();
                const fileUrl = link.getAttribute("href");
        
                const response = await fetch(fileUrl);
                const blob = await response.blob();
        
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileUrl.split("/").pop(); // file name from URL
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            });
        }        
    });

    // Project Photo
    document.querySelectorAll('.project-photo-block .project-photo').forEach(img => {
        img.onclick = function (e) {
            e.stopPropagation();
            if (window.editor) {
                const projectId = img.closest('.project-card').getAttribute('data-project-id');
                showProjectPhotoEditPopup(img.src, function (file) {
                    updateProject(window.currentLabKey, projectId, {}, { project_photo: file }, () => location.reload());
                });
            }
        };
        img.style.cursor = 'pointer';
        img.title = 'Edit Photo';
    });

    // Project Leader
    document.querySelectorAll('.project-leader-block .edit-icon').forEach(editIcon => {
        editIcon.onclick = function (e) {
            e.stopPropagation();
            const leaderSpan = editIcon.parentElement.querySelector('.project-leader-name');
            const currentName = leaderSpan ? leaderSpan.textContent.replace('(Leader)', '').trim() : '';
            const projectId = editIcon.closest('.project-card').getAttribute('data-project-id');
            
            // Check if current name is "Add Project Leader" and set to empty if so
            const leaderName = currentName === 'Add Project Leader' ? '' : currentName;
            
            showProjectLeaderSelectPopup(leaderName, async function (selectedLeader) {
                // selectedLeader is now the full profile object
                if (selectedLeader) {
                    updateProject(window.currentLabKey, projectId, { 
                        leader: {
                            id: selectedLeader.id,
                            name: selectedLeader.name,
                            img: selectedLeader.img
                        }
                    }, null, () => location.reload());
                } else {
                    await alert('No leader selected');
                }
            });
        };
    });

    // Project Members (add/remove)
    document.querySelectorAll('.project-member .fa-trash, .project-member .fa.fa-trash').forEach(delIcon => {
        delIcon.onclick = function (e) {
            e.stopPropagation();
            const memberElem = delIcon.closest('.project-member');
            const name = memberElem.querySelector('.project-member-name').textContent.trim();
            const projectId = memberElem.closest('.project-card').getAttribute('data-project-id');
            updateProject(window.currentLabKey, projectId, { remove_member: name }, null, () => location.reload());
        };
    });

    document.querySelectorAll('.project-members-list .fa-plus, .project-members-list .fa.fa-plus').forEach(plusIcon => {
        plusIcon.onclick = function (e) {
            e.stopPropagation();
            const membersList = plusIcon.closest('.project-members-list');
            const projectId = membersList.closest('.project-card').getAttribute('data-project-id');
            
            // Get current members from the DOM and convert to the format expected by the popup
            const currentMembers = [];
            const memberElements = membersList.querySelectorAll('.project-member');
            memberElements.forEach(memberElem => {
                const nameElem = memberElem.querySelector('.project-member-name');
                if (nameElem) {
                    currentMembers.push({
                        name: nameElem.textContent.trim()
                    });
                }
            });
            
            showProjectMembersSelectPopup(currentMembers, async function (selectedMembers) {
                // selectedMembers is now an array of full profile objects
                if (selectedMembers && selectedMembers.length > 0) {
                    const membersData = selectedMembers.map(member => ({
                        id: member.id,
                        name: member.name,
                        img: member.img
                    }));
                    updateProject(window.currentLabKey, projectId, { 
                        members: membersData
                    }, null, () => location.reload());
                } else {
                    await alert('No members selected');
                }
            });
        };
    });
}

// Project description show more/less logic
function setupProjectDescToggles() {
    document.querySelectorAll('.project-desc-toggle').forEach(toggle => {
        const target = toggle.getAttribute('data-target');
        const descSpan = document.getElementById('projectDescText' + target);
        if (!descSpan) return;
        const fullText = descSpan.getAttribute('data-full') || descSpan.textContent.trim();
        function setDesc(truncated) {
            if (truncated) {
                descSpan.textContent = fullText.split(' ').slice(0, 25).join(' ') + '...';
                toggle.innerHTML = '&#x25BC;';
            } else {
                descSpan.textContent = fullText;
                toggle.innerHTML = '&#x25B2;';
            }
            toggle.setAttribute('data-truncated', truncated ? '1' : '0');
        }
        toggle.onclick = function () {
            const truncated = toggle.getAttribute('data-truncated') === '1';
            setDesc(!truncated);
        };
        setDesc(true);
    });
}

// Call setupProjectDescToggles after DOMContentLoaded and after toggling to Lab Details
document.addEventListener('DOMContentLoaded', function () {
    setupLabDescToggle();
    setupEditIcons();
    setupProjectDescToggles();
});

function showSection(section) {
    const labBtn = document.getElementById('labBtn');
    const projectsBtn = document.getElementById('projectsBtn');
    const labSection = document.getElementById('labSection');
    const projectsSection = document.getElementById('projectsSection');
    if (section === 'lab') {
        labBtn.classList.add('active');
        projectsBtn.classList.remove('active');
        labSection.style.display = '';
        projectsSection.style.display = 'none';
        setupLabDescToggle();
        setupEditIcons();
    } else {
        labBtn.classList.remove('active');
        projectsBtn.classList.add('active');
        labSection.style.display = 'none';
        projectsSection.style.display = '';
        setupProjectDescToggles();
    }
}

// Example profiles data (replace with real data from server)
let labProfiles = window.allLabHeads || [];

// Show popup for selecting head of lab
function showHeadSelectPopup(currentName, onSave) {
    // Remove any existing popup
    const existing = document.getElementById('edit-popup-backdrop');
    if (existing) existing.remove();

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'edit-popup-backdrop';
    backdrop.className = 'edit-popup-backdrop';

    // Popup
    const popup = document.createElement('div');
    popup.className = 'edit-popup';

    // Title
    const title = document.createElement('div');
    title.className = 'edit-popup-title';
    title.textContent = 'Select Head of Lab';
    popup.appendChild(title);

    // Search box
    const search = document.createElement('input');
    search.type = 'text';
    search.className = 'edit-popup-input';
    search.placeholder = 'Search by name...';
    popup.appendChild(search);

    // Profiles list
    const list = document.createElement('div');
    list.className = 'profile-select-list';
    popup.appendChild(list);

    // Render profiles
    function renderProfiles(filter) {
        list.innerHTML = '';
        const currentDeptId = window.lab_department_id;
        
        // Ensure labProfiles is an array and has the filter method
        labProfiles = labProfiles.textContent? JSON.parse(labProfiles.textContent): labProfiles;
        if (!Array.isArray(labProfiles) || typeof labProfiles.filter !== 'function') {
            console.log(labProfiles);
            console.error('labProfiles is not a valid array:', labProfiles);
            const nores = document.createElement('div');
            nores.className = 'profile-select-nores';
            nores.textContent = 'No profiles available.';
            list.appendChild(nores);
            return;
        }
        
        labProfiles
            .filter(p => {
                // First apply text filter
                if (filter && !p.name.toLowerCase().includes(filter.toLowerCase())) {
                    return false;
                }
                
                // Then apply department filter - only show users from same department or no department
                if (currentDeptId) {
                    // Check if user has a department and if it matches the lab department
                    if (p.department_id && p.department_id !== currentDeptId) {
                        return false;
                    }
                }
                
                return true;
            })
            .forEach(profile => {
                const item = document.createElement('div');
                item.className = 'profile-select-item';
                if (profile.name === currentName) item.classList.add('selected');
                item.innerHTML = `
                    <img src="${profile.img}" alt="${profile.name}" class="profile-select-img">
                    <span class="profile-select-name">${profile.name}</span>
                `;
                item.onclick = async function () {
                    if (await confirm(`Set "${profile.name}" as Head of Lab?`)) {
                        onSave(profile);
                        document.body.removeChild(backdrop);
                        location.reload();
                    }
                };
                list.appendChild(item);
            });
        if (!list.childNodes.length) {
            const nores = document.createElement('div');
            nores.className = 'profile-select-nores';
            nores.textContent = 'No profiles found.';
            list.appendChild(nores);
        }
    }
    renderProfiles('');

    // Search handler
    search.oninput = function () {
        renderProfiles(search.value);
    };

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'edit-popup-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = function () {
        document.body.removeChild(backdrop);
    };
    popup.appendChild(cancelBtn);

    // Backdrop click closes popup
    backdrop.onclick = function (e) {
        if (e.target === backdrop) {
            document.body.removeChild(backdrop);
        }
    };

    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);
    search.focus();
}

// Show popup for selecting lab department
function showDepartmentSelectPopup(onSave) {
    // Remove any existing popup
    const existing = document.getElementById('edit-popup-backdrop');
    if (existing) existing.remove();

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'edit-popup-backdrop';
    backdrop.className = 'edit-popup-backdrop';

    // Popup
    const popup = document.createElement('div');
    popup.className = 'edit-popup';

    // Title
    const title = document.createElement('div');
    title.className = 'edit-popup-title';
    title.textContent = 'Select Lab Department';
    popup.appendChild(title);

    // Search box
    const search = document.createElement('input');
    search.type = 'text';
    search.className = 'edit-popup-input';
    search.placeholder = 'Search departments...';
    popup.appendChild(search);

    // Departments list
    const list = document.createElement('div');
    list.className = 'profile-select-list';
    popup.appendChild(list);

    // Render departments
    function renderDepartments(filter) {
        list.innerHTML = '';
        const currentDeptId = window.currentLabDept.id;
        
        // Ensure departments is an array and has the filter method
        if (!Array.isArray(window.departments) || typeof window.departments.filter !== 'function') {
            console.error('departments is not a valid array:', window.departments);
            const nores = document.createElement('div');
            nores.className = 'profile-select-nores';
            nores.textContent = 'No departments available.';
            list.appendChild(nores);
            return;
        }
        
        window.departments
            .filter(dept => !filter || dept.name.toLowerCase().includes(filter.toLowerCase()))
            .forEach(dept => {
                const item = document.createElement('div');
                item.className = 'profile-select-item';
                if (dept.id === currentDeptId) item.classList.add('selected');
                item.innerHTML = `
                    <span class="profile-select-name">${dept.name}</span>
                `;
                item.onclick = async function () {
                    if (await confirm(`Set "${dept.name}" as Lab Department?`)) {
                        onSave(dept.id, dept.name);
                        document.body.removeChild(backdrop);
                    }
                };
                list.appendChild(item);
            });
        if (!list.childNodes.length) {
            const nores = document.createElement('div');
            nores.className = 'profile-select-nores';
            nores.textContent = 'No departments found.';
            list.appendChild(nores);
        }
    }
    renderDepartments('');

    // Search handler
    search.oninput = function () {
        renderDepartments(search.value);
    };

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'edit-popup-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = function () {
        document.body.removeChild(backdrop);
    };
    popup.appendChild(cancelBtn);

    // Backdrop click closes popup
    backdrop.onclick = function (e) {
        if (e.target === backdrop) {
            document.body.removeChild(backdrop);
        }
    };

    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);
    search.focus();
}

// Example project members data (replace with real data from server)
let allProjectMembers = JSON.parse(window.allProjectMembers.textContent) || []

// Show popup for selecting project members (multi-select)
function showProjectMembersSelectPopup(currentMembers, onSave) {
    // Remove any existing popup
    const existing = document.getElementById('edit-popup-backdrop');
    if (existing) existing.remove();

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'edit-popup-backdrop';
    backdrop.className = 'edit-popup-backdrop';

    // Popup
    const popup = document.createElement('div');
    popup.className = 'edit-popup';

    // Title
    const title = document.createElement('div');
    title.className = 'edit-popup-title';
    title.textContent = 'Add Project Members';
    popup.appendChild(title);

    // Search box
    const search = document.createElement('input');
    search.type = 'text';
    search.className = 'edit-popup-input';
    search.placeholder = 'Search by name...';
    popup.appendChild(search);

    // Members list
    const list = document.createElement('div');
    list.className = 'profile-select-list';
    popup.appendChild(list);

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'edit-popup-save';
    saveBtn.textContent = 'Add Selected';
    saveBtn.style.display = 'none';
    popup.appendChild(saveBtn);

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'edit-popup-cancel';
    cancelBtn.textContent = 'Cancel';
    popup.appendChild(cancelBtn);

    // Multi-select logic
    let selected = [];
    function renderProfiles(filter) {
        list.innerHTML = '';
        
        // Ensure allProjectMembers is an array and has the filter method
        if (!Array.isArray(allProjectMembers) || typeof allProjectMembers.filter !== 'function') {
            console.error('allProjectMembers is not a valid array:', allProjectMembers);
            const nores = document.createElement('div');
            nores.className = 'profile-select-nores';
            nores.textContent = 'No members available.';
            list.appendChild(nores);
            return;
        }
        
        allProjectMembers
            .filter(p => !filter || p.name.toLowerCase().includes(filter.toLowerCase()))
            .forEach(profile => {
                const alreadyMember = currentMembers.some(member => member.name === profile.name);
                const item = document.createElement('div');
                item.className = 'profile-select-item';
                if (selected.some(s => s.name === profile.name)) item.classList.add('selected');
                if (alreadyMember) item.style.opacity = '0.5';
                item.innerHTML = `
                    <img src="${profile.img}" alt="${profile.name}" class="profile-select-img">
                    <span class="profile-select-name">${profile.name}</span>
                `;
                item.onclick = function () {
                    if (alreadyMember) return;
                    const existingIndex = selected.findIndex(s => s.name === profile.name);
                    if (existingIndex >= 0) {
                        selected.splice(existingIndex, 1);
                    } else {
                        selected.push(profile);
                    }
                    renderProfiles(search.value);
                    saveBtn.style.display = selected.length > 0 ? 'inline-block' : 'none';
                };
                list.appendChild(item);
            });
        if (!list.childNodes.length) {
            const nores = document.createElement('div');
            nores.className = 'profile-select-nores';
            nores.textContent = 'No members found.';
            list.appendChild(nores);
        }
    }
    renderProfiles('');

    // Search handler
    search.oninput = function () {
        renderProfiles(search.value);
    };

    // Save handler
    saveBtn.onclick = async function () {
        if (selected.length > 0 && await confirm('Add selected member(s) to project?')) {
            onSave(selected);
            document.body.removeChild(backdrop);
            location.reload();
        }
    };

    // Cancel handler
    cancelBtn.onclick = function () {
        document.body.removeChild(backdrop);
    };

    // Backdrop click closes popup
    backdrop.onclick = function (e) {
        if (e.target === backdrop) {
            document.body.removeChild(backdrop);
        }
    };

    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);
    search.focus();
}

// Example project leaders data (replace with real data from server)
let allProjectLeaders = JSON.parse(window.allProjectLeaders.textContent) || []

// Show popup for selecting project leader (single-select)
function showProjectLeaderSelectPopup(currentName, onSave) {
    // Remove any existing popup
    const existing = document.getElementById('edit-popup-backdrop');
    if (existing) existing.remove();

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'edit-popup-backdrop';
    backdrop.className = 'edit-popup-backdrop';

    // Popup
    const popup = document.createElement('div');
    popup.className = 'edit-popup';

    // Title
    const title = document.createElement('div');
    title.className = 'edit-popup-title';
    title.textContent = 'Select Project Leader';
    popup.appendChild(title);

    // Search box
    const search = document.createElement('input');
    search.type = 'text';
    search.className = 'edit-popup-input';
    search.placeholder = 'Search by name...';
    popup.appendChild(search);

    // Profiles list
    const list = document.createElement('div');
    list.className = 'profile-select-list';
    popup.appendChild(list);

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'edit-popup-save';
    saveBtn.textContent = 'Save';
    saveBtn.style.display = 'none';
    popup.appendChild(saveBtn);

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'edit-popup-cancel';
    cancelBtn.textContent = 'Cancel';
    popup.appendChild(cancelBtn);

    let selected = null;
    function renderProfiles(filter) {
        list.innerHTML = '';
        
        // Ensure allProjectLeaders is an array and has the filter method
        if (!Array.isArray(allProjectLeaders) || typeof allProjectLeaders.filter !== 'function') {
            console.error('allProjectLeaders is not a valid array:', allProjectLeaders);
            const nores = document.createElement('div');
            nores.className = 'profile-select-nores';
            nores.textContent = 'No leaders available.';
            list.appendChild(nores);
            return;
        }
        
        allProjectLeaders
            .filter(p => !filter || p.name.toLowerCase().includes(filter.toLowerCase()))
            .forEach(profile => {
                const item = document.createElement('div');
                item.className = 'profile-select-item';
                if (profile.name === (selected ? selected.name : currentName)) item.classList.add('selected');
                item.innerHTML = `
                    <img src="${profile.img}" alt="${profile.name}" class="profile-select-img">
                    <span class="profile-select-name">${profile.name}</span>
                `;
                item.onclick = function () {
                    selected = profile;
                    renderProfiles(search.value);
                    saveBtn.style.display = 'inline-block';
                };
                list.appendChild(item);
            });
        if (!list.childNodes.length) {
            const nores = document.createElement('div');
            nores.className = 'profile-select-nores';
            nores.textContent = 'No leaders found.';
            list.appendChild(nores);
        }
    }
    renderProfiles('');

    search.oninput = function () {
        renderProfiles(search.value);
    };

    saveBtn.onclick = async function () {
        if (selected && await confirm('Set selected leader for this project?')) {
            onSave(selected);
            document.body.removeChild(backdrop);
            location.reload();
        }
    };

    cancelBtn.onclick = function () {
        document.body.removeChild(backdrop);
    };

    backdrop.onclick = function (e) {
        if (e.target === backdrop) {
            document.body.removeChild(backdrop);
        }
    };

    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);
    search.focus();
}

// Show popup for editing project photo
function showProjectPhotoEditPopup(currentImgUrl, onSave) {
    // Remove any existing popup
    const existing = document.getElementById('edit-popup-backdrop');
    if (existing) existing.remove();

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'edit-popup-backdrop';
    backdrop.className = 'edit-popup-backdrop';

    // Popup
    const popup = document.createElement('div');
    popup.className = 'edit-popup';

    // Title
    const title = document.createElement('div');
    title.className = 'edit-popup-title';
    title.textContent = 'Edit Project Photo';
    popup.appendChild(title);

    // Image preview
    const preview = document.createElement('img');
    preview.className = 'edit-popup-img-preview';
    preview.style.maxHeight = '200px';
    preview.style.objectFit = 'contain';
    preview.style.display = currentImgUrl ? 'block' : 'none';
    if (currentImgUrl) preview.src = currentImgUrl;
    popup.appendChild(preview);

    // File input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.className = 'edit-popup-input';
    popup.appendChild(input);

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'edit-popup-save';
    saveBtn.textContent = 'Save';
    saveBtn.style.display = 'none';
    popup.appendChild(saveBtn);

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'edit-popup-cancel';
    cancelBtn.textContent = 'Cancel';
    popup.appendChild(cancelBtn);

    // File change handler
    input.onchange = function () {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
                saveBtn.style.display = 'inline-block';
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    // Save handler
    saveBtn.onclick = async function () {
        if (input.files && input.files[0]) {
            if (await confirm('Are you sure you want to update the project photo?')) {
                onSave(input.files[0]);
                document.body.removeChild(backdrop);
                location.reload();
            }
        }
    };

    // Cancel handler
    cancelBtn.onclick = function () {
        document.body.removeChild(backdrop);
    };

    // Backdrop click closes popup
    backdrop.onclick = function (e) {
        if (e.target === backdrop) {
            document.body.removeChild(backdrop);
        }
    };

    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);
    input.focus();
}

function showAddProjectPopup(onSave) {
    // Remove any existing popup
    const existing = document.getElementById('edit-popup-backdrop');
    if (existing) existing.remove();

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'edit-popup-backdrop';
    backdrop.className = 'edit-popup-backdrop';

    // Popup
    const popup = document.createElement('div');
    popup.className = 'edit-popup';
    popup.id = 'add-project-popup'
    popup.style.maxWidth = '480px';

    // Title
    const title = document.createElement('div');
    title.className = 'edit-popup-title';
    title.textContent = 'Add New Project';
    popup.appendChild(title);

    // Form
    const form = document.createElement('form');
    form.className = 'add-project-form';

    // Project Name
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Project Name';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'edit-popup-input';
    nameInput.required = true;
    form.appendChild(nameLabel);
    form.appendChild(nameInput);

    // Project Photo
    const photoLabel = document.createElement('label');
    photoLabel.textContent = 'Project Photo';
    const photoInput = document.createElement('input');
    photoInput.type = 'file';
    photoInput.accept = 'image/*';
    photoInput.className = 'edit-popup-input';
    const photoPreview = document.createElement('img');
    photoPreview.className = 'edit-popup-img-preview';
    photoPreview.style.maxWidth = '100%';
    photoPreview.style.maxHeight = '180px';
    photoPreview.style.display = 'none';
    form.appendChild(photoLabel);
    form.appendChild(photoInput);
    form.appendChild(photoPreview);

    // Project Tags
    const tagsLabel = document.createElement('label');
    tagsLabel.textContent = 'Project Tags (comma separated)';
    const tagsInput = document.createElement('input');
    tagsInput.type = 'text';
    tagsInput.className = 'edit-popup-input';
    form.appendChild(tagsLabel);
    form.appendChild(tagsInput);

    // Project External Link
    const extLabel = document.createElement('label');
    extLabel.textContent = 'External Link';
    const extInput = document.createElement('input');
    extInput.type = 'url';
    extInput.className = 'edit-popup-input';
    form.appendChild(extLabel);
    form.appendChild(extInput);

    // Live Demo Link
    const liveLabel = document.createElement('label');
    liveLabel.textContent = 'Live Demo Link';
    const liveInput = document.createElement('input');
    liveInput.type = 'url';
    liveInput.className = 'edit-popup-input';
    form.appendChild(liveLabel);
    form.appendChild(liveInput);

    // Attachment
    const attachLabel = document.createElement('label');
    attachLabel.textContent = 'Attachment (PDF)';
    const attachInput = document.createElement('input');
    attachInput.type = 'file';
    attachInput.accept = '.pdf,application/pdf';
    attachInput.className = 'edit-popup-input';
    form.appendChild(attachLabel);
    form.appendChild(attachInput);

    // Project Description
    const descLabel = document.createElement('label');
    descLabel.textContent = 'Project Description';
    const descInput = document.createElement('textarea');
    descInput.className = 'edit-popup-input';
    descInput.rows = 4;
    descInput.required = true;
    form.appendChild(descLabel);
    form.appendChild(descInput);

    // Save Button
    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'edit-popup-save';
    saveBtn.textContent = 'Add Project';
    saveBtn.style.marginTop = '18px';
    form.appendChild(saveBtn);

    // Cancel Button
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'edit-popup-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.marginLeft = '10px';
    form.appendChild(cancelBtn);

    // Image preview logic
    photoInput.onchange = function () {
        if (photoInput.files && photoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                photoPreview.src = e.target.result;
                photoPreview.style.display = 'block';
            };
            reader.readAsDataURL(photoInput.files[0]);
        }
    };

    // Cancel handler
    cancelBtn.onclick = function (e) {
        e.preventDefault();
        document.body.removeChild(backdrop);
    };

    // Form submit handler
    form.onsubmit = async function (e) {
        e.preventDefault();
        if (!nameInput.value.trim() || !descInput.value.trim()) {
            await alert('Please fill in required fields.');
            return;
        }
        if (await confirm('Add this project?')) {
            onSave({
                name: nameInput.value.trim(),
                photo: photoInput.files[0] || null,
                tags: tagsInput.value.trim(),
                external: extInput.value.trim(),
                live: liveInput.value.trim(),
                attachment: attachInput.files[0] || null,
                desc: descInput.value.trim()
            });
            document.body.removeChild(backdrop);
            location.reload();
        }
    };

    // Backdrop click closes popup
    backdrop.onclick = function (e) {
        if (e.target === backdrop) {
            document.body.removeChild(backdrop);
        }
    };

    popup.appendChild(form);
    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);
    nameInput.focus();
}

// Add new project button
const addBtn = document.getElementById('addProjectBtn');
if (addBtn) {
    addBtn.onclick = function () {
        showAddProjectPopup(function (projectData) {
            // Use FormData if there are files, else JSON
            const data = {
                name: projectData.name,
                desc: projectData.desc,
                tags: projectData.tags,
                external: projectData.external,
                live: projectData.live,
            };
            const files = {};
            if (projectData.photo) files.project_photo = projectData.photo;
            if (projectData.attachment) files.attachment = projectData.attachment;
            // Optionally add project_lead and members as ids if available
            if (projectData.project_lead_id) data.project_lead = projectData.project_lead_id;
            if (projectData.member_ids) data.members = projectData.member_ids;
            const url = `/executives/api/labs/add_project/${encodeURIComponent(window.currentLabKey)}/`;
            if (files.project_photo || files.attachment) {
                const formData = new FormData();
                for (const k in data) formData.append(k, data[k]);
                if (files.project_photo) formData.append('project_photo', files.project_photo);
                if (files.attachment) formData.append('attachment', files.attachment);
                fetch(url, {
                    method: 'POST',
                    headers: { 'X-CSRFToken': (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '' },
                    body: formData
                })
                .then(res => res.json())
                .then(async function(resp) {
                    if (resp.success) {
                        location.reload();
                    } else {
                        await alert('Failed to add project');
                    }
                })
                .catch(async () => await alert('AJAX error'));
            } else {
                ajaxLabAPI(
                    url,
                    'POST',
                    data,
                    async function(resp) {
                        if (resp.success) {
                            location.reload();
                        } else {
                            await alert('Failed to add project');
                        }
                    },
                    async function() { await alert('AJAX error'); }
                );
            }
        });
    };
}

// Utility for AJAX
function ajaxLabAPI(url, method, data, onSuccess, onError) {
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || ''
        },
        body: data ? JSON.stringify(data) : undefined
    })
    .then(res => res.json())
    .then(onSuccess)
    .catch(onError || (async err => await alert('AJAX error: ' + err)));
}

// Utility to update project via AJAX (handles file and non-file fields)
function updateProject(labKey, projectId, data, files, cb) {
    if (files && (files.project_photo || files.attachment)) {
        const formData = new FormData();
        for (const k in data) formData.append(k, typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k]);
        if (files.project_photo) formData.append('project_photo', files.project_photo);
        if (files.attachment) formData.append('attachment', files.attachment);
        fetch(`/executives/api/labs/edit_project/${encodeURIComponent(labKey)}/${encodeURIComponent(projectId)}/`, {
            method: 'POST',
            headers: { 'X-CSRFToken': (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '' },
            body: formData
        })
        .then(res => res.json())
        .then(cb)
        .catch(async () => await alert('AJAX error'));
    } else {
        ajaxLabAPI(
            `/executives/api/labs/edit_project/${encodeURIComponent(labKey)}/${encodeURIComponent(projectId)}/`,
            'POST',
            data,
            cb,
            async () => await alert('AJAX error')
        );
    }
}

// Add this function to handle photo upload via AJAX
async function addLabPhoto(labKey, file, cb) {
    const formData = new FormData();
    formData.append('photo', file);
    await alert('gonna go to submit photo');
    fetch(`/executives/api/labs/add_photo/${encodeURIComponent(labKey)}/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '' },
        body: formData
    })
    .then(res => res.json())
    .then(cb)
    .catch(async err => await alert('AJAX error: ' + err));
}

// Update handlePhotoInputChange to use the above function
async function handlePhotoInputChange(e) {
    const fileInput = e.target;
    if (fileInput.files && fileInput.files[0]) {
        if (await confirm('Are you sure you want to add this image?')) {
            await alert('something');
            addLabPhoto(window.currentLabKey, fileInput.files[0], async function(resp) {
                if (resp.success) {
                    await alert("successful");
                    // location.reload();
                } else {
                    await alert('Failed to add photo');
                }
            });
        } else {
            fileInput.value = '';
        }
    }
}
