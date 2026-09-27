<script>
  import { onMount } from 'svelte';
  import DatabaseExplorer from './components/DatabaseExplorer.svelte';

  let dbPath = '';
  let isLoading = true;
  let error = null;

  onMount(async () => {
    try {
      // Get the app data directory and set default DB path
      const { appDataDir } = await import('@tauri-apps/api/path');
      dbPath = await appDataDir();
      dbPath = `${dbPath}/database.db`;
      isLoading = false;
    } catch (e) {
      error = `Failed to initialize: ${e.message}`;
      isLoading = false;
    }
  });
</script>

<main class="app-container">
  <header class="app-header">
    <h1>OpenAccess</h1>
    <p class="subtitle">A modern database manager</p>
  </header>

  {#if isLoading}
    <div class="loading">Loading...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <DatabaseExplorer dbPath={dbPath} />
  {/if}
</main>

<style>
  .app-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border-color);
  }

  .app-header h1 {
    color: var(--primary-color);
    margin-bottom: 5px;
  }

  .subtitle {
    color: var(--text-secondary);
    font-size: 1.1rem;
  }

  .loading, .error {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    font-size: 1.2rem;
  }

  .error {
    color: var(--error-color);
  }
</style>