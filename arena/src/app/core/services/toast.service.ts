import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<ToastMessage[]>([]);
  private idCounter = 0;

  success(title: string, message?: string, duration = 4000): void {
    this.show({ type: 'success', title, message, duration });
  }

  error(title: string, message?: string, duration = 6000): void {
    this.show({ type: 'error', title, message, duration });
  }

  warning(title: string, message?: string, duration = 5000): void {
    this.show({ type: 'warning', title, message, duration });
  }

  info(title: string, message?: string, duration = 4000): void {
    this.show({ type: 'info', title, message, duration });
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private show(toast: Omit<ToastMessage, 'id'>): void {
    const id = ++this.idCounter;
    this.toasts.update(list => [...list, { ...toast, id }]);
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => this.dismiss(id), toast.duration);
    }
  }
}
