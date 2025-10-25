import { writable } from 'svelte/store';

export interface ToastMessage {
	id: string;
	message: string;
	type: 'success' | 'error' | 'info';
	duration?: number;
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
		},
		success: (message: string, duration = 3000) => {
			return createToastStore().show(message, 'success', duration);
		},
		error: (message: string, duration = 4000) => {
			return createToastStore().show(message, 'error', duration);
		},
		info: (message: string, duration = 3000) => {
			return createToastStore().show(message, 'info', duration);
		}
	};
}

export const toasts = createToastStore();