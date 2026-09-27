<script>
  import { createEventDispatcher } from 'svelte';
  import { createTable } from '../lib/database';

  export let db;

  const dispatch = createEventDispatcher();

  let tableName = '';
  let columns = [
    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true, notNull: true, unique: false, default: null }
  ];
  let errors = {};
  let isSubmitting = false;

  function addColumn() {
    columns = [
      ...columns,
      { name: '', type: 'TEXT', primaryKey: false, autoIncrement: false, notNull: false, unique: false, default: null }
    ];
  }

  function removeColumn(index) {
    if (columns.length <= 1) return;
    columns = columns.filter((_, i) => i !== index);
  }

  function updateColumn(index, field, value) {
    columns = columns.map((col, i) =>
      i === index ? { ...col, [field]: value } : col
    );
  }

  function validateForm() {
    errors = {};
    let isValid = true;

    if (!tableName.trim()) {
      errors.tableName = 'Table name is required';
      isValid = false;
    }

    // Validate table name (SQLite rules)
    if (tableName && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      errors.tableName = 'Table name must start with a letter or underscore and contain only alphanumeric characters and underscores';
      isValid = false;
    }

    // Check for duplicate column names
    const columnNames = columns.map(col => col.name.toLowerCase());
    const uniqueColumnNames = new Set(columnNames);
    if (columnNames.length !== uniqueColumnNames.size) {
      errors.columns = 'Column names must be unique';
      isValid = false;
    }

    columns.forEach((col, index) => {
      if (!col.name.trim()) {
        errors[`column_${index}_name`] = 'Column name is required';
        isValid = false;
      }

      if (col.name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col.name)) {
        errors[`column_${index}_name`] = 'Invalid column name';
        isValid = false;
      }

      if (col.primaryKey && col.autoIncrement && col.type.toLowerCase() !== 'integer') {
        errors[`column_${index}_type`] = 'AUTOINCREMENT requires INTEGER type';
        isValid = false;
      }
    });

    return isValid;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    isSubmitting = true;

    try {
      // Filter out the auto-increment flag for non-primary keys
      const columnsToCreate = columns.map(col => ({
        name: col.name,
        type: col.type,
        primaryKey: col.primaryKey,
        autoIncrement: col.autoIncrement && col.primaryKey,
        notNull: col.notNull,
        unique: col.unique,
        default: col.default
      }));

      await createTable(db, tableName, columnsToCreate);
      dispatch('created');
    } catch (e) {
      errors.form = `Failed to create table: ${e.message}`;
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    dispatch('cancel');
  }

  // Available SQLite types
  const types = ['INTEGER', 'TEXT', 'REAL', 'BLOB', 'NUMERIC'];
</script>

<div class="create-table-modal">
  <div class="modal-overlay" on:click={handleCancel}>
    <div class="modal wide" on:click|stopPropagation>
      <div class="modal-header">
        <h3 class="modal-title">Create New Table</h3>
      </div>

      <div class="modal-body">
        {#if errors.form}
          <div class="form-error global-error">{errors.form}</div>
        {/if}

        <!-- Table Name -->
        <div class="form-group">
          <label class="form-label" for="tableName">
            Table Name <span class="required">*</span>
          </label>
          <input
            type="text"
            id="tableName"
            bind:value={tableName}
            class="form-input {errors.tableName ? 'error' : ''}"
            placeholder="e.g., users, products, orders"
          />
          {#if errors.tableName}
            <div class="form-error">{errors.tableName}</div>
          {/if}
        </div>

        <!-- Columns -->
        <div class="form-group">
          <label class="form-label">Columns</label>
          {#if errors.columns}
            <div class="form-error">{errors.columns}</div>
          {/if}

          <div class="columns-list">
            {#each columns as column, index}
              <div class="column-row">
                <div class="column-field">
                  <label class="field-label">Name <span class="required">*</span></label>
                  <input
                    type="text"
                    bind:value={column.name}
                    on:input={(e) => updateColumn(index, 'name', e.target.value)}
                    class="form-input {errors[`column_${index}_name`] ? 'error' : ''}"
                    placeholder="e.g., id, name, email"
                  />
                  {#if errors[`column_${index}_name`]}
                    <div class="form-error">{errors[`column_${index}_name`]}</div>
                  {/if}
                </div>

                <div class="column-field">
                  <label class="field-label">Type <span class="required">*</span></label>
                  <select
                    bind:value={column.type}
                    on:change={(e) => updateColumn(index, 'type', e.target.value)}
                    class="form-input {errors[`column_${index}_type`] ? 'error' : ''}"
                  >
                    {#each types as type}
                      <option value={type}>{type}</option>
                    {/each}
                  </select>
                  {#if errors[`column_${index}_type`]}
                    <div class="form-error">{errors[`column_${index}_type`]}</div>
                  {/if}
                </div>

                <div class="column-field checkbox-group">
                  <label class="field-label">Options</label>
                  <div class="checkbox-row">
                    <label class="checkbox-label">
                      <input
                        type="checkbox"
                        checked={column.primaryKey}
                        on:change={(e) => updateColumn(index, 'primaryKey', e.target.checked)}
                        disabled={columns.some((c, i) => c.primaryKey && i !== index)}
                      />
                      Primary Key
                    </label>
                    <label class="checkbox-label">
                      <input
                        type="checkbox"
                        checked={column.autoIncrement}
                        on:change={(e) => updateColumn(index, 'autoIncrement', e.target.checked)}
                        disabled={!column.primaryKey}
                      />
                      Auto Increment
                    </label>
                  </div>
                  <div class="checkbox-row">
                    <label class="checkbox-label">
                      <input
                        type="checkbox"
                        checked={column.notNull}
                        on:change={(e) => updateColumn(index, 'notNull', e.target.checked)}
                      />
                      Not Null
                    </label>
                    <label class="checkbox-label">
                      <input
                        type="checkbox"
                        checked={column.unique}
                        on:change={(e) => updateColumn(index, 'unique', e.target.checked)}
                      />
                      Unique
                    </label>
                  </div>
                </div>

                <div class="column-field">
                  <label class="field-label">Default Value</label>
                  <input
                    type="text"
                    bind:value={column.default}
                    on:input={(e) => updateColumn(index, 'default', e.target.value)}
                    class="form-input"
                    placeholder="e.g., CURRENT_TIMESTAMP, 0"
                  />
                </div>

                <button
                  class="delete-btn"
                  on:click={() => removeColumn(index)}
                  disabled={columns.length <= 1}
                  title="Remove column"
                >
                  ×
                </button>
              </div>
            {/each}
          </div>

          <button class="btn-secondary add-column-btn" on:click={addColumn}>
            + Add Column
          </button>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" on:click={handleCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button
          class="btn-primary"
          on:click={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Table'}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .create-table-modal {
    /* This component renders its own modal overlay */
  }

  .wide {
    max-width: 900px;
    width: 95%;
  }

  .columns-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-top: var(--spacing-md);
  }

  .column-row {
    display: flex;
    gap: var(--spacing-md);
    align-items: flex-end;
    padding: var(--spacing-md);
    background-color: var(--background-color);
    border-radius: var(--radius-md);
  }

  .column-field {
    flex: 1;
    min-width: 120px;
  }

  .field-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xs);
  }

  .checkbox-group {
    min-width: 180px;
  }

  .checkbox-row {
    display: flex;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-xs);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 0.75rem;
    cursor: pointer;
    color: var(--text-secondary);
  }

  .checkbox-label input[type="checkbox"] {
    accent-color: var(--primary-color);
    width: auto;
  }

.delete-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1.5rem;
  padding: 0 var(--spacing-xs);
}

.delete-btn:hover {
  color: var(--primary-color);
}
</style>