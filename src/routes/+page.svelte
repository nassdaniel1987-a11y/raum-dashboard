<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Canvas from '$lib/components/Canvas.svelte';
	import AdminToolbar from '$lib/components/AdminToolbar.svelte';
</script>

<div class="dashboard">
	<Header />
	<Canvas />
	<AdminToolbar />
</div>

<style>
	.dashboard {
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}
</style>
