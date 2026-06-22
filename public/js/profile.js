import { getStudent, submitRequest } from './api.js';

const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('id');

let currentStudentData = null;
let editModal = null;

document.addEventListener('DOMContentLoaded', () => {
    editModal = new bootstrap.Modal(document.getElementById('editModal'));
});

async function loadProfile() {
    const statusContainer = document.getElementById('statusContainer');
    const profileContainer = document.getElementById('profileContainer');

    if (!studentId) {
        statusContainer.innerHTML = `<div class="alert alert-danger">No profile ID provided.</div>`;
        return;
    }

    try {
        const s = await getStudent(studentId);
        currentStudentData = s; 

        statusContainer.classList.add('d-none');
        profileContainer.classList.remove('d-none');

        document.getElementById('pName').innerText = s.name;
        document.getElementById('pPosition').innerText = s.current_position || '';

        const avatarContainer = document.getElementById('pAvatar');
        if (s.photo_url) {
            avatarContainer.innerHTML = `<img src="${s.photo_url}" class="rounded-circle shadow" style="width: 140px; height: 140px; object-fit: cover; border: 4px solid white;">`;
        } else {
            avatarContainer.innerHTML = `<div class="rounded-circle shadow bg-secondary text-white d-flex align-items-center justify-content-center" style="width: 140px; height: 140px; font-size: 3.5rem; border: 4px solid white;">${s.name.charAt(0)}</div>`;
        }

        // --- SMART SOCIAL LINK EXTRACTION ---
        let socialHtml = '';
        if (s.social_media_links) {
            const text = s.social_media_links;
            
            // Regex matches anything starting with http://, https://, or www.
            const urlRegex = /(?:https?:\/\/|www\.)[^\s,]+/ig;
            const urls = text.match(urlRegex) || [];
            
            // Strip the URLs from the text, then clean up any floating commas or extra spaces
            const remainingText = text.replace(urlRegex, '').replace(/^[,\s]+|[,\s]+$/g, '').replace(/,\s*,/g, ',').trim();

            urls.forEach(link => {
                let href = link.startsWith('www.') ? 'https://' + link : link;
                let icon = 'fa-link';
                if (link.includes('linkedin.com')) icon = 'fa-linkedin';
                if (link.includes('twitter.com') || link.includes('x.com')) icon = 'fa-twitter';
                if (link.includes('github.com')) icon = 'fa-github';
                if (link.includes('instagram.com')) icon = 'fa-instagram';
                if (link.includes('facebook.com')) icon = 'fa-facebook';
                
                socialHtml += `<a href="${href}" target="_blank" class="btn btn-outline-secondary btn-sm rounded-circle" data-bs-toggle="tooltip" title="${href}"><i class="fab ${icon}"></i></a>`;
            });
            
            document.getElementById('pSocial').innerHTML = socialHtml;
            
            const textContainer = document.getElementById('pSocialText');
            if (remainingText) {
                textContainer.innerText = remainingText;
                textContainer.classList.remove('d-none');
            } else {
                textContainer.classList.add('d-none');
            }
        } else {
            document.getElementById('pSocial').innerHTML = '';
            document.getElementById('pSocialText').classList.add('d-none');
        }

        document.getElementById('pPermEmail').innerHTML = `<a href="mailto:${s.permanent_email}" class="text-decoration-none">${s.permanent_email}</a>`;
        if (s.niser_email) { document.getElementById('pNiserEmail').innerHTML = `<a href="mailto:${s.niser_email}" class="text-decoration-none text-muted">${s.niser_email}</a>`; } else { document.getElementById('blockNiserEmail').classList.add('d-none'); }
        if (s.professional_email) { document.getElementById('pProfEmail').innerHTML = `<a href="mailto:${s.professional_email}" class="text-decoration-none text-muted">${s.professional_email}</a>`; } else { document.getElementById('blockProfEmail').classList.add('d-none'); }
        if (s.phone_number) { document.getElementById('pPhone').innerText = s.phone_number; } else { document.getElementById('blockPhone').classList.add('d-none'); }
        if (s.last_updated) {
            const dateObj = new Date(s.last_updated);
            document.getElementById('pUpdated').innerHTML = `<i class="fas fa-clock me-1"></i> Updated ${dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
        }

        document.getElementById('pProg').innerText = s.programme || 'N/A';
        document.getElementById('pDept').innerText = s.department || 'N/A';
        let endStr = s.end_year ? ` - ${s.end_year}` : " - Present";
        document.getElementById('pBatch').innerText = `${s.start_year}${endStr}`;
        document.getElementById('pSupervisor').innerText = s.supervisor || 'N/A';
        
        document.getElementById('pInstitute').innerText = s.current_institute || '-';
        document.getElementById('pInterests').innerText = s.research_interests || '-';
        document.getElementById('pPath').innerText = s.career_path || '-';
        if (s.future_plans) { document.getElementById('pPlans').innerText = s.future_plans; } else { document.getElementById('blockFuture').classList.add('d-none'); }

        if (s.comments_for_batch || s.additional_info) {
            document.getElementById('pExtrasCard').classList.remove('d-none');
            if (s.comments_for_batch) {
                document.getElementById('pCommentsSection').classList.remove('d-none');
                document.getElementById('pComments').innerText = `"${s.comments_for_batch}"`;
            }
            if (s.additional_info) {
                const addSec = document.getElementById('pAdditionalSection');
                addSec.classList.remove('d-none');
                document.getElementById('pAdditional').innerText = s.additional_info;
                if (s.comments_for_batch) addSec.classList.add('mt-4');
            }
        }

    } catch (error) {
        statusContainer.innerHTML = `<div class="alert alert-danger">Error loading profile: ${error.message}</div>`;
    }
}

// --- PHOTO CROP LOGIC ---
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

                document.getElementById('uPhoto').value = data.url;
                if (fileInput) fileInput.classList.add('d-none');
                
                const oldPreview = document.getElementById('successPreviewDiv');
                if (oldPreview) oldPreview.remove();

                document.getElementById('photoPreviewContainer').insertAdjacentHTML('beforeend', `
                    <div id="successPreviewDiv" class="d-flex align-items-center gap-3">
                        <img src="${data.url}" class="rounded-circle shadow-sm" style="width: 70px; height: 70px; object-fit: cover; border: 3px solid white;">
                        <div class="text-success fw-medium"><i class="fas fa-check-circle me-1"></i> New Photo Ready</div>
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

// --- OPEN EDIT MODAL ---
document.getElementById('btnEdit').addEventListener('click', () => {
    if (!currentStudentData) return;
    
    document.getElementById('uPermEmail').value = currentStudentData.permanent_email || '';
    document.getElementById('uNiserEmail').value = currentStudentData.niser_email || '';
    document.getElementById('uProfEmail').value = currentStudentData.professional_email || '';
    document.getElementById('uPhone').value = currentStudentData.phone_number || '';
    document.getElementById('uOtherEmails').value = currentStudentData.other_emails || '';
    document.getElementById('uSocial').value = currentStudentData.social_media_links || '';
    
    document.getElementById('uPosition').value = currentStudentData.current_position || '';
    document.getElementById('uInstitute').value = currentStudentData.current_institute || '';
    document.getElementById('uSupervisor').value = currentStudentData.supervisor || '';
    document.getElementById('uInterests').value = currentStudentData.research_interests || '';
    document.getElementById('uCareer').value = currentStudentData.career_path || '';
    document.getElementById('uFuture').value = currentStudentData.future_plans || '';
    
    // Set Photo Preview if exists
    document.getElementById('uPhoto').value = currentStudentData.photo_url || '';
    const oldPreview = document.getElementById('successPreviewDiv');
    if (oldPreview) oldPreview.remove();
    if (fileInput) fileInput.classList.remove('d-none');
    
    if (currentStudentData.photo_url) {
        if (fileInput) fileInput.classList.add('d-none');
        document.getElementById('photoPreviewContainer').insertAdjacentHTML('beforeend', `
            <div id="successPreviewDiv" class="d-flex align-items-center gap-3">
                <img src="${currentStudentData.photo_url}" class="rounded-circle shadow-sm" style="width: 70px; height: 70px; object-fit: cover; border: 3px solid white;">
                <div class="text-muted small">Current Photo (Upload new to replace)</div>
                <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="document.getElementById('uPhoto').value=''; document.getElementById('successPreviewDiv').remove(); document.getElementById('inFile').classList.remove('d-none');"><i class="fas fa-trash"></i></button>
            </div>
        `);
    }

    document.getElementById('uComments').value = currentStudentData.comments_for_batch || '';
    document.getElementById('uInfo').value = currentStudentData.additional_info || '';

    document.getElementById('uConsentCheck').checked = false;
    document.getElementById('btnSubmitUpdate').disabled = true;
    document.getElementById('uStatusMsg').innerHTML = '';

    editModal.show();
});

document.getElementById('uConsentCheck').addEventListener('change', function() {
    document.getElementById('btnSubmitUpdate').disabled = !this.checked;
});

document.getElementById('btnSubmitUpdate').addEventListener('click', async () => {
    const btn = document.getElementById('btnSubmitUpdate');
    const status = document.getElementById('uStatusMsg');

    const permEmail = document.getElementById('uPermEmail').value.trim();
    if (!permEmail) { alert("Permanent email is required."); return; }

    btn.disabled = true;
    btn.innerText = "Sending Request...";

    const payload = {
        request_type: "UPDATE",
        target_id: currentStudentData.id,
        name: currentStudentData.name,
        programme: currentStudentData.programme,
        department: currentStudentData.department,
        start_year: currentStudentData.start_year,
        end_year: currentStudentData.end_year,
        
        permanent_email: permEmail,
        niser_email: document.getElementById('uNiserEmail').value || null,
        professional_email: document.getElementById('uProfEmail').value || null,
        phone_number: document.getElementById('uPhone').value || null,
        other_emails: document.getElementById('uOtherEmails').value || null,
        social_media_links: document.getElementById('uSocial').value || null,
        
        current_position: document.getElementById('uPosition').value || null,
        current_institute: document.getElementById('uInstitute').value || null,
        supervisor: document.getElementById('uSupervisor').value || null,
        research_interests: document.getElementById('uInterests').value || null,
        career_path: document.getElementById('uCareer').value || null,
        future_plans: document.getElementById('uFuture').value || null,
        
        photo_url: document.getElementById('uPhoto').value || null,
        comments_for_batch: document.getElementById('uComments').value || null,
        additional_info: document.getElementById('uInfo').value || null
    };

    try {
        await submitRequest(payload);
        status.innerHTML = `<div class="alert alert-success mt-2">✅ Update requested successfully! An admin will review it shortly.</div>`;
        setTimeout(() => { editModal.hide(); btn.innerText = "Submit Update Request"; }, 2500);
    } catch (e) {
        status.innerHTML = `<div class="alert alert-danger mt-2">Server Error: ${e.message}</div>`;
        btn.disabled = false;
        btn.innerText = "Submit Update Request";
    }
});

loadProfile();