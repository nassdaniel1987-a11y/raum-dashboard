<script lang="ts">
	import { scale, fade } from 'svelte/transition';

	// Svelte 5 Props Syntax
	let { 
		title = 'Bestätigung',
		message,
		confirmText = 'Bestätigen',
		cancelText = 'Abbrechen',
		type = 'warning',
		onConfirm,
		onCancel
	} = $props<{
		title?: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		type?: 'warning' | 'danger' | 'info';
		onConfirm: () => void;
		onCancel: () => void;
	}>();

	const typeStyles = {
		warning: {
			icon: '⚠️',
			confirmBg: 'rgba(251, 146, 60, 0.9)',
			confirmHover: 'rgba(251, 146, 60, 1)'
		},
		danger: {
			icon: '🗑️',
			confirmBg: 'rgba(239, 68, 68, 0.9)',
			confirmHover: 'rgba(239, 68, 68, 1)'
		},
		info: {
			icon: 'ℹ️',
			confirmBg: 'rgba(59, 130, 246, 0.9)',
			confirmHover: 'rgba(59, 130, 246, 1)'
		}
	};
</script>

<div
	class="confirm-backdrop"
	onclick={onCancel}
	transition:fade={{ duration: 200 }}
	role="dialog"
	aria-modal="true"
>
	<div
		class="confirm-dialog"
		onclick={(e) => e.stopPropagation()}
		transition:scale={{ duration: 300, start: 0.9 }}
		role="document"
	>
		<div class="confirm-icon">{typeStyles[type].icon}</div>
		<h2 class="confirm-title">{title}</h2>
		<p class="confirm-message">{message}</p>
		
		<div class="confirm-buttons">
			<button class="btn-cancel" onclick={onCancel}>
				{cancelText}
			</button>
			<button
				class="btn-confirm"
				style="
					background: {typeStyles[type].confirmBg};
				"
				onmouseenter={(e) => e.currentTarget.style.background = typeStyles[type].confirmHover}
				onmouseleave={(e) => e.currentTarget.style.background = typeStyles[type].confirmBg}
				onclick={onConfirm}
			>
				{confirmText}
			</button>
		</div>
	</div>
</div>

<style>
	.confirm-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 20px;
	}

	.confirm-dialog {
		background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
		border-radius: 16px;
		padding: 32px;
		max-width: 450px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		border: 2px solid rgba(255, 255, 255, 0.1);
		text-align: center;
	}

	.confirm-icon {
		font-size: 64px;
		margin-bottom: 16px;
		animation: bounce 0.5s ease-out;
	}

	@keyframes bounce {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.confirm-title {
		font-size: 24px;
		font-weight: 700;
		color: white;
		margin: 0 0 12px 0;
	}

	.confirm-message {
		font-size: 16px;
		color: rgba(255, 255, 255, 0.85);
		margin: 0 0 28px 0;
		line-height: 1.5;
	}

	.confirm-buttons {
		display: flex;
		gap: 12px;
		justify-content: center;
	}

	.btn-cancel,
	.btn-confirm {
		padding: 12px 28px;
		border: none;
		border-radius: 10px;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		min-width: 120px;
	}

	.btn-cancel {
		background: rgba(100, 116, 139, 0.3);
		color: white;
		border: 2px solid rgba(255, 255, 255, 0.2);
	}

	.btn-cancel:hover {
		background: rgba(100, 116, 139, 0.5);
		transform: translateY(-2px);
	}

	.btn-confirm {
		color: white;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.btn-confirm:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
	}

	@media (max-width: 768px) {
		.confirm-dialog {
			padding: 24px;
		}

		.confirm-icon {
			font-size: 48px;
		}

		.confirm-title {
			font-size: 20px;
		}

		.confirm-message {
			font-size: 14px;
		}

		.confirm-buttons {
			flex-direction: column;
		}

		.btn-cancel,
		.btn-confirm {
			width: 100%;
		}
	}
</style>