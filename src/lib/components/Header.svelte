<script lang="ts">
	import { currentTime, currentWeekday } from '$lib/stores/appState';
	import { fade } from 'svelte/transition';

	const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

	$: formattedTime = $currentTime.toLocaleTimeString('de-DE', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});

	$: formattedDate = $currentTime.toLocaleDateString('de-DE', {
		day: '2-digit',
		month: 'long',
		year: 'numeric'
	});

	$: weekdayName = weekdayNames[$currentWeekday % 7];
</script>

<header class="dashboard-header" transition:fade>
	<div class="header-left">
		<div class="logo">
			<span class="logo-icon">🏫</span>
			<span class="logo-text">Raum-Dashboard</span>
		</div>
	</div>

	<div class="header-center">
		<div class="weekday">{weekdayName}</div>
		<div class="date">{formattedDate}</div>
	</div>

	<div class="header-right">
		<div class="clock">
			<span class="time">{formattedTime}</span>
		</div>
	</div>
</header>

<style>
	.dashboard-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 100px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 40px;
		z-index: 100;
		backdrop-filter: blur(10px);
	}

	.header-left,
	.header-center,
	.header-right {
		flex: 1;
		display: flex;
		align-items: center;
	}

	.header-left {
		justify-content: flex-start;
	}

	.header-center {
		justify-content: center;
		flex-direction: column;
		gap: 5px;
	}

	.header-right {
		justify-content: flex-end;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 15px;
		color: white;
	}

	.logo-icon {
		font-size: 48px;
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
	}

	.logo-text {
		font-size: 32px;
		font-weight: 800;
		letter-spacing: 1px;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
	}

	.weekday {
		font-size: 36px;
		font-weight: 800;
		color: white;
		text-transform: uppercase;
		letter-spacing: 2px;
		text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.4);
	}

	.date {
		font-size: 20px;
		color: rgba(255, 255, 255, 0.9);
		font-weight: 600;
		text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
	}

	.clock {
		background: rgba(255, 255, 255, 0.2);
		padding: 15px 30px;
		border-radius: 16px;
		backdrop-filter: blur(10px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.time {
		font-size: 42px;
		font-weight: 700;
		color: white;
		font-family: 'Courier New', monospace;
		letter-spacing: 3px;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
	}

	@media (max-width: 1200px) {
		.dashboard-header {
			padding: 0 20px;
		}

		.logo-text {
			font-size: 24px;
		}

		.weekday {
			font-size: 28px;
		}

		.time {
			font-size: 32px;
		}
	}
</style>
