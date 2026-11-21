
(() => {
    'use strict';

    const MANIFEST = 'https://ik.imagekit.io/vd0mhfjkhi/Stella-Wedding/gallery.json';

    const fallback = {
        eventName: "Stella's Wedding",
        eventDate: '',
        originals: [],
        prints: []
    };

    const grid = document.getElementById('photo-grid');
    const status = document.getElementById('gallery-status');
    const tabs = [...document.querySelectorAll('.tab')];
    const box = document.getElementById('lightbox');
    const image = document.getElementById('viewer-image');
    const caption = document.getElementById('caption');

    let data = fallback;
    let kind = 'originals';
    let photos = [];
    let index = 0;
    let focusBefore = null;

    function urlOf(item) {
        return typeof item === 'string'
            ? item
            : (item && (item.url || item.src)) || '';
    }

    function render() {
        photos = (Array.isArray(data[kind]) ? data[kind] : [])
            .map(urlOf)
            .filter(url => /^https:\/\//i.test(url));

        document.getElementById('event-title').textContent =
            data.eventName || 'Your Event';

        document.getElementById('event-date').textContent =
            data.eventDate || '';

        document.getElementById('originals-count').textContent =
            Array.isArray(data.originals)
                ? `(${data.originals.length})`
                : '';

        document.getElementById('prints-count').textContent =
            Array.isArray(data.prints)
                ? `(${data.prints.length})`
                : '';

        tabs.forEach(tab => {
            tab.setAttribute(
                'aria-selected',
                String(tab.dataset.kind === kind)
            );
        });

        grid.setAttribute('aria-labelledby', `tab-${kind}`);
        grid.replaceChildren();

        status.textContent = photos.length
            ? `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`
            : status.dataset.error || '';

        if (!photos.length) {
            const empty = document.createElement('div');
            empty.className = 'empty';
            empty.innerHTML = `
                <div class="empty-symbol" aria-hidden="true">✳</div>
                <h2>Your memories are on their way</h2>
                <p>There are no photos here just yet. Please check back soon.</p>
            `;
            grid.append(empty);
            return;
        }

        photos.forEach((url, i) => {
            const button = document.createElement('button');
            button.className = 'photo';
            button.type = 'button';
            button.setAttribute(
                'aria-label',
                `View ${kind === 'prints' ? 'print' : 'photo'} ${i + 1}`
            );

            const img = document.createElement('img');
            img.src = url;
            img.alt = `${data.eventName || 'Event'} ${kind === 'prints' ? 'print' : 'photo'} ${i + 1}`;
            img.loading = 'lazy';
            img.decoding = 'async';

            img.addEventListener('load', () => {
                button.classList.add('loaded');
            }, { once: true });

            img.addEventListener('error', () => {
                button.classList.add('failed');
            }, { once: true });

            button.append(img);
            button.addEventListener('click', () => open(i));
            grid.append(button);
        });
    }

    function show(i) {
        index = (i + photos.length) % photos.length;

        image.classList.remove('ready');
        image.alt = `${data.eventName || 'Event'} ${kind === 'prints' ? 'print' : 'photo'} ${index + 1}`;

        image.onload = () => image.classList.add('ready');
        image.onerror = () => image.classList.remove('ready');

        image.src = photos[index];
        caption.textContent = `${index + 1} of ${photos.length}`;
    }

    function open(i) {
        if (!photos.length) return;

        focusBefore = document.activeElement;

        box.classList.add('open');
        box.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        show(i);
        document.getElementById('close').focus();
    }

    function close() {
        box.classList.remove('open');
        box.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';

        image.removeAttribute('src');

        if (focusBefore) focusBefore.focus();
    }

    // Originals and Prints tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            kind = tab.dataset.kind;
            status.dataset.error = '';
            render();
        });
    });

    // Lightbox controls
    document.getElementById('close').addEventListener('click', close);

    document.getElementById('prev').addEventListener('click', () => {
        show(index - 1);
    });

    document.getElementById('next').addEventListener('click', () => {
        show(index + 1);
    });

    box.addEventListener('click', event => {
        if (event.target === box) close();
    });

    // Keyboard controls
    document.addEventListener('keydown', event => {
        if (!box.classList.contains('open')) return;

        if (event.key === 'Escape') close();
        if (event.key === 'ArrowLeft') show(index - 1);
        if (event.key === 'ArrowRight') show(index + 1);
    });

    // Photo download
    document.getElementById('download').addEventListener('click', async () => {
        const src = photos[index];
        if (!src) return;

        const link = document.createElement('a');
        link.rel = 'noopener';

        link.download =
            decodeURIComponent(src.split('/').pop().split('?')[0]) ||
            `FlipBooth-photo-${index + 1}`;

        try {
            const response = await fetch(src, { mode: 'cors' });

            if (!response.ok) throw Error();

            link.href = URL.createObjectURL(await response.blob());
            link.click();

            setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        } catch {
            link.href = src;
            link.target = '_blank';
            link.click();
        }
    });

    // Load gallery manifest
    async function load() {
        try {
            const response = await fetch(
                `${MANIFEST}?t=${Date.now()}`,
                { cache: 'no-store' }
            );

            if (!response.ok) throw Error();

            data = {
                ...fallback,
                ...await response.json()
            };
        } catch (error) {
            console.error('Gallery manifest could not be loaded:', error);
            data = fallback;
            status.dataset.error = 'Sample gallery · add gallery.json';
        }

        render();
    }

    load();

})();
