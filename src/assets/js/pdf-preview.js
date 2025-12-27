document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('pdfModal');
  const viewer = document.getElementById('pdfViewer');
  const closeBtn = modal.querySelector('.pdf-modal-close');
  const backdrop = modal.querySelector('.pdf-modal-backdrop');

  // Open modal when preview button is clicked
  document.querySelectorAll('.transcript-preview-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pdfUrl = btn.dataset.pdf;
      viewer.src = pdfUrl;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    });
  });

  // Close modal
  function closeModal() {
    modal.hidden = true;
    viewer.src = '';
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) {
      closeModal();
    }
  });
});
