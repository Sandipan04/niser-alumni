import { getAlumni } from './api.js';

let allStudents = []; 

// 1. Populate Filter Dropdowns
const startSelect = document.getElementById('filterStart');
const endSelect = document.getElementById('filterEnd');
const currentYear = new Date().getFullYear();

for (let y = currentYear + 1; y >= 2007; y--) {
    if (startSelect) startSelect.add(new Option(y, y));
    if (endSelect) endSelect.add(new Option(y, y));
}

// 2. Load Data from Cloudflare API
async function loadAlumni() {
    const container = document.getElementById('alumni-container');
    const sidebar = document.getElementById('sidebar-nav');
    
    try {
        const students = await getAlumni();

        if (!students || students.length === 0) {
            container.innerHTML = `<div class="text-center py-5 text-muted">No records found.</div>`;
            sidebar.innerHTML = '<div class="text-muted small p-3">Directory empty</div>';
            return;
        }

        allStudents = students;
        applyFilters();

    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="alert alert-danger m-5">Error loading data. Please try again later.</div>`;
    }
}

// 3. Smart Fuzzy Match
function isFuzzyMatch(text, query) {
    if (!text) return false;
    const cleanText = text.toLowerCase().replace(/\./g, ' ');
    const cleanQuery = query.toLowerCase().replace(/\./g, ' ');
    const textTokens = cleanText.split(/\s+/);
    const queryTokens = cleanQuery.split(/\s+/);
    return queryTokens.every(qToken => textTokens.some(tToken => tToken.includes(qToken)));
}

// 4. Apply Filters
function applyFilters() {
    const term = document.getElementById('searchInput')?.value.trim() || '';
    const prog = document.getElementById('filterProg')?.value || '';
    const dept = document.getElementById('filterDept')?.value || '';
    const start = document.getElementById('filterStart')?.value || '';
    const end = document.getElementById('filterEnd')?.value || '';

    let filtered = allStudents.filter(s => {
        if (prog && s.programme !== prog) return false;
        if (dept && s.department !== dept) return false;
        if (start && s.start_year.toString() !== start) return false;
        if (end && s.end_year && s.end_year.toString() !== end) return false;

        if (term) {
            const searchable = [s.name, s.department, s.current_position, s.current_institute, s.research_interests].join(' ');
            if (!isFuzzyMatch(searchable, term)) return false;
        }
        return true;
    });

    renderGroupedTable(filtered);
}

// 5. Render Grouped Grid Boxes
function renderGroupedTable(students) {
    const container = document.getElementById('alumni-container');
    const sidebar = document.getElementById('sidebar-nav');
    container.innerHTML = '';
    sidebar.innerHTML = '';

    if (students.length === 0) {
        container.innerHTML = `<div class="text-center py-5 text-muted">No matching alumni found.</div>`;
        return;
    }

    students.sort((a, b) => {
        if (b.start_year !== a.start_year) return b.start_year - a.start_year;
        if (a.programme !== b.programme) return a.programme.localeCompare(b.programme);
        if (a.department !== b.department) return a.department.localeCompare(b.department);
        return a.name.localeCompare(b.name);
    });

    const grouped = {};
    students.forEach(s => {
        let endStr = s.end_year ? `-${s.end_year.toString().slice(-2)}` : "-Present";
        const batchTitle = `${s.programme} ${s.start_year}${endStr}`; 
        const safeBatchId = "batch-" + batchTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const deptKey = s.department || "Other";

        if (!grouped[batchTitle]) {
            grouped[batchTitle] = { id: safeBatchId, title: batchTitle, depts: {} };
        }
        if (!grouped[batchTitle].depts[deptKey]) {
            grouped[batchTitle].depts[deptKey] = [];
        }
        grouped[batchTitle].depts[deptKey].push(s);
    });

    let mainHtml = '';
    let sidebarHtml = '<div class="accordion accordion-flush" id="sidebarAccordion">';

    const sortedBatches = Object.keys(grouped);

    sortedBatches.forEach((batchKey, batchIndex) => {
        const group = grouped[batchKey];
        const sortedDepts = Object.keys(group.depts).sort();

        let deptLinksHtml = '';
        sortedDepts.forEach(deptName => {
            const safeDeptId = `${group.id}-${deptName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
            deptLinksHtml += `<a href="#${safeDeptId}" class="nav-link text-muted py-1 ps-4 sidebar-link small hover-primary text-decoration-none" style="transition: 0.2s;"><i class="fas fa-angle-right me-2" style="font-size: 0.7rem;"></i>${deptName}</a>`;
        });

        const isFirst = batchIndex === 0;
        
        sidebarHtml += `
            <div class="accordion-item bg-transparent border-0 mb-1">
                <h2 class="accordion-header">
                    <button class="accordion-button ${isFirst ? '' : 'collapsed'} bg-transparent shadow-none py-2 text-dark fw-medium px-2" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${group.id}" style="font-size: 0.9rem;">
                        ${group.title}
                    </button>
                </h2>
                <div id="collapse-${group.id}" class="accordion-collapse collapse ${isFirst ? 'show' : ''}" data-bs-parent="#sidebarAccordion">
                    <div class="accordion-body p-0 pb-2">
                        ${deptLinksHtml}
                    </div>
                </div>
            </div>
        `;

        sortedDepts.forEach(deptName => {
            const deptStudents = group.depts[deptName];
            const safeDeptId = `${group.id}-${deptName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
            
            let rowsHtml = '';
            deptStudents.forEach((s, index) => {
                const borderClass = (index === deptStudents.length - 1) ? '' : 'border-bottom';

                let avatarHtml = '';
                if (s.photo_url) {
                    avatarHtml = `<img src="${s.photo_url}" class="rounded-circle shadow-sm flex-shrink-0" style="width: 55px; height: 55px; object-fit: cover; border: 2px solid white;">`;
                } else {
                    avatarHtml = `<div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow-sm flex-shrink-0" style="width: 55px; height: 55px; font-size: 1.5rem; font-weight: bold; border: 2px solid white;">${s.name.charAt(0)}</div>`;
                }

                let contactHtml = '';
                const btnClass = "btn btn-sm border rounded-circle hover-primary transition-hover d-flex align-items-center justify-content-center bg-light text-decoration-none";
                const btnStyle = "width: 36px; height: 36px;";

                if (s.permanent_email) contactHtml += `<a href="mailto:${s.permanent_email}" class="${btnClass}" style="${btnStyle}" data-bs-toggle="tooltip" title="Personal Email"><i class="fas fa-envelope text-secondary"></i></a>`;
                if (s.niser_email) contactHtml += `<a href="mailto:${s.niser_email}" class="${btnClass}" style="${btnStyle}" data-bs-toggle="tooltip" title="NISER Email"><i class="fas fa-university text-secondary"></i></a>`;
                if (s.professional_email) contactHtml += `<a href="mailto:${s.professional_email}" class="${btnClass}" style="${btnStyle}" data-bs-toggle="tooltip" title="Work Email"><i class="fas fa-briefcase text-secondary"></i></a>`;
                if (s.phone_number) contactHtml += `<a href="tel:${s.phone_number}" class="${btnClass}" style="${btnStyle}" data-bs-toggle="tooltip" title="${s.phone_number}"><i class="fas fa-phone text-success"></i></a>`;

                if (s.social_media_links) {
                    const text = s.social_media_links;
                    const urlRegex = /(?:https?:\/\/|www\.)[^\s,]+/ig;
                    const urls = text.match(urlRegex) || [];

                    urls.forEach(link => {
                        let href = link.startsWith('www.') ? 'https://' + link : link;
                        let icon = 'fa-globe'; 
                        let colorClass = 'text-success';
                        
                        if (link.includes('linkedin.com')) { icon = 'fa-linkedin'; colorClass = 'text-primary'; }
                        else if (link.includes('twitter.com') || link.includes('x.com')) { icon = 'fa-twitter'; colorClass = 'text-dark'; }
                        else if (link.includes('github.com')) { icon = 'fa-github'; colorClass = 'text-dark'; }
                        else if (link.includes('instagram.com')) { icon = 'fa-instagram'; colorClass = 'text-danger'; }
                        else if (link.includes('facebook.com')) { icon = 'fa-facebook'; colorClass = 'text-primary'; }
                        
                        contactHtml += `<a href="${href}" target="_blank" class="${btnClass}" style="${btnStyle}" data-bs-toggle="tooltip" title="Social Link"><i class="fab ${icon} ${colorClass}"></i></a>`;
                    });
                }

                rowsHtml += `
                <div class="row align-items-center py-3 px-4 mx-0 ${borderClass}" style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">
                    <div class="col-md-4 col-12 mb-3 mb-md-0 d-flex align-items-center gap-3 ps-0">
                        ${avatarHtml}
                        <div class="text-truncate">
                            <a href="profile.html?id=${s.id}" class="fw-bold text-dark text-decoration-none d-block text-truncate" style="font-size: 1.05rem;">${s.name}</a>
                            <div class="small mt-1"><span class="badge bg-light text-muted border">${s.department}</span></div>
                        </div>
                    </div>
                    <div class="col-md-4 col-12 mb-3 mb-md-0 pe-3">
                        <div class="fw-medium text-dark text-truncate" style="font-size: 0.95rem;">${s.current_position || '<span class="text-muted fst-italic fw-normal">N/A</span>'}</div>
                        <div class="small text-muted mt-1 text-truncate">${s.current_institute || ''}</div>
                    </div>
                    <div class="col-md-4 col-12 pe-0">
                        <div class="d-flex flex-wrap gap-2">
                            ${contactHtml || '<span class="text-muted small fst-italic">No contact info</span>'}
                        </div>
                    </div>
                </div>
                `;
            });

            // Adjusted scroll-margin-top since we are using an internal scrollable div now
            mainHtml += `
            <div id="${safeDeptId}" class="card-custom shadow-sm mb-4 border-0" style="border-radius: 12px; overflow: hidden; scroll-margin-top: 1rem;">
                <div class="bg-white px-4 pt-3 pb-2 border-bottom">
                    <span class="text-primary fw-semibold tracking-wider text-uppercase small d-block mb-1" style="font-size: 0.75rem; letter-spacing: 0.05em;">
                        <i class="fas fa-layer-group me-1 opacity-75"></i> ${group.title}
                    </span>
                    <h4 class="fw-bold mb-1 text-dark" style="font-size: 1.25rem;">
                        <i class="fas fa-building text-muted me-2" style="font-size: 1.1rem;"></i>${deptName} Department
                    </h4>
                </div>
                <div class="bg-white">
                    ${rowsHtml}
                </div>
            </div>
            `;
        });
    });
    
    sidebarHtml += '</div>';

    container.innerHTML = mainHtml;
    sidebar.innerHTML = sidebarHtml;

    // Fixed Scroll Navigation for the internal container
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetEl = document.getElementById(targetId);
            const scrollWrapper = document.getElementById('scroll-wrapper');
            
            if (targetEl && scrollWrapper) {
                // Calculate scroll position relative to the scroll wrapper
                const topPos = targetEl.offsetTop - scrollWrapper.offsetTop;
                scrollWrapper.scrollTo({ top: topPos, behavior: 'smooth' });
                
                if (window.innerWidth < 992 && typeof window.toggleSidebar === 'function') window.toggleSidebar();
            }
        });
    });

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

// 6. Filtering Hooks
['searchInput', 'filterProg', 'filterDept', 'filterStart', 'filterEnd'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(id === 'searchInput' ? 'input' : 'change', applyFilters);
});

if (document.getElementById('btnReset')) {
    document.getElementById('btnReset').addEventListener('click', () => {
        ['searchInput', 'filterProg', 'filterDept', 'filterStart', 'filterEnd'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
        applyFilters();
    });
}

document.addEventListener('click', (e) => {
    if (e.target.closest('#sidebarAccordion .nav-link') || e.target.closest('.brand-title')) {
        if (window.innerWidth < 992 && typeof window.toggleSidebar === 'function') window.toggleSidebar();
    }
});

// DM Form Submission Block
const btnSendUpdate = document.getElementById('btnSendUpdate');
if (btnSendUpdate) {
    btnSendUpdate.addEventListener('click', async () => {
        const name = document.getElementById('msgName').value.trim();
        const batch = document.getElementById('msgBatch').value.trim();
        const content = document.getElementById('msgContent').value.trim();
        const status = document.getElementById('msgStatus');

        if (!name || !content) {
            status.className = "small text-danger mt-2";
            status.innerHTML = "Name and Message are required.";
            return;
        }

        btnSendUpdate.disabled = true;
        btnSendUpdate.innerText = "Sending...";
        status.innerHTML = "";

        try {
            const res = await fetch('/api/dm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, batch, content })
            });

            if (!res.ok) throw new Error("Failed to send");

            status.className = "small text-success mt-2 fw-bold";
            status.innerHTML = "✅ Message sent successfully!";
            
            setTimeout(() => {
                document.getElementById('msgName').value = '';
                document.getElementById('msgBatch').value = '';
                document.getElementById('msgContent').value = '';
                status.innerHTML = '';
                btnSendUpdate.disabled = false;
                btnSendUpdate.innerText = "Send Request";
                
                const modalEl = document.getElementById('updateModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }, 2000);

        } catch (e) {
            status.className = "small text-danger mt-2";
            status.innerHTML = "❌ Failed to send message. Please try again.";
            btnSendUpdate.disabled = false;
            btnSendUpdate.innerText = "Send Request";
        }
    });
}

// Initialize Pipeline
loadAlumni();