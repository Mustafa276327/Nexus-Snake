// Nexus Snake - Toast Notifications

export class ToastManager {
  constructor() {
    this.container = document.getElementById('toastContainer');
    this.toasts = [];
    this.maxToasts = 5;
  }

  show(message, type = 'info', duration = 3000) {
    if (!this.container) return;

    // Remove oldest if at max
    if (this.toasts.length >= this.maxToasts) {
      this.remove(this.toasts[0]);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Kapat">✕</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.remove(toast));

    this.container.appendChild(toast);
    this.toasts.push(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto remove
    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }

    return toast;
  }

  remove(toast) {
    if (!this.toasts.includes(toast)) return;

    toast.classList.remove('show');
    toast.classList.add('hide');

    setTimeout(() => {
      toast.remove();
      this.toasts = this.toasts.filter(t => t !== toast);
    }, 300);
  }

  clear() {
    this.toasts.forEach(t => this.remove(t));
  }

  // Convenience methods
  success(message, duration) { return this.show(message, 'success', duration); }
  error(message, duration) { return this.show(message, 'error', duration); }
  warning(message, duration) { return this.show(message, 'warning', duration); }
  info(message, duration) { return this.show(message, 'info', duration); }
}

export const toast = new ToastManager();