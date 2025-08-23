// Simple in-memory posts array for demo
// let posts = [
//     {
//         author: "Moe Thiha",
//         avatar: "Student Mailbox_files/profile.jpg",
//         time: "Just now",
//         text: "Welcome to the new noticeboard!",
//         anonymous: false,
//         media: [],
//         reactions: 0,
//         comments: 0
//     }
// ];

// let pendingPosts = [];

// DOM Elements - with error checking
const postInput = document.getElementById('post-input');
const postBtn = document.getElementById('post-btn');
const postsFeed = document.getElementById('posts-feed');
const imageUpload = document.getElementById('image-upload');
const videoUpload = document.getElementById('video-upload');
const mediaPreview = document.getElementById('media-preview');

// Debug: Check if all elements are found
console.log('DOM Elements Check:', {
    postInput: !!postInput,
    postBtn: !!postBtn,
    postsFeed: !!postsFeed
});

let selectedMedia = [];

// Modal state
let modalState = {
    images: [],
    current: 0
};

// Helper for image grid
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
    modalState.images = images;
    modalState.current = idx;
    updateModal();
    imageModal.style.display = 'flex';
    setTimeout(() => { imageModal.style.opacity = '1'; }, 10);
}
function closeImageModal() {
    imageModal.style.opacity = '0';
    setTimeout(() => { imageModal.style.display = 'none'; }, 200);
}
function updateModal() {
    const img = document.getElementById('modal-img');
    img.src = modalState.images[modalState.current];
    document.getElementById('modal-prev').style.display = modalState.current > 0 ? 'block' : 'none';
    document.getElementById('modal-next').style.display = modalState.current < modalState.images.length - 1 ? 'block' : 'none';
}
document.getElementById('modal-prev').onclick = () => {
    if (modalState.current > 0) {
        modalState.current--;
        updateModal();
    }
};
document.getElementById('modal-next').onclick = () => {
    if (modalState.current < modalState.images.length - 1) {
        modalState.current++;
        updateModal();
    }
};
document.getElementById('modal-close').onclick = closeImageModal;
imageModal.onclick = (e) => {
    if (e.target === imageModal) closeImageModal();
};
document.addEventListener('keydown', (e) => {
    if (imageModal.style.display === 'flex') {
        if (e.key === 'ArrowLeft') document.getElementById('modal-prev').click();
        if (e.key === 'ArrowRight') document.getElementById('modal-next').click();
        if (e.key === 'Escape') closeImageModal();
    }
});

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

        const roleLabel = post.role ? ` <span class="badge bg-secondary ms-1">${capitalize(post.role)}</span>` : '';
        postCard.innerHTML = `
            <div class="card-body">
                <div class="d-flex align-items-center mb-2">
                    <img src="${post.avatar}" class="rounded-circle me-2" width="40" height="40" alt="Avatar">
                    <div>
                        <span class="post-author">${post.author}${post.anonymous ? '' : roleLabel}</span><br>
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

function capitalize(s) {
    if (!s || typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
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

    postBtn.addEventListener('click', async () => {
        if (postInput.value.trim() === '') return;
        if (!await confirm('Are you sure you want to post this notice?')) return;
        // Use FormData to send files
        const formData = new FormData();
        formData.append('caption', postInput.value);
        if (window.selectedMedia && window.selectedMedia.length) {
            window.selectedMedia.forEach(m => {
                if (m.file) formData.append('files', m.file);
            });
        }
        try {
            const res = await fetch('/noticeboard/api/posts/', {
                method: 'POST',
                credentials: 'same-origin',
                body: formData
            });
            if (!res.ok) throw new Error();
            showNotificationMessage('Post submitted!', 'success');
            postInput.value = '';
            window.selectedMedia = [];
            if (mediaPreview) mediaPreview.innerHTML = '';
            postBtn.disabled = true;
            fetchMyPosts();
        } catch (e) {
            showNotificationMessage('Failed to submit post', 'info');
        }
    });
} else {
    console.error('Post input or button not found!');
}

async function fetchMyPosts() {
    const container = document.getElementById('my-posts');
    if (!container) return;
    container.innerHTML = 'Loading...';
    try {
        const res = await fetch('/noticeboard/api/posts/my/', { credentials: 'same-origin' });
        const data = await res.json();
        const items = (data.results || []);
        if (!items.length) { container.innerHTML = '<em>No posts yet.</em>'; return; }
        container.innerHTML = '';
        items.forEach(p => {
            const notice = p.notice || {};
            const files = notice.files || [];
            const imgs = files.filter(u => !u.match(/\.(mp4|webm|ogg)$/i));
            const vids = files.filter(u => u.match(/\.(mp4|webm|ogg)$/i));
            const role = window.currentUser && window.currentUser.role ? `<span class="badge bg-secondary ms-2">${window.currentUser.role.charAt(0).toUpperCase() + window.currentUser.role.slice(1)}</span>` : '';
            const div = document.createElement('div');
            div.className = 'd-flex justify-content-between border rounded p-2 mb-2 align-items-center';
            div.innerHTML = `<div>
                <strong>${window.currentUser.fullName || ''}</strong>${role}<br>
                <small class="text-muted">${p.status === 'U' ? 'Approved' : p.status === 'P' ? 'Pending' : 'Rejected'}${p.created_at ? ' • ' + new Date(p.created_at).toLocaleString() : ''}</small>
                <div>${createImageGrid(imgs)}${createVideoGrid(vids)}</div>
            </div>
            <div>
                <button class="btn btn-sm btn-outline-danger" data-id="${p.id}">Delete</button>
            </div>`;
            // Modal logic
            const imgEls = div.querySelectorAll('.post-img-single, .post-img-multi');
            imgEls.forEach(imgEl => {
                imgEl.onclick = (e) => openImageModal(imgs, parseInt(imgEl.dataset.imgIdx));
            });
            // Overlay click for "+N"
            const overlay = div.querySelector('.position-absolute');
            if (overlay) {
                overlay.onclick = () => openImageModal(imgs, 3);
            }
            div.querySelector('button').onclick = () => deleteMyPost(p.id, div);
            container.appendChild(div);
        });
    } catch (_) {
        container.innerHTML = '<em>Failed to load.</em>';
    }
}

async function deleteMyPost(id, rowEl) {
    if (!await confirm('Are you sure you want to delete this post?')) return;
    try {
        const res = await fetch(`/noticeboard/api/posts/${id}/delete/`, { method: 'DELETE', credentials: 'same-origin' });
        if (!res.ok) throw new Error();
        if (rowEl) rowEl.remove();
        fetchMyPosts();
        showNotificationMessage('Post deleted!', 'success');
    } catch (_) {}
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

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', fetchMyPosts);

// Responsive: re-render posts on resize to update image count per row
window.addEventListener('resize', () => renderPosts());