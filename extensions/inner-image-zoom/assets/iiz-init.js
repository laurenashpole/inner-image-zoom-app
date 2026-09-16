(function () {
  const GALLERY_SELECTORS = [
    'media-gallery img',
    '.product__media img',
    '.product__media-item img',
    '[data-product-media] img',
    '.product-media-container img',
    '.product-media__image'
  ].join(', ');

  const THUMBNAIL_SELECTORS =
    '.thumbnail-list, .product__media-list--thumbnails, [data-thumbnail], .product-media-modal__thumbnail-list, .dialog-thumbnails-list, .slideshow-controls__thumbnails';

  const NON_IMAGE_MEDIA_SELECTORS = [
    '.media-type-video',
    '.media-type-external_video',
    '.media-type-model',
    '.product-media-container--video',
    '.product-media-container--external_video',
    '.product-media-container--model',
    'deferred-media',
    'product-model'
  ].join(', ');

  const GALLERY_NODE_SELECTOR =
    'img, picture, .product-media-container, .product-media, slideshow-slide, .product-media__image';

  const OBSERVER_TARGETS =
    'media-gallery, .media-gallery, .product__media-wrapper, .product__media, [data-product-media]';

  let instances = [];
  let debounceTimer;
  let observer;
  let isUpdating = false;

  function isProductPage() {
    return (
      /\/products\//.test(window.location.pathname) ||
      !!document.querySelector('media-gallery, .product__media, [data-product-id]')
    );
  }

  function isImageMedia(img) {
    if (img.classList.contains('deferred-media__poster-image')) {
      return false;
    }

    return !img.closest(NON_IMAGE_MEDIA_SELECTORS);
  }

  function isGalleryNode(node) {
    if (!(node instanceof Element)) {
      return false;
    }

    return (
      node.matches(GALLERY_NODE_SELECTOR) ||
      !!node.querySelector(GALLERY_NODE_SELECTOR)
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

      if (img.classList.contains('iiz__zoom-img')) {
        return false;
      }

      if (!isImageMedia(img)) {
        return false;
      }

      return !!(img.currentSrc || img.src);
    });
  }

  function onGalleryUpdate(event) {
    const { promise } = event;

    if (promise?.then) {
      promise
        .then(() => debouncedInit())
        .catch((error) => {
          if (error?.name !== 'AbortError') {
            debouncedInit();
          }
        });
      return;
    }

    debouncedInit();
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

  function disconnectObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function connectObserver() {
    disconnectObserver();

    const target = document.querySelector(OBSERVER_TARGETS);

    if (!target) {
      return;
    }

    observer = new MutationObserver((mutations) => {
      if (isUpdating || !shouldInit(mutations)) {
        return;
      }

      debouncedInit();
    });

    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset']
    });
  }

  function shouldInit(mutations) {
    if (instances.some((instance) => instance.isZoomed)) {
      return false;
    }

    if (!mutations?.length) {
      return true;
    }

    return mutations.some((mutation) => {
      const target = mutation.target;

      if (!(target instanceof Element)) {
        return false;
      }

      if (mutation.type === 'attributes') {
        if (mutation.attributeName !== 'src' && mutation.attributeName !== 'srcset') {
          return false;
        }

        if (target.tagName !== 'IMG' || target.classList.contains('iiz__zoom-img')) {
          return false;
        }

        return true;
      }

      if (mutation.type === 'childList') {
        if (target.classList.contains('iiz')) {
          return false;
        }

        const nodes = [...mutation.addedNodes, ...mutation.removedNodes];

        return nodes.some(isGalleryNode);
      }

      return false;
    });
  }

  function debouncedInit() {
    if (isUpdating || !shouldInit()) {
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(init, 200);
  }

  function initInstance(el, img, config) {
    const InnerImageZoom = window.InnerImageZoom;

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
    if (isUpdating) {
      return;
    }

    isUpdating = true;
    disconnectObserver();

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

    isUpdating = false;
    connectObserver();
  }

  function initEvents() {
    ['variant:change', 'shopify:product:select', 'shopify:section:load'].forEach((eventName) => {
      document.addEventListener(eventName, onGalleryUpdate);
    });
  }

  function bootstrap() {
    if (!isProductPage()) {
      return;
    }

    init();
    initEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
