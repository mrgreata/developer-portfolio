try {
  if (sessionStorage.getItem('greaterlabs-page-transition') === 'reveal') {
    document.documentElement.classList.add('page-transition-pending');
  }
} catch (_) {
  // The page remains usable when session storage is unavailable.
}
