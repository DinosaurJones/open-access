<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { insertRow, updateRow } from '../lib/database';

  export let db;
  export let tableName;
  export let schema;
  export let row = {};

  const dispatch = createEventDispatcher();

  let formData = { ...row };
  let errors = {};
  let isSubmitting = false;

  // Track whether we're editing an existing row
  $: pkColumn = schema.find(col => col.pk === 1)?.name || 'id';
  $: isEditing = formData[pkColumn] !== undefined && formData[pkColumn] !== null;

  // Initialize form data with default values from schema
  onMount(() => {
    schema.forEach(column => {
      if (formData[column.name] === undefined) {
        formData[column.name] = getDefaultValue(column);
      }
    });
  });

  function getDefaultValue(column) {
    const type = column.type.toLowerCase();
    if (type.includes('int') || type.includes('real') || type.includes('float')) {
      return 0;
    }
    if (type.includes('bool')) {
      return false;
    }
    if (column.notnull === 1 && !column.dflt_value) {
      return type.includes('text') ? '' : null;
    }
    return column.dflt_value || null;
  }

  function getInputType(column) {
    const type = column.type.toLowerCase();
    if (type.includes('int') || type.includes('real') || type.includes('float')) {
      return 'number';
    }
    if (type.includes('date') || type.includes('time')) {
      return 'datetime-local';
    }
    if (type.includes('bool')) {
      return 'checkbox';
    }
    if (type.includes('text') || type.includes('varchar') || type.includes('char')) {
      return 'text';
    }
    return 'text';
  }

  function validateForm() {
    errors = {};
    let isValid = true;

    schema.forEach(column => {
      if (column.notnull === 1 && (formData[column.name] === undefined || formData[column.name] === null || formData[column.name] === '')) {
        errors[column.name] = 'This field is required';
        isValid = false;
      }
    });

    return isValid;
  }

  function handleInputChange(columnName, value) {
    formData[columnName] = value;
    // Clear error when user types
    if (errors[columnName]) {
      errors = { ...errors };
      delete errors[columnName];
    }
  }

  function handleCheckboxChange(columnName, event) {
    formData[columnName] = event.target.checked;
    if (errors[columnName]) {
      errors = { ...errors };
      delete errors[columnName];
    }
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    isSubmitting = true;

    try {
      if (isEditing) {
        // Update existing row
        const { [pkColumn]: id, ...data } = formData;
        await updateRow(db, tableName, id, data);
      } else {
        // Insert new row
        await insertRow(db, tableName, formData);
      }

      dispatch('saved');
    } catch (e) {
      errors.form = `Failed to save: ${e.message}`;
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

<div class="row-editor">
  <div class="modal-overlay" on:click={handleCancel}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3 class="modal-title">
          {isEditing ? 'Edit Row' : 'Add New Row'}
        </h3>
      </div>

      <div class="modal-body">
        {#if errors.form}
          <div class="form-error global-error">{errors.form}</div>
        {/if}

        <div class="form-grid">
          {#each schema as column}
            <div class="form-group">
              <label class="form-label" for="{column.name}">
                {column.name}
                {#if column.notnull === 1}
                  <span class="required">*</span>
                {/if}
              </label>

              {#if getInputType(column) === 'checkbox'}
                <input
                  type="checkbox"
                  id="{column.name}"
                  bind:checked={formData[column.name]}
                  on:change={(e) => handleCheckboxChange(column.name, e)}
                  class="checkbox"
                />
              {:else if getInputType(column) === 'datetime-local'}
                <input
                  type="datetime-local"
                  id="{column.name}"
                  bind:value={formData[column.name]}
                  on:input={(e) => handleInputChange(column.name, e.target.value)}
                  class="form-input {errors[column.name] ? 'error' : ''}"
                />
              {:else if getInputType(column) === 'number'}
                <input
                  type="number"
                  id="{column.name}"
                  bind:valueAsNumber={formData[column.name]}
                  on:input={(e) => handleInputChange(column.name, e.target.valueAsNumber)}
                  class="form-input {errors[column.name] ? 'error' : ''}"
                />
              {:else}
                <input
                  type="text"
                  id="{column.name}"
                  bind:value={formData[column.name]}
                  on:input={(e) => handleInputChange(column.name, e.target.value)}
                  class="form-input {errors[column.name] ? 'error' : ''}"
                />
              {/if}

              {#if errors[column.name]}
                <div class="form-error">{errors[column.name]}</div>
              {/if}

              <div class="column-info text-muted text-xs">
                {column.type}
                {#if column.pk === 1}
                  <span class="badge-primary badge ml-2">Primary Key</span>
                {/if}
                {#if column.notnull === 1}
                  <span class="badge-warning badge ml-2">Required</span>
                {/if}
              </div>
            </div>
          {/each}
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
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--spacing-lg);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .form-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .required {
    color: var(--error-color);
  }

  .form-input {
    width: 100%;
  }

  .form-input.error {
    border-color: var(--error-color);
  }

  .checkbox {
    width: auto;
    accent-color: var(--primary-color);
  }

  .form-error {
    color: var(--error-color);
    font-size: 0.75rem;
  }

  .global-error {
    margin-bottom: var(--spacing-lg);
    padding: var(--spacing-sm);
    background-color: #fee2e2;
    border-radius: var(--radius-md);
  }

  .column-info {
    display: flex;
    align-items: center;
    margin-top: var(--spacing-xs);
  }

  .badge {
    font-size: 0.625rem;
  }

  .ml-2 {
    margin-left: var(--spacing-sm);
  }
</style>