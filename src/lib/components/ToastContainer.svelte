<script lang="ts">
	import { toasts } from '$lib/stores/toastStore';
	import Toast from './Toast.svelte';
</script>

<div class="toast-container">
	{#each $toasts as toast (toast.id)}
		<Toast
			message={toast.message}
			type={toast.type}
			duration={0}
			onClose={() => toasts.remove(toast.id)}
		/>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 10000;
		pointer-events: none;
	}

	.toast-container :global(.toast) {
		pointer-events: auto;
	}
</style>