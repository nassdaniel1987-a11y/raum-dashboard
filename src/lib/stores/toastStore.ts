import { writable } from 'svelte/store';

export interface ToastMessage {
	id: string;
	message: string;
	type: 'success' | 'error' | 'info';
	duration?: number;
}

export interface ConfirmDialog {
	id: string;
	title?: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	type?: 'warning' | 'danger' | 'info';
	onConfirm: () => void;
	onCancel?: () => void;
}

function createToastStore() {
	const { subscribe, update } = writable<ToastMessage[]>([]);

	return {
		subscribe,
		show: (message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3000) => {
			const id = Math.random().toString(36).substring(7);
			const toast: ToastMessage = { id, message, type, duration };
			
			update(toasts => [...toasts, toast]);
			
			// Auto-remove nach duration
			if (duration > 0) {
				setTimeout(() => {
					update(toasts => toasts.filter(t => t.id !== id));
				}, duration);
			}
			
			return id;
		},
		remove: (id: string) => {
			update(toasts => toasts.filter(t => t.id !== id));
		}
	};
}

function createConfirmStore() {
	const { subscribe, set } = writable<ConfirmDialog | null>(null);

	return {
		subscribe,
		ask: (options: Omit<ConfirmDialog, 'id'>): Promise<boolean> => {
			return new Promise((resolve) => {
				const id = Math.random().toString(36).substring(7);
				const dialog: ConfirmDialog = {
					id,
					title: options.title || 'Bestätigung',
					message: options.message,
					confirmText: options.confirmText || 'Bestätigen',
					cancelText: options.cancelText || 'Abbrechen',
					type: options.type || 'warning',
					onConfirm: () => {
						set(null);
						resolve(true);
					},
					onCancel: () => {
						set(null);
						resolve(false);
					}
				};
				set(dialog);
			});
		},
		close: () => {
			set(null);
		}
	};
}

export const toasts = createToastStore();
export const confirmDialog = createConfirmStore();