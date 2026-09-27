<script>
  import { onMount } from 'svelte';
  import { getDatabase, getTables, dropTable } from '../lib/database';
  import TableViewer from './TableViewer.svelte';
  import CreateTableModal from './CreateTableModal.svelte';

  export let dbPath;

  let db = null;
  let tables = [];
  let selectedTable = null;
  let isLoading = true;
  let error = null;
  let showCreateTableModal = false;
  let confirmDeleteTable = null;

  onMount(async () => {
    await loadDatabase();
  });

  async function loadDatabase() {
    try {
      isLoading = true;
      error = null;
      db = await getDatabase(dbPath);
      await loadTables();
    } catch (e) {
      error = `Failed to load database: ${e.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function loadTables() {
    try {
      tables = await getTables(db);
    } catch (e) {
      error = `Failed to load tables: ${e.message}`;
    }
  }

  function selectTable(tableName) {
    selectedTable = tableName;
  }

  function openCreateTableModal() {
    showCreateTableModal = true;
  }

  async function handleTableCreated() {
    await loadTables();
    showCreateTableModal = false;
  }

  function confirmDropTable(tableName) {
    confirmDeleteTable = tableName;
  }

  async function dropTableConfirmed() {
    if (!confirmDeleteTable) return;

    try {
      await dropTable(db, confirmDeleteTable);
      await loadTables();
      if (selectedTable === confirmDeleteTable) {
        selectedTable = null;
      }
    } catch (e) {
      error = `Failed to drop table: ${e.message}`;
    } finally {
      confirmDeleteTable = null;
    }
  }

  function cancelDropTable() {
    confirmDeleteTable = null;
  }
</script>

<div class="database-explorer">
  {#if isLoading}
    <div class="loading">Loading database...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <div class="explorer-layout">
      <!-- Sidebar: Tables List -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>Database</h2>
          <button class="btn-primary" on:click={openCreateTableModal}>
            + New Table
          </button>
        </div>

        <div class="table-list">
          {#if tables.length === 0}
            <div class="empty-state">
              <p>No tables found</p>
              <p class="text-muted text-sm">Create your first table to get started</p>
            </div>
          {:else}
            <ul>
              {#each tables as table}
                <li
                  class="table-item {selectedTable === table.name ? 'selected' : ''}"
                  on:click={() => selectTable(table.name)}
                >
                  <span class="table-name">{table.name}</span>
                  <span class="table-type">{table.type}</span>
                  <button
                    class="delete-btn"
                    on:click|stopPropagation={() => confirmDropTable(table.name)}
                    title="Delete table"
                  >
                    ×
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </aside>

      <!-- Main Content: Table Viewer -->
      <main class="main-content">
        {#if selectedTable}
          <TableViewer
            db={db}
            tableName={selectedTable}
            on:back={() => selectedTable = null}
          />
        {:else}
          <div class="welcome-view">
            <h2>Welcome to OpenAccess</h2>
            <p class="text-secondary">Select a table from the sidebar to view its data, or create a new table.</p>
            <div class="quick-actions">
              <button class="btn-primary" on:click={openCreateTableModal}>
                Create New Table
              </button>
            </div>
          </div>
        {/if}
      </main>
    </div>

    <!-- Create Table Modal -->
    {#if showCreateTableModal}
      <CreateTableModal
        db={db}
        on:created={handleTableCreated}
        on:cancel={() => showCreateTableModal = false}
      />
    {/if}

    <!-- Confirm Delete Modal -->
    {#if confirmDeleteTable}
      <div class="modal-overlay" on:click={cancelDropTable}>
        <div class="modal" on:click|stopPropagation>
          <div class="modal-header">
            <h3 class="modal-title">Confirm Delete</h3>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete the table <strong>{confirmDeleteTable}</strong>?</p>
            <p class="text-muted text-sm mt-2">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" on:click={cancelDropTable}>Cancel</button>
            <button class="btn-danger" on:click={dropTableConfirmed}>Delete Table</button>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .database-explorer {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .explorer-layout {
    display: flex;
    flex: 1;
    gap: var(--spacing-lg);
    height: 100%;
  }

  .sidebar {
    width: 280px;
    min-width: 250px;
    background-color: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: var(--spacing-md);
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
  }

  .sidebar-header h2 {
    font-size: 1.125rem;
    margin: 0;
  }

  .table-list {
    flex: 1;
    overflow: auto;
  }

  .table-list ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .table-item {
    display: flex;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color var(--transition-fast);
    gap: var(--spacing-sm);
  }

  .table-item:hover {
    background-color: var(--background-color);
  }

  .table-item.selected {
    background-color: var(--primary-light);
    color: var(--primary-color);
  }

  .table-name {
    flex: 1;
    font-weight: 500;
  }

  .table-type {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .delete-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1.25rem;
    padding: 0 var(--spacing-xs);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: color var(--transition-fast), background-color var(--transition-fast);
  }

  .delete-btn:hover {
    color: var(--error-color);
    background-color: #fee2e2;
  }

  .table-item.selected .delete-btn {
    color: var(--primary-color);
  }

  .table-item.selected .delete-btn:hover {
    background-color: rgba(59, 130, 246, 0.2);
  }

  .empty-state {
    text-align: center;
    padding: var(--spacing-xl) var(--spacing-md);
    color: var(--text-muted);
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }

  .welcome-view {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: var(--spacing-xl);
    height: 100%;
  }

  .welcome-view h2 {
    margin-bottom: var(--spacing-sm);
  }

  .welcome-view p {
    max-width: 500px;
    margin-bottom: var(--spacing-lg);
  }

  .quick-actions {
    display: flex;
    gap: var(--spacing-md);
  }

  .loading, .error {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    font-size: 1.125rem;
  }

  .error {
    color: var(--error-color);
  }
</style>