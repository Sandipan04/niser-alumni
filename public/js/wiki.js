function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.querySelector('.sidebar-overlay').classList.toggle('active');
}

// Mobile sidebar quick-close fix
document.addEventListener('click', function (e) {
    if (e.target.closest('.wiki-link') && window.innerWidth < 992) {
        toggleSidebar();
    }
});

const contentDiv = document.getElementById('wiki-content');
const links = document.querySelectorAll('.wiki-link');

async function loadMarkdown(file, targetElement) {
    contentDiv.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>`;
    
    try {
        const response = await fetch(`/docs/${file}.md`);
        if (!response.ok) throw new Error("Documentation file not found.");
        
        const markdownText = await response.text();
        
        // Parse and Sanitize Markdown
        const rawHtml = marked.parse(markdownText);
        contentDiv.innerHTML = DOMPurify.sanitize(rawHtml);
        
        // Style tables natively
        contentDiv.querySelectorAll('table').forEach(tbl => {
            tbl.classList.add('table', 'table-bordered', 'mt-3');
        });

        // Update active state in sidebar
        links.forEach(l => l.classList.remove('wiki-active'));
        if (targetElement) {
            targetElement.classList.add('wiki-active');
        }

        // Scroll to top of content
        document.querySelector('.scroll-wrapper').scrollTo(0, 0);

    } catch (err) {
        contentDiv.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-triangle"></i> Error loading document: ${err.message}</div>`;
    }
}

// Event Listeners for Nav
links.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const fileToLoad = e.currentTarget.getAttribute('data-file');
        
        // Update URL parameter without reloading page
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('file', fileToLoad);
        window.history.pushState({}, '', newUrl);

        loadMarkdown(fileToLoad, e.currentTarget);
    });
});

// Initial Load Based on URL parameter or default
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const file = params.get('file') || 'user-guide';
    
    const targetLink = Array.from(links).find(l => l.getAttribute('data-file') === file) || links[0];
    loadMarkdown(file, targetLink);
});