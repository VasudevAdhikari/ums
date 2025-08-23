// Simple in-memory posts array for demo
let posts = [
    {
        author: "Moe Thiha",
        avatar: "Student Mailbox_files/profile.jpg",
        time: "Just now",
        text: "Welcome to the new noticeboard!",
        anonymous: false,
        media: [],
        reactions: 0,
        comments: 0
    }
];

let pendingPosts = [];

// DOM Elements - with error checking
const postInput = document.getElementById('post-input');
const postBtn = document.getElementById('post-btn');
const postsFeed = document.getElementById('posts-feed');
const imageUpload = document.getElementById('image-upload');
const videoUpload = document.getElementById('video-upload');
const mediaPreview = document.getElementById('media-preview');
const anonymousToggle = document.getElementById('anonymous-toggle');

// Notification elements - with error checking
const notificationBtn = document.getElementById('notification-btn');
const notificationDot = document.getElementById('notification-dot');
const notificationModal = document.getElementById('notification-modal');
const notificationModalClose = document.getElementById('notification-modal-close');
const pendingPostsContainer = document.getElementById('pending-posts-container');

// Debug: Check if all elements are found
console.log('DOM Elements Check:', {
    postInput: !!postInput,
    postBtn: !!postBtn,
    postsFeed: !!postsFeed,
    notificationBtn: !!notificationBtn,
    notificationDot: !!notificationDot,
    notificationModal: !!notificationModal,
    pendingPostsContainer: !!pendingPostsContainer
});

let selectedMedia = [];

// Modal state
var modalState = {
    images: [],
    current: 0
};

// Create modal HTML once
const imageModal = document.createElement('div');
imageModal.id = 'image-modal';
imageModal.style.display = 'none';
imageModal.style.position = 'fixed';
imageModal.style.top = '0';
imageModal.style.left = '0';
imageModal.style.width = '100vw';
imageModal.style.height = '100vh';
imageModal.style.background = 'rgba(0,0,0,0.8)';
imageModal.style.zIndex = '9999';
imageModal.style.justifyContent = 'center';
imageModal.style.alignItems = 'center';
imageModal.style.transition = 'opacity 0.2s';
imageModal.innerHTML = `
    <div id="modal-content" style="position:relative;max-width:90vw;max-height:90vh;display:flex;align-items:center;justify-content:center;">
        <button id="modal-prev" class="modal-arrow-btn btn btn-light" style="position:absolute;left:-60px;top:50%;transform:translateY(-50%);z-index:2;display:none;">
            <i class="fa-solid fa-chevron-left fs-2"></i>
        </button>
        <img id="modal-img" src="" style="max-width:80vw;max-height:80vh;border-radius:12px;box-shadow:0 4px 32px #0008;">
        <button id="modal-next" class="modal-arrow-btn btn btn-light" style="position:absolute;right:-60px;top:50%;transform:translateY(-50%);z-index:2;display:none;">
            <i class="fa-solid fa-chevron-right fs-2"></i>
        </button>
        <button id="modal-close" class="btn btn-light" style="position:absolute;top:-40px;right:-40px;border-radius:50%;width:36px;height:36px;font-size:1.5rem;z-index:3;">&times;</button>
    </div>
`;
document.body.appendChild(imageModal);

function openImageModal(images, idx) {
    if (!imageModal) {
        imageModal = document.createElement('div');
        imageModal.id = 'image-modal';
        imageModal.style.display = 'none';
        imageModal.style.position = 'fixed';
        imageModal.style.top = '0';
        imageModal.style.left = '0';
        imageModal.style.width = '100vw';
        imageModal.style.height = '100vh';
        imageModal.style.background = 'rgba(0,0,0,0.8)';
        imageModal.style.zIndex = '9999';
        imageModal.style.justifyContent = 'center';
        imageModal.style.alignItems = 'center';
        imageModal.style.transition = 'opacity 0.2s';
        imageModal.innerHTML = `
            <div id="modal-content" style="position:relative;max-width:90vw;max-height:90vh;display:flex;align-items:center;justify-content:center;">
                <button id="modal-prev" class="modal-arrow-btn btn btn-light" style="position:absolute;left:-60px;top:50%;transform:translateY(-50%);z-index:2;display:none;">
                    <i class="fa-solid fa-chevron-left fs-2"></i>
                </button>
                <img id="modal-img" src="" style="max-width:80vw;max-height:80vh;border-radius:12px;box-shadow:0 4px 32px #0008;">
                <button id="modal-next" class="modal-arrow-btn btn btn-light" style="position:absolute;right:-60px;top:50%;transform:translateY(-50%);z-index:2;display:none;">
                    <i class="fa-solid fa-chevron-right fs-2"></i>
                </button>
                <button id="modal-close" class="btn btn-light" style="position:absolute;top:-40px;right:-40px;border-radius:50%;width:36px;height:36px;font-size:1.5rem;z-index:3;">&times;</button>
            </div>
        `;
        document.body.appendChild(imageModal);
        document.getElementById('modal-prev').onclick = () => modalState.current > 0 && showModalImg(modalState.images, --modalState.current);
        document.getElementById('modal-next').onclick = () => modalState.current < modalState.images.length-1 && showModalImg(modalState.images, ++modalState.current);
        document.getElementById('modal-close').onclick = closeImageModal;
        imageModal.onclick = (e) => { if (e.target === imageModal) closeImageModal(); };
        document.addEventListener('keydown', (e) => {
            if (imageModal.style.display === 'flex') {
                if (e.key === 'ArrowLeft') document.getElementById('modal-prev').click();
                if (e.key === 'ArrowRight') document.getElementById('modal-next').click();
                if (e.key === 'Escape') closeImageModal();
            }
        });
    }
    modalState.images = images;
    modalState.current = idx;
    showModalImg(images, idx);
    imageModal.style.display = 'flex';
    setTimeout(() => { imageModal.style.opacity = '1'; }, 10);
}
function closeImageModal() {
    imageModal.style.opacity = '0';
    setTimeout(() => { imageModal.style.display = 'none'; }, 200);
}
function showModalImg(images, idx) {
    const img = document.getElementById('modal-img');
    img.src = images[idx];
    document.getElementById('modal-prev').style.display = idx > 0 ? 'block' : 'none';
    document.getElementById('modal-next').style.display = idx < images.length - 1 ? 'block' : 'none';
}
var modalState = { images: [], current: 0 };

function getMaxImagesPerRow() {
    if (window.innerWidth < 576) return 2;
    if (window.innerWidth < 992) return 3;
    return 4;
}

function getMaxImagesPerRowDynamic(containerWidth) {
    // Minimum image size + gap (from CSS)
    const minImg = 60; // px (smallest from CSS)
    const gap = 8; // px
    // Try to fit as many as possible, max 6 for sanity
    let max = 1;
    for (let n = 6; n > 0; n--) {
        if ((n * minImg + (n - 1) * gap) <= containerWidth) {
            max = n;
            break;
        }
    }
    return max;
}

function renderPosts() {
    postsFeed.innerHTML = '';
    posts.slice().reverse().forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'card';
        // Separate images and videos
        const images = post.media.filter(m => m.type === 'image').map(m => m.url);
        const videos = post.media.filter(m => m.type === 'video').map(m => m.url);

        let mediaHtml = '';
        // Single image or single video
        if (images.length === 1 && videos.length === 0) {
            mediaHtml = `
                <div class="post-image-single-wrapper">
                    <img src="${images[0]}" class="post-image-single" data-img-idx="0">
                </div>
            `;
        } else if (videos.length === 1 && images.length === 0) {
            mediaHtml = `
                <div class="post-video-single-wrapper">
                    <video src="${videos[0]}" class="post-video-single" controls data-vid-idx="0"></video>
                </div>
            `;
        } else {
            // Up to 3 images, then up to 3 videos (if images < 3, fill with videos)
            let mediaArr = [];
            let imgCount = Math.min(images.length, 3);
            let vidCount = Math.min(3 - imgCount, videos.length);
            // Images first
            images.slice(0, imgCount).forEach((url, idx) => {
                let overlay = '';
                if (idx === 2 && images.length > 3) {
                    overlay = `
                        <div class="post-image-overlay-flex">
                            +${images.length - 2}
                        </div>
                    `;
                }
                mediaArr.push(`
                    <div class="post-image-wrapper-flex">
                        <img src="${url}" class="post-image-original" data-img-idx="${idx}">
                        ${overlay}
                    </div>
                `);
            });
            // Videos next
            videos.slice(0, vidCount).forEach((url, idx) => {
                let overlay = '';
                if ((imgCount + idx) === 2 && videos.length > vidCount && images.length < 3) {
                    overlay = `
                        <div class="post-image-overlay-flex">
                            +${videos.length - (vidCount - 1)}
                        </div>
                    `;
                }
                mediaArr.push(`
                    <div class="post-video-wrapper-flex">
                        <video src="${url}" class="post-video-original" controls data-vid-idx="${idx}"></video>
                        ${overlay}
                    </div>
                `);
            });
            mediaHtml = mediaArr.join('');
        }

        postCard.innerHTML = `
            <div class="card-body">
                <div class="d-flex align-items-center mb-2">
                    <img src="${post.anonymous ? 'https://ui-avatars.com/api/?name=Anonymous' : post.avatar}" class="rounded-circle me-2" width="40" height="40" alt="Avatar">
                    <div>
                        <span class="post-author">${post.anonymous ? 'Anonymous' : post.author}</span><br>
                        <span class="post-time">${post.time}</span>
                    </div>
                </div>
                <div class="mb-2">${escapeHTML(post.text)}</div>
                <div class="mb-2 ${
                    (images.length === 1 && videos.length === 0) ? 'post-media-row-single' :
                    (videos.length === 1 && images.length === 0) ? 'post-media-row-single' :
                    'post-media-row-flex'
                }">
                    ${mediaHtml}
                </div>
                <!-- No Like/Comment buttons -->
            </div>
        `;

        // Add click event for images
        if (images.length === 1 && videos.length === 0) {
            const imgEl = postCard.querySelector('.post-image-single');
            if (imgEl) {
                imgEl.onclick = () => openImageModal(images, 0);
            }
        } else if (videos.length === 1 && images.length === 0) {
            // No modal for video
        } else {
            // Images
            const wrappers = postCard.querySelectorAll('.post-image-wrapper-flex img');
            wrappers.forEach(imgEl => {
                imgEl.onclick = (e) => {
                    let idx = parseInt(imgEl.getAttribute('data-img-idx'));
                    openImageModal(images, idx);
                };
            });
            // Overlay click for images
            const overlayImg = postCard.querySelector('.post-image-overlay-flex');
            if (overlayImg && images.length > 3) {
                overlayImg.style.cursor = 'pointer';
                overlayImg.onclick = () => openImageModal(images, 2);
            }
            // Videos (no modal, just play)
            // Overlay click for videos (no modal, just focus video)
            const videoWrappers = postCard.querySelectorAll('.post-video-wrapper-flex video');
            videoWrappers.forEach((vidEl, idx) => {
                vidEl.onclick = (e) => { /* default video controls */ };
            });
        }
        postsFeed.appendChild(postCard);
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function(m) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[m];
    });
}

// Post button functionality with error handling
if (postInput && postBtn) {
    postInput.addEventListener('input', () => {
        postBtn.disabled = postInput.value.trim() === '';
    });

    postBtn.addEventListener('click', () => {
        console.log('Post button clicked!'); // Debug log
        if (postInput.value.trim() === '') return;
        
        // Add to pending, not directly to posts
        const newPost = {
            author: "Htoo Aung Lin",
            avatar: "Student Mailbox_files/choose-the-right-option-v0-7ynsgqi1db2d1.webp",
            time: "Just now",
            text: postInput.value,
            anonymous: anonymousToggle ? anonymousToggle.checked : false,
            media: [...selectedMedia],
            reactions: 0,
            comments: 0
        };
        
        pendingPosts.push(newPost);
        console.log('Post added to pending:', newPost); // Debug log
        console.log('Total pending posts:', pendingPosts.length); // Debug log
        
        postInput.value = '';
        selectedMedia = [];
        if (mediaPreview) mediaPreview.innerHTML = '';
        postBtn.disabled = true;
        
        updateNotificationDot();
        renderPendingPosts();
        
        // Show success message
        showNotificationMessage('Post submitted for approval!', 'success');
    });
} else {
    console.error('Post input or button not found!');
}

function handleMediaUpload(input, type) {
    Array.from(input.files).forEach(file => {
        const url = URL.createObjectURL(file);
        selectedMedia.push({ type, url });
        const el = document.createElement(type === 'image' ? 'img' : 'video');
        el.src = url;
        el.className = 'me-2';
        el.width = 80;
        el.height = 80;
        if (type === 'video') el.controls = true;
        mediaPreview.appendChild(el);
    });
}

// Media upload event listeners with error handling
if (imageUpload) {
    imageUpload.addEventListener('change', () => handleMediaUpload(imageUpload, 'image'));
} else {
    console.error('Image upload input not found!');
}

if (videoUpload) {
    videoUpload.addEventListener('change', () => handleMediaUpload(videoUpload, 'video'));
} else {
    console.error('Video upload input not found!');
}



// Notification functionality
function updateNotificationDot() {
    if (notificationDot) {
        notificationDot.style.display = pendingPosts.length > 0 ? 'block' : 'none';
    }
}

function showNotificationModal() {
    notificationModal.style.display = 'flex';
    renderPendingPosts();
}

function hideNotificationModal() {
    notificationModal.style.display = 'none';
}

function showNotificationMessage(message, type = 'info') {
    // Create a temporary notification message
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#17a2b8'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1002;
        font-size: 14px;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function renderPendingPosts() {
    if (!pendingPostsContainer) return;
    
    pendingPostsContainer.innerHTML = '';
    
    if (pendingPosts.length === 0) {
        pendingPostsContainer.innerHTML = `
            <div class="no-pending-message">
                <i class="fas fa-check-circle" style="font-size: 3rem; color: #28a745; margin-bottom: 1rem;"></i>
                <p>No pending posts to approve!</p>
            </div>
        `;
        return;
    }
    
    pendingPosts.forEach((post, index) => {
        const postElement = document.createElement('div');
        postElement.className = 'pending-post-item';
        
        // Separate images and videos
        const images = post.media.filter(m => m.type === 'image').map(m => m.url);
        const videos = post.media.filter(m => m.type === 'video').map(m => m.url);
        
        let mediaHtml = '';
        if (images.length > 0 || videos.length > 0) {
            mediaHtml = '<div class="mt-2"><small class="text-muted">📎 Media attached</small></div>';
        }
        
        postElement.innerHTML = `
            <div class="d-flex align-items-start">
                <img src="${post.anonymous ? 'https://ui-avatars.com/api/?name=Anonymous' : post.avatar}" 
                     class="rounded-circle me-3" width="40" height="40" alt="Avatar">
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <strong>${post.anonymous ? 'Anonymous' : post.author}</strong>
                            <small class="text-muted d-block">${post.time}</small>
                        </div>
                        ${post.anonymous ? '<span class="badge bg-secondary">Anonymous</span>' : ''}
                    </div>
                    <p class="mt-2 mb-0">${escapeHTML(post.text)}</p>
                    ${mediaHtml}
                    <div class="pending-post-actions">
                        <button class="approve-btn" onclick="approvePost(${index})">
                            <i class="fas fa-check me-1"></i>Approve
                        </button>
                        <button class="reject-btn" onclick="rejectPost(${index})">
                            <i class="fas fa-times me-1"></i>Reject
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        pendingPostsContainer.appendChild(postElement);
    });
}

function approvePost(index) {
    // Move post from pending to approved
    const approvedPost = pendingPosts.splice(index, 1)[0];
    posts.push(approvedPost);
    
    // Update UI
    renderPendingPosts();
    renderPosts();
    updateNotificationDot();
    
    // Show success message
    showNotificationMessage('Post approved and published!', 'success');
}

function rejectPost(index) {
    // Remove post from pending
    pendingPosts.splice(index, 1);
    
    // Update UI
    renderPendingPosts();
    updateNotificationDot();
    
    // Show info message
    showNotificationMessage('Post rejected and removed.', 'info');
}

// Event listeners with error handling
if (notificationBtn) {
    notificationBtn.addEventListener('click', () => {
        console.log('Notification button clicked!'); // Debug log
        showNotificationModal();
    });
} else {
    console.error('Notification button not found!');
}

if (notificationModalClose) {
    notificationModalClose.addEventListener('click', hideNotificationModal);
} else {
    console.error('Notification modal close button not found!');
}

if (notificationModal) {
    notificationModal.addEventListener('click', (e) => {
        if (e.target === notificationModal) {
            hideNotificationModal();
        }
    });
} else {
    console.error('Notification modal not found!');
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing noticeboard...'); // Debug log
    updateNotificationDot();
    renderPosts();
    console.log('Noticeboard initialized successfully!'); // Debug log
});

// Responsive: re-render posts on resize to update image count per row
window.addEventListener('resize', () => renderPosts());

async function loadPending() {
    const box = document.getElementById('pending-list');
    box.innerHTML = 'Loading...';
    try {
        const res = await fetch('/noticeboard/api/posts/pending/', { credentials: 'same-origin' });
        if (!res.ok) { box.innerHTML = '<em>Forbidden or error.</em>'; return; }
        const data = await res.json();
        const items = data.results || [];
        if (!items.length) { box.innerHTML = '<em>No pending posts.</em>'; return; }
        box.innerHTML = '';
        items.forEach(p => {
            const notice = p.notice || {};
            const files = notice.files || [];
            const imgs = files.filter(u => !u.match(/\.(mp4|webm|ogg)$/i));
            const vids = files.filter(u => u.match(/\.(mp4|webm|ogg)$/i));
            const media = imgs.slice(0,3).map(u => `<img src="${u}" class="me-2" style="width:80px;height:80px;object-fit:cover;">`).join('') +
                         vids.slice(0,1).map(u => `<video src="${u}" class="me-2" style="width:120px;height:80px;object-fit:cover;" controls></video>`).join('');
            const div = document.createElement('div');
            div.className = 'pending-post-item';
            div.innerHTML = `
                <div class="d-flex align-items-start">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(p.username || 'User')}" class="rounded-circle me-3" width="40" height="40" alt="Avatar">
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <strong>${p.username || 'User'}</strong>
                                <small class="text-muted d-block">${new Date(p.created_at).toLocaleString()}</small>
                            </div>
                        </div>
                        <p class="mt-2 mb-2">${(notice.caption || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</p>
                        <div class="mb-2">${createImageGrid(imgs)}${createVideoGrid(vids)}</div>
                        <div class="pending-post-actions">
                            <button class="approve-btn" data-id="${p.id}"><i class="fas fa-check me-1"></i>Approve</button>
                            <button class="reject-btn" data-id="${p.id}"><i class="fas fa-times me-1"></i>Reject</button>
                        </div>
                    </div>
                </div>`;
            box.appendChild(div);
        });
        box.querySelectorAll('.approve-btn').forEach(btn => btn.onclick = () => act(btn.dataset.id, 'approve'));
        box.querySelectorAll('.reject-btn').forEach(btn => btn.onclick = () => act(btn.dataset.id, 'reject'));
    } catch (e) {
        box.innerHTML = '<em>Failed to load.</em>';
    }
}
async function act(id, action) {
    try {
        const url = `/noticeboard/api/posts/${id}/${action}/`;
        const res = await fetch(url, { method: 'POST', credentials: 'same-origin' });
        if (!res.ok) throw new Error();
        loadPending();
    } catch (_) {}
}
document.addEventListener('DOMContentLoaded', loadPending);

function createImageGrid(imgs) {
    if (imgs.length === 1) {
        return `<img src="${imgs[0]}" class="img-fluid rounded mb-2 w-100 post-img-single" style="max-height:400px;object-fit:cover;cursor:pointer;" data-img-idx="0">`;
    }
    let html = '<div class="row g-2">';
    let maxShow = Math.min(4, imgs.length);
    for (let i = 0; i < maxShow; ++i) {
        html += `<div class="col-3"><div class="position-relative">
            <img src="${imgs[i]}" class="img-fluid rounded post-img-multi" style="height:120px;object-fit:cover;cursor:pointer;" data-img-idx="${i}">
            ${i === 3 && imgs.length > 4 ? `<div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 text-white fs-3 fw-bold" style="border-radius:.5rem;cursor:pointer;">+${imgs.length-4}</div>` : ''}
        </div></div>`;
    }
    html += '</div>';
    return html;
}
function createVideoGrid(vids) {
    if (!vids.length) return '';
    return vids.map((u, i) =>
        `<video src="${u}" class="img-fluid rounded mb-2 w-100" style="max-height:320px;object-fit:cover;" controls></video>`
    ).join('');
}