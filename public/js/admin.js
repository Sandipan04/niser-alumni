import { getAlumni } from './api.js';

let allStudents = [];
let userModal;

const modalFields = [
    'mRoll', 'mName', 'mPermEmail', 'mProg', 'mDept', 'mStart', 'mEnd', 
    'mPosition', 'mInstitute', 'mSupervisor', 'mNiserEmail', 'mProfEmail', 
    'mPhone', 'mOtherEmails', 'mSocial', 'mInterests', 'mCareer', 'mFuture', 
    'mPhoto', 'mComments', 'mInfo'
];

document.addEventListener('DOMContentLoaded', async () => {
    userModal = new bootstrap.Modal(document.getElementById('userModal'));
    
    const startSelect = document.getElementById('adminStart');
    for (let y = new Date().getFullYear() + 1; y >= 2007; y--) {
        startSelect.add(new Option(y, y));
    }

    await fetchDatabase();
    await fetchQueue();
    await fetchMessages();
});

// --- CROPPER LOGIC ---
let cropper = null;
const fileInput = document.getElementById('inFile');
const imageToCrop = document.getElementById('imageToCrop');
const cropModalElement = document.getElementById('cropModal');
const cropModal = cropModalElement ? new bootstrap.Modal(cropModalElement) : null;

if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert("File is too large! Please select an image under 5MB.");
            fileInput.value = ""; return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            imageToCrop.src = event.target.result;
            if (cropModal) cropModal.show();
        };
        reader.readAsDataURL(file);
    });
}

if (cropModalElement) {
    cropModalElement.addEventListener('shown.bs.modal', () => {
        cropper = new Cropper(imageToCrop, { aspectRatio: 1, viewMode: 1, autoCropArea: 1 });
    });
    cropModalElement.addEventListener('hidden.bs.modal', () => {
        if (cropper) { cropper.destroy(); cropper = null; }
        if (fileInput) fileInput.value = ""; 
    });
}

const btnCropUpload = document.getElementById('btnCropUpload');
if (btnCropUpload) {
    btnCropUpload.addEventListener('click', () => {
        if (!cropper) return;
        btnCropUpload.disabled = true;
        btnCropUpload.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Uploading...`;

        const canvas = cropper.getCroppedCanvas({ width: 400, height: 400 });
        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('file', blob, 'profile.jpg');
            try {
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                document.getElementById('mPhoto').value = data.url;
                if (fileInput) fileInput.classList.add('d-none');
                
                const oldPreview = document.getElementById('successPreviewDiv');
                if (oldPreview) oldPreview.remove();

                document.getElementById('photoPreviewContainer').insertAdjacentHTML('beforeend', `
                    <div id="successPreviewDiv" class="d-flex align-items-center gap-3">
                        <img src="${data.url}" class="rounded-circle shadow-sm" style="width: 70px; height: 70px; object-fit: cover; border: 3px solid white;">
                        <div class="text-success fw-medium"><i class="fas fa-check-circle me-1"></i> Uploaded Successfully</div>
                    </div>
                `);
                cropModal.hide();
            } catch (err) { alert("Upload failed: " + err.message); } 
            finally {
                btnCropUpload.disabled = false;
                btnCropUpload.innerHTML = `<i class="fas fa-upload me-1"></i> Crop & Upload`;
            }
        }, 'image/jpeg', 0.8); 
    });
}

async function fetchQueue() {
    const container = document.getElementById('queueContainer');
    try {
        const response = await fetch('/api/admin/queue');
        const requests = await response.json();

        if (requests.length === 0) {
            container.innerHTML = `<div class="card-custom p-5 text-center text-muted border border-dashed"><i class="fas fa-check-circle fs-2 text-success mb-2"></i><br><h6>Queue is empty</h6></div>`;
            return;
        }

        container.innerHTML = '';
        requests.forEach(req => {
            const isUpdate = req.request_type === 'UPDATE';
            let detailsHtml = `<div class="bg-light p-2 rounded small text-muted mt-2">Contact: ${req.permanent_email} | Position: ${req.current_position || 'N/A'}</div>`;

            if (isUpdate && req.target_id) {
                const orig = allStudents.find(s => s.id === req.target_id);
                if (orig) {
                    const fieldsToCompare = [
                        'permanent_email', 'niser_email', 'professional_email', 'phone_number', 'other_emails', 
                        'social_media_links', 'current_position', 'current_institute', 'supervisor', 
                        'research_interests', 'career_path', 'future_plans', 'photo_url', 'comments_for_batch', 'additional_info'
                    ];
                    
                    let changes = [];
                    fieldsToCompare.forEach(f => {
                        const oldVal = (orig[f] || '').toString().trim();
                        const newVal = (req[f] || '').toString().trim();
                        if (oldVal !== newVal) {
                            const displayOld = oldVal || '<i>(empty)</i>';
                            const displayNew = newVal || '<i>(empty)</i>';
                            
                            if (f === 'photo_url') {
                                changes.push(`<li><strong>Photo:</strong> <s class="text-danger">Updated Photo Attached</s></li>`);
                            } else {
                                const fieldName = f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                changes.push(`<li><strong>${fieldName}:</strong> <s class="text-danger me-2">${displayOld}</s> &rarr; <span class="text-success ms-2">${displayNew}</span></li>`);
                            }
                        }
                    });
                    
                    if (changes.length > 0) {
                        detailsHtml = `
                        <div class="mt-3 p-3 bg-white border border-warning rounded small shadow-sm">
                            <strong class="text-warning-emphasis"><i class="fas fa-exchange-alt me-1"></i> Changes Requested:</strong>
                            <ul class="mb-0 ps-3 mt-2" style="list-style-type: square;">
                                ${changes.join('')}
                            </ul>
                        </div>`;
                    } else {
                        detailsHtml = `<div class="mt-3 p-2 bg-white border border-warning rounded small text-muted">No changes detected from current live data.</div>`;
                    }
                }
            }

            container.innerHTML += `
            <div class="card-custom shadow-sm p-4 border-start border-4 ${isUpdate ? 'border-warning' : 'border-primary'}">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <span class="badge ${isUpdate ? 'bg-warning text-dark' : 'bg-primary'} mb-2">${req.request_type}</span>
                        <h5 class="fw-bold mb-0">${req.name}</h5>
                        <div class="small text-muted">${req.programme} | ${req.department} | ${req.start_year}</div>
                    </div>
                    <div>
                        <button class="btn btn-success btn-sm me-2 btn-approve" data-id="${req.request_id}"><i class="fas fa-check"></i> Approve</button>
                        <button class="btn btn-danger btn-sm btn-reject" data-id="${req.request_id}"><i class="fas fa-times"></i> Reject</button>
                    </div>
                </div>
                ${detailsHtml}
            </div>`;
        });

        document.querySelectorAll('.btn-approve').forEach(btn => btn.addEventListener('click', (e) => handleQueueAction(e.target.dataset.id || e.target.closest('button').dataset.id, 'approve')));
        document.querySelectorAll('.btn-reject').forEach(btn => btn.addEventListener('click', (e) => handleQueueAction(e.target.dataset.id || e.target.closest('button').dataset.id, 'reject')));
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

async function handleQueueAction(requestId, action) {
    if (!confirm(`Are you sure you want to ${action} this request?`)) return;
    try {
        await fetch(`/api/admin/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id: requestId }) });
        await fetchDatabase(); 
        await fetchQueue();    
    } catch (error) { alert(error.message); }
}

async function fetchDatabase() {
    try {
        allStudents = await getAlumni();
        applyFilters();
    } catch (error) {
        document.getElementById('dbContainer').innerHTML = `<tr><td colspan="5" class="text-danger">Failed to load DB</td></tr>`;
    }
}

function applyFilters() {
    const term = document.getElementById('adminSearch').value.toLowerCase();
    const prog = document.getElementById('adminProg').value;
    const dept = document.getElementById('adminDept').value;
    const start = document.getElementById('adminStart').value;

    const filtered = allStudents.filter(s => {
        if (prog && s.programme !== prog) return false;
        if (dept && s.department !== dept) return false;
        if (start && s.start_year.toString() !== start) return false;
        if (term) {
            const content = [s.name, s.department, s.current_position, s.research_interests].join(' ').toLowerCase();
            if (!content.includes(term)) return false;
        }
        return true;
    });
    renderDatabase(filtered);
}

function renderDatabase(students) {
    const container = document.getElementById('dbContainer');
    container.innerHTML = '';

    students.forEach(s => {
        let endStr = s.end_year ? `-${s.end_year.toString().slice(-2)}` : "";
        let yearStr = `${s.start_year}${endStr}`;

        container.innerHTML += `
        <tr>
            <td class="fw-semibold text-dark">${s.name}</td>
            <td class="small">${s.programme} | ${yearStr} | <span class="badge bg-light text-dark border border-secondary">${s.department}</span></td>
            <td class="small text-muted">${s.permanent_email}</td>
            <td class="small">${s.current_position || '-'}</td>
            <td class="text-end">
                <a href="profile.html?id=${s.id}" target="_blank" class="btn btn-sm btn-outline-secondary"><i class="fas fa-external-link-alt"></i></a>
                <button class="btn btn-sm btn-outline-primary ms-1 btn-edit-user" data-id="${s.id}"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger ms-1 btn-delete-user" data-id="${s.id}"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    });

    document.querySelectorAll('.btn-delete-user').forEach(btn => btn.addEventListener('click', deleteUser));
    document.querySelectorAll('.btn-edit-user').forEach(btn => btn.addEventListener('click', openEditModal));
}

['adminSearch', 'adminProg', 'adminDept', 'adminStart'].forEach(id => {
    document.getElementById(id).addEventListener(id === 'adminSearch' ? 'input' : 'change', applyFilters);
});

document.getElementById('btnResetFilters').addEventListener('click', () => {
    ['adminSearch', 'adminProg', 'adminDept', 'adminStart'].forEach(id => document.getElementById(id).value = "");
    applyFilters();
});

document.getElementById('btnAddUser').addEventListener('click', () => {
    document.getElementById('modalTitle').innerText = "Add New User";
    document.getElementById('mId').value = "";
    modalFields.forEach(id => document.getElementById(id).value = "");
    
    const oldPreview = document.getElementById('successPreviewDiv');
    if (oldPreview) oldPreview.remove();
    if (fileInput) fileInput.classList.remove('d-none');
    
    userModal.show();
});

function openEditModal(e) {
    const id = e.target.dataset.id || e.target.closest('button').dataset.id;
    const s = allStudents.find(user => user.id === id);
    if (!s) return;

    document.getElementById('modalTitle').innerText = "Edit User: " + s.name;
    document.getElementById('mId').value = s.id;
    
    document.getElementById('mRoll').value = s.roll_number || '';
    document.getElementById('mName').value = s.name;
    document.getElementById('mPermEmail').value = s.permanent_email;
    document.getElementById('mProg').value = s.programme;
    document.getElementById('mDept').value = s.department;
    document.getElementById('mStart').value = s.start_year;
    document.getElementById('mEnd').value = s.end_year;
    document.getElementById('mPosition').value = s.current_position || '';
    document.getElementById('mInstitute').value = s.current_institute || '';
    document.getElementById('mSupervisor').value = s.supervisor || '';
    document.getElementById('mNiserEmail').value = s.niser_email || '';
    document.getElementById('mProfEmail').value = s.professional_email || '';
    document.getElementById('mPhone').value = s.phone_number || '';
    document.getElementById('mOtherEmails').value = s.other_emails || '';
    document.getElementById('mSocial').value = s.social_media_links || '';
    document.getElementById('mInterests').value = s.research_interests || '';
    document.getElementById('mCareer').value = s.career_path || '';
    document.getElementById('mFuture').value = s.future_plans || '';
    document.getElementById('mComments').value = s.comments_for_batch || '';
    document.getElementById('mInfo').value = s.additional_info || '';
    
    // Set Photo Preview if exists
    document.getElementById('mPhoto').value = s.photo_url || '';
    const oldPreview = document.getElementById('successPreviewDiv');
    if (oldPreview) oldPreview.remove();
    if (fileInput) fileInput.classList.remove('d-none');
    
    if (s.photo_url) {
        if (fileInput) fileInput.classList.add('d-none');
        document.getElementById('photoPreviewContainer').insertAdjacentHTML('beforeend', `
            <div id="successPreviewDiv" class="d-flex align-items-center gap-3">
                <img src="${s.photo_url}" class="rounded-circle shadow-sm" style="width: 70px; height: 70px; object-fit: cover; border: 3px solid white;">
                <div class="text-muted small">Current Photo</div>
                <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="document.getElementById('mPhoto').value=''; document.getElementById('successPreviewDiv').remove(); document.getElementById('inFile').classList.remove('d-none');"><i class="fas fa-trash"></i></button>
            </div>
        `);
    }

    userModal.show();
}

document.getElementById('btnSaveUser').addEventListener('click', async () => {
    const btn = document.getElementById('btnSaveUser');
    btn.disabled = true;
    btn.innerText = "Saving...";

    const payload = {
        id: document.getElementById('mId').value || null,
        roll_number: document.getElementById('mRoll').value || null,
        name: document.getElementById('mName').value,
        permanent_email: document.getElementById('mPermEmail').value,
        programme: document.getElementById('mProg').value,
        department: document.getElementById('mDept').value,
        start_year: parseInt(document.getElementById('mStart').value),
        end_year: parseInt(document.getElementById('mEnd').value),
        current_position: document.getElementById('mPosition').value || null,
        current_institute: document.getElementById('mInstitute').value || null,
        supervisor: document.getElementById('mSupervisor').value || null,
        niser_email: document.getElementById('mNiserEmail').value || null,
        professional_email: document.getElementById('mProfEmail').value || null,
        phone_number: document.getElementById('mPhone').value || null,
        other_emails: document.getElementById('mOtherEmails').value || null,
        social_media_links: document.getElementById('mSocial').value || null,
        research_interests: document.getElementById('mInterests').value || null,
        career_path: document.getElementById('mCareer').value || null,
        future_plans: document.getElementById('mFuture').value || null,
        photo_url: document.getElementById('mPhoto').value || null,
        comments_for_batch: document.getElementById('mComments').value || null,
        additional_info: document.getElementById('mInfo').value || null
    };

    if (!payload.name || !payload.programme || !payload.start_year || !payload.end_year || !payload.permanent_email) {
        alert("Please fill all required fields!");
        btn.disabled = false;
        btn.innerText = "Save User Data";
        return;
    }

    try {
        await fetch('/api/admin/save-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        userModal.hide();
        await fetchDatabase();
    } catch (e) { alert("Error: " + e.message); }
    
    btn.disabled = false;
    btn.innerText = "Save User Data";
});

async function deleteUser(e) {
    const id = e.target.dataset.id || e.target.closest('button').dataset.id;
    if (!confirm('WARNING: Permanently delete this user?')) return;
    try {
        await fetch(`/api/admin/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ student_id: id }) });
        await fetchDatabase();
    } catch (e) { alert(e.message); }
}

// --- R2 GARBAGE COLLECTION ---
document.getElementById('btnCleanup').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to run the storage cleanup? This will permanently delete any profile pictures that are not attached to a live user or a pending request.')) return;
    
    const btn = document.getElementById('btnCleanup');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Cleaning...`;

    try {
        const response = await fetch('/api/admin/cleanup-photos', { method: 'POST' });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        alert(`Cleanup complete! Successfully deleted ${data.deletedCount} orphaned image(s) from the server.`);
    } catch (error) {
        alert("Cleanup failed: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

// --- DM MESSAGES LOGIC ---
async function fetchMessages() {
    const container = document.getElementById('messagesContainer');
    try {
        const response = await fetch('/api/admin/messages');
        const messages = await response.json();

        if (messages.length === 0) {
            container.innerHTML = `<div class="card-custom p-5 text-center text-muted border border-dashed"><i class="fas fa-envelope-open fs-2 text-muted mb-3"></i><br><h6>No unread messages</h6></div>`;
            return;
        }

        container.innerHTML = '';
        messages.forEach(msg => {
            const date = new Date(msg.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
            container.innerHTML += `
            <div class="card-custom shadow-sm p-4 border-start border-4 border-info">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h6 class="fw-bold mb-1">${msg.name} <span class="badge bg-light text-dark border ms-2">${msg.batch}</span></h6>
                        <div class="small text-muted"><i class="fas fa-clock me-1"></i> ${date}</div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger btn-delete-msg" data-id="${msg.id}"><i class="fas fa-trash"></i></button>
                </div>
                <div class="p-3 bg-white border rounded text-dark" style="white-space: pre-wrap; font-size: 0.95rem;">${msg.content}</div>
            </div>`;
        });

        document.querySelectorAll('.btn-delete-msg').forEach(btn => btn.addEventListener('click', deleteMessage));
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

async function deleteMessage(e) {
    const id = e.target.closest('button').dataset.id;
    if (!confirm('Are you sure you want to permanently delete this message?')) return;
    try {
        await fetch(`/api/admin/delete-message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        await fetchMessages();
    } catch (e) { alert(e.message); }
}