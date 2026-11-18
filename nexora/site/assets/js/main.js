/**
 * NEXORA — Bootstrap
 * Initialises shared components, then the controller matching
 * <body data-page="...">. Load order: data.js → core.js → components.js → pages.js → main.js
 */
(function (window, document) {
  'use strict';
  function boot() {
    var NX = window.NX;
    if (!NX || !window.NX_DATA) return;
    NX.initComponents();
    var page = document.body.getAttribute('data-page');
    if (page && NX.pages[page]) NX.pages[page]();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);
