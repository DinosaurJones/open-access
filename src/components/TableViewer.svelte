<script>
  import { onMount } from 'svelte';
  import { getTableSchema, getTableRows, insertRow, updateRow, deleteRow } from '../lib/database';
  import RowEditor from './RowEditor.svelte';

  export let db;
  export let tableName;

  let schema = [];
  let rows = [];
  let isLoading = true;
  let error = null;
  let showRowEditor = false;
  let editingRow = null;
  let confirmDeleteRow = null;

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      isLoading = true;
      error = null;

      // Load schema and rows in parallel
      const [schemaResult, rowsResult] = await Promise.all([
        getTableSchema(db, tableName),
        getTableRows(db, tableName)
      ]);

      schema = schemaResult;
      rows = rowsResult;
    } catch (e) {
      error = `Failed to load table data: ${e.message}`;
    } finally {
      isLoading = false;
    }
  }

  function openRowEditor(row = null) {
    editingRow = row || {};
    showRowEditor = true;
  }

  async function handleRowSaved() {
    await loadData();
    showRowEditor = false;
    editingRow = null;
  }

  function confirmDelete(row) {
    confirmDeleteRow = row;
  }

  async function deleteRowConfirmed() {
    if (!confirmDeleteRow || !confirmDeleteRow.id) return;

    try {
      const id = confirmDeleteRow.id;
      const table = tableName;

      // Find the primary key column
      const pkColumn = schema.find(col => col.pk === 1)?.name || 'id';
      const pkValue = confirmDeleteRow[pkColumn];

      await deleteRow(db, table, pkValue);
      await loadData();
    } catch (e) {
      error = `Failed to delete row: ${e.message}`;
    } finally {
      confirmDeleteRow = null;
    }
  }

  function cancelDelete() {
    confirmDeleteRow = null;
  }

  function getColumnType(column) {
    if (!column) return 'text';
    const type = column.type.toLowerCase();
    if (type.includes('int')) return 'number';
    if (type.includes('real') || type.includes('float') || type.includes('double')) return 'number';
    if (type.includes('text') || type.includes('varchar') || type.includes('char')) return 'text';
    if (type.includes('date') || type.includes('time')) return 'date';
    if (type.includes('bool')) return 'boolean';
    return 'text';
  }

  // Get primary key column name
  function getPrimaryKeyColumn() {
    const pkCol = schema.find(col => col.pk === 1);
    return pkCol?.name || 'id';
  }
</script>

<div class="table-viewer">
  {#if isLoading}
    <div class="loading">Loading table data...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <div class="viewer-header">
      <div class="header-left">
        <button class="btn-secondary back-btn" on:click|preventDefault={() => dispatch('back')}>
          ← Back to Tables
        </button>
        <h2>{tableName}</h2>
      </div>
      <div class="header-actions">
        <button class="btn-primary" on:click={() => openRowEditor()}>
          + Add Row
        </button>
      </div>
    </div>

    <!-- Table Info -->
    <div class="table-info card">
      <h3>Table Information</h3>
      <p><strong>Name:</strong> {tableName}</p>
      <p><strong>Columns:</strong> {schema.length}</p>
      <p><strong>Rows:</strong> {rows.length}</p>
    </div>

    <!-- Data Table -->
    <div class="data-table-container card">
      <div class="table-header">
        <h3>Data</h3>
      </div>

      {#if rows.length === 0}
        <div class="empty-state">
          <p>No data in table</p>
          <button class="btn-primary mt-2" on:click={() => openRowEditor()}>
            Add First Row
          </button>
        </div>
      {:else}
        <table class="data-table">
          <thead>
            <tr>
              {#each schema as column}
                <th>{column.name}</th>
              {/each}
              <th class="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each rows as row}
              <tr>
                {#each schema as column}
                  <td>
                    {#if getColumnType(column) === 'boolean'}
                      {row[column.name] ? '✓' : '✗'}
                    {:else}
                      {row[column.name] ?? ''}
                    {/if}
                  </td>
                {/each}
                <td class="actions-col">
                  <div class="action-buttons">
                    <button
                      class="action-btn edit-btn"
                      on:click={() => openRowEditor(row)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      class="action-btn delete-btn"
                      on:click={() => confirmDelete(row)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>

  <!-- Row Editor Modal -->
  {#if showRowEditor}
    <RowEditor
      db={db}
      tableName={tableName}
      schema={schema}
      row={editingRow}
      on:saved={handleRowSaved}
      on:cancel={() => showRowEditor = false}
    />
  {/if}

  <!-- Confirm Delete Modal -->
  {#if confirmDeleteRow}
    <div class="modal-overlay" on:click={cancelDelete}>
      <div class="modal" on:click|stopPropagation>
        <div class="modal-header">
          <h3 class="modal-title">Confirm Delete</h3>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete this row?</p>
          <p class="text-muted text-sm mt-2">This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" on:click={cancelDelete}>Cancel</button>
          <button class="btn-danger" on:click={deleteRowConfirmed}>Delete Row</button>
        </div>
      </div>
    </div>
  {/if}
  {/if}
</div>

<style>
  .table-viewer {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    height: 100%;
  }

  .viewer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .back-btn {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .viewer-header h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .table-info {
    padding: var(--spacing-lg);
  }

  .table-info h3 {
    margin-bottom: var(--spacing-md);
    font-size: 1rem;
    color: var(--text-secondary);
  }

  .table-info p {
    margin: var(--spacing-xs) 0;
    color: var(--text-primary);
  }

  .data-table-container {
    flex: 1;
    overflow: auto;
  }

  .table-header {
    margin-bottom: var(--spacing-md);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
  }

  .table-header h3 {
    margin: 0;
    font-size: 1rem;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .data-table th,
  .data-table td {
    padding: var(--spacing-md);
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }

  .data-table th {
    background-color: var(--background-color);
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
    position: sticky;
    top: 0;
  }

  .data-table tr:hover {
    background-color: var(--background-color);
  }

  .actions-col {
    width: 100px;
    text-align: center;
  }

  .action-buttons {
    display: flex;
    gap: var(--spacing-xs);
    justify-content: center;
  }

  .action-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--spacing-xs);
    border-radius: var(--radius-sm);
    font-size: 1rem;
    transition: background-color var(--transition-fast);
  }

  .action-btn:hover {
    background-color: var(--background-color);
  }

  .edit-btn:hover {
    color: var(--primary-color);
  }

  .delete-btn:hover {
    color: var(--error-color);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    text-align: center;
    color: var(--text-muted);
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