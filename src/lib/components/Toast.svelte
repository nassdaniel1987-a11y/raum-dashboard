<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	// Svelte 5 Props Syntax
	let { 
		message = 'Erfolg!',
		type = 'success',
		duration = 3000,
		onClose 
	} = $props<{
		message?: string;
		type?: 'success' | 'error' | 'info';
		duration?: number;
		onClose?: () => void;
	}>();

	// Auto-close nach duration
	if (duration > 0) {
		setTimeout(() => {
			onClose?.();
		}, duration);
	}

	const icons = {
		success: '✓',
		error: '✕',
		info: 'ℹ'
	};

	const colors = {
		success: {
			bg: 'rgba(34, 197, 94, 0.95)',
			border: '#22c55e',
			shadow: 'rgba(34, 197, 94, 0.5)'
		},
		error: {
			bg: 'rgba(239, 68, 68, 0.95)',
			border: '#ef4444',
			shadow: 'rgba(239, 68, 68, 0.5)'
		},
		info: {
			bg: 'rgba(59, 130, 246, 0.95)',
			border: '#3b82f6',
			shadow: 'rgba(59, 130, 246, 0.5)'
		}
	};
</script>

<div
	class="toast"
	style="
		background: {colors[type].bg};
		border-color: {colors[type].border};
		box-shadow: 0 8px 32px {colors[type].shadow}, 0 2px 8px rgba(0, 0, 0, 0.3);
	"
	in:fly={{ y: -50, duration: 400, easing: quintOut }}
	out:fade={{ duration: 200 }}
	role="alert"
>
	<div class="toast-icon">{icons[type]}</div>
	<div class="toast-message">{message}</div>
	{#if onClose}
		<button class="toast-close" onclick={onClose} aria-label="Schließen">✕</button>
	{/if}
</div>

<style>
	.toast {
		position: fixed;
		top: 80px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 10000;
		
		display: flex;
		align-items: center;
		gap: 12px;
		
		padding: 16px 24px;
		border-radius: 12px;
		border: 2px solid;
		
		backdrop-filter: blur(10px);
		
		color: white;
		font-weight: 600;
		font-size: 16px;
		
		min-width: 300px;
		max-width: 500px;
		
		animation: pulse 0.3s ease-out;
	}

	@keyframes pulse {
		0% {
			transform: translateX(-50%) scale(0.95);
		}
		50% {
			transform: translateX(-50%) scale(1.02);
		}
		100% {
			transform: translateX(-50%) scale(1);
		}
	}

	.toast-icon {
		font-size: 24px;
		font-weight: bold;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
	}

	.toast-message {
		flex: 1;
		line-height: 1.4;
	}

	.toast-close {
		background: rgba(255, 255, 255, 0.2);
		border: none;
		color: white;
		font-size: 20px;
		font-weight: bold;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.toast-close:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(1.1);
	}

	@media (max-width: 768px) {
		.toast {
			min-width: auto;
			max-width: calc(100vw - 32px);
			left: 16px;
			right: 16px;
			transform: none;
			font-size: 14px;
		}

		@keyframes pulse {
			0% {
				transform: scale(0.95);
			}
			50% {
				transform: scale(1.02);
			}
			100% {
				transform: scale(1);
			}
		}
	}
</style>