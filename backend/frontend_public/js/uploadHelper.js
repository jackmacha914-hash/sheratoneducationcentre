// uploadHelper.js
// This script automatically updates all elements with `data-upload` using getResourceUrl()

(function () {
    // Ensure getResourceUrl exists
    if (typeof getResourceUrl !== 'function') {
        console.error('getResourceUrl() not found. Make sure config.js is loaded first.');
        return;
    }

    // Update all <img> tags
    const imgElements = document.querySelectorAll('img[data-upload]');
    imgElements.forEach(img => {
        const path = img.getAttribute('data-upload');
        if (path) {
            img.src = getResourceUrl(path);
        }
    });

    // Update all <a> tags
    const linkElements = document.querySelectorAll('a[data-upload]');
    linkElements.forEach(link => {
        const path = link.getAttribute('data-upload');
        if (path) {
            link.href = getResourceUrl(path);
        }
    });

    // Update background images
    const bgElements = document.querySelectorAll('[data-upload-bg]');
    bgElements.forEach(el => {
        const path = el.getAttribute('data-upload-bg');
        if (path) {
            el.style.backgroundImage = `url('${getResourceUrl(path)}')`;
        }
    });

})();
