(function () {
  const GALLERY_SELECTORS = [
    'media-gallery img',
    '.product__media img',
    '.product__media-item img',
    '[data-product-media] img',
    '.product-media-container img'
  ].join(', ');

  const THUMBNAIL_SELECTORS =
    '.thumbnail-list, .product__media-list--thumbnails, [data-thumbnail], .product-media-modal__thumbnail-list';

  const OBSERVER_TARGETS = 'media-gallery, .product__media-wrapper, .product__media, [data-product-media]';

  let instances = [];
  let debounceTimer;
  let observer;

  function isProductPage() {
    return (
      /\/products\//.test(window.location.pathname) ||
      !!document.querySelector('media-gallery, .product__media, [data-product-id]')
    );
  }

  function getZoomSrc(img) {
    const src = img.currentSrc || img.src;

    if (!src) {
      return undefined;
    }

    try {
      const url = new URL(src, window.location.origin);
      url.searchParams.set('width', '2048');
      return url.toString();
    } catch {
      return src;
    }
  }

  function getGalleryImages() {
    return Array.from(document.querySelectorAll(GALLERY_SELECTORS)).filter((img) => {
      if (img.closest(THUMBNAIL_SELECTORS)) {
        return false;
      }

      return !!(img.currentSrc || img.src);
    });
  }

  function destroyAll() {
    instances.forEach((instance) => {
      try {
        instance?.uninit?.();
      } catch {
        // Ignore cleanup errors
      }
    });

    instances = [];
  }

  function initInstance(el, img, config) {
    if (typeof InnerImageZoom === 'undefined') {
      return;
    }

    const instance = new InnerImageZoom('', {
      $el: el,
      zoomType: config.zoomType || 'click',
      moveType: config.moveType || 'pan',
      hideHint: config.hideHint === true,
      fullscreenOnMobile: config.fullscreenOnMobile !== false,
      hideCloseButton: config.hideCloseButton === true,
      mobileBreakpoint: config.mobileBreakpoint || 640,
      zoomPreload: config.zoomPreload === true,
      zoomScale: config.zoomScale || 1,
      zoomSrc: getZoomSrc(img)
    });

    if (instance) {
      instances.push(instance);
    }
  }

  function init() {
    const config = window.InnerImageZoomConfig || {};
    const seen = new Set();

    destroyAll();

    getGalleryImages().forEach((img) => {
      const el = img.closest('picture') || img;

      if (seen.has(el)) {
        return;
      }

      seen.add(el);
      initInstance(el, img, config);
    });
  }

  function debouncedInit() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(init, 200);
  }

  function initObservers() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    const target = document.querySelector(OBSERVER_TARGETS);

    if (!target) {
      return;
    }

    observer = new MutationObserver(debouncedInit);

    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset', 'class']
    });
  }

  function initEvents() {
    ['variant:change', 'shopify:section:load'].forEach((eventName) => {
      document.addEventListener(eventName, debouncedInit);
    });
  }

  function bootstrap() {
    if (!isProductPage()) {
      return;
    }

    init();
    initObservers();
    initEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
