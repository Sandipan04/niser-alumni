import { submitRequest } from './api.js';

// --- INITIALIZE UI ELEMENTS ---
const currentYear = new Date().getFullYear();
const startSelect = document.getElementById('inStart');
const endSelect = document.getElementById('inEnd');

for (let y = currentYear + 1; y >= 2007; y--) {
    if (startSelect) startSelect.add(new Option(y, y));
    if (endSelect) endSelect.add(new Option(y, y));
}

document.getElementById('consentCheck').addEventListener('change', function() {
    document.getElementById('btnSubmit').disabled = !this.checked;
});

// --- PHOTO CROP & UPLOAD LOGIC ---
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
            fileInput.value = ""; 
            return;
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
        cropper = new Cropper(imageToCrop, {
            aspectRatio: 1, 
            viewMode: 1,
            autoCropArea: 1,
        });
    });

    cropModalElement.addEventListener('hidden.bs.modal', () => {
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
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

                // --- THE BUG FIX: Safely store the URL without destroying the input ---
                document.getElementById('inPhoto').value = data.url;
                
                // Hide the file selection box
                if (fileInput) fileInput.classList.add('d-none');
                
                // Remove any previous success previews if they exist
                const oldPreview = document.getElementById('successPreviewDiv');
                if (oldPreview) oldPreview.remove();

                // Append the preview image safely next to the hidden input
                document.getElementById('photoPreviewContainer').insertAdjacentHTML('beforeend', `
                    <div id="successPreviewDiv" class="d-flex align-items-center gap-3">
                        <img src="${data.url}" class="rounded-circle shadow-sm" style="width: 70px; height: 70px; object-fit: cover; border: 3px solid white;">
                        <div class="text-success fw-medium"><i class="fas fa-check-circle me-1"></i> Uploaded Successfully</div>
                    </div>
                `);

                cropModal.hide();
            } catch (err) {
                alert("Upload failed: " + err.message);
            } finally {
                btnCropUpload.disabled = false;
                btnCropUpload.innerHTML = `<i class="fas fa-upload me-1"></i> Crop & Upload`;
            }
        }, 'image/jpeg', 0.8); 
    });
}

// --- FORM SUBMIT LOGIC ---
document.getElementById('btnSubmit').addEventListener('click', async () => {
    const btn = document.getElementById('btnSubmit');
    const status = document.getElementById('statusMsg');

    const roll_number = document.getElementById('inRoll').value.trim();
    const programme = document.getElementById('inProg').value;
    const department = document.getElementById('inDept').value;
    const start_year = document.getElementById('inStart').value;
    const end_year = document.getElementById('inEnd').value;
    const name = document.getElementById('inName').value.trim();
    const permanent_email = document.getElementById('inPermEmail').value.trim();

    if (!programme || !department || !start_year || !end_year || !name || !permanent_email) {
        alert("Please fill all the required fields (*).");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Processing Request...";

    // This will now successfully find the URL because the hidden input wasn't deleted
    let photo_url = document.getElementById('inPhoto') ? document.getElementById('inPhoto').value : ""; 

    const payload = {
        request_type: "JOIN",
        roll_number: roll_number,
        name: name,
        programme: programme,
        department: department,
        start_year: parseInt(start_year),
        end_year: parseInt(end_year),
        supervisor: document.getElementById('inSupervisor').value || null,
        permanent_email: permanent_email,
        niser_email: document.getElementById('inNiserEmail').value || null,
        professional_email: document.getElementById('inProfEmail').value || null,
        other_emails: document.getElementById('inOtherEmails').value || null,
        phone_number: document.getElementById('inPhone').value || null,
        career_path: document.getElementById('inCareer').value || null,
        research_interests: document.getElementById('inInterests').value || null,
        current_position: document.getElementById('inPosition').value || null,
        current_institute: document.getElementById('inInstitute').value || null,
        future_plans: document.getElementById('inFuture').value || null,
        social_media_links: document.getElementById('inSocial').value || null,
        comments_for_batch: document.getElementById('inComments').value || null,
        additional_info: document.getElementById('inInfo').value || null,
        photo_url: photo_url
    };

    try {
        await submitRequest(payload);
        status.innerHTML = `<div class="alert alert-success">✅ Application Sent! An admin will review it shortly.</div>`;
        status.scrollIntoView();
        setTimeout(() => { window.location.href = 'index.html'; }, 3000);
    } catch (e) {
        console.error(e);
        status.innerHTML = `<div class="alert alert-danger">Server Error: ${e.message}</div>`;
        btn.disabled = false;
        btn.innerText = "Submit Application";
    }
});