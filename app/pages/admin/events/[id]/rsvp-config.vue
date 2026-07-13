<template>
  <div>
    <NuxtLink to="/admin/events" class="admin-back-link">
      <font-awesome-icon :icon="['fas', 'chevron-left']" />
      Back to Events
    </NuxtLink>

    <div v-if="loading" class="admin-loading">Loading...</div>

    <template v-else-if="event">
      <div class="form-header">
        <div>
          <h1 class="admin-page-title">RSVP Form</h1>
          <p class="editor-meta">{{ event.heading }}</p>
        </div>
        <div class="header-actions">
          <a :href="`/events/${eventId}/rsvp`" target="_blank" class="preview-link">
            <font-awesome-icon :icon="['fas', 'arrow-up-right-from-square']" />
            Preview
          </a>
          <button class="admin-btn" :disabled="saving" @click="save">
            <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" spin />
            {{ saving ? 'Saving...' : 'Save RSVP Form' }}
          </button>
        </div>
      </div>

      <div v-if="saveMsg" :class="['save-msg', saveError ? 'save-msg--error' : 'save-msg--ok']">
        {{ saveMsg }}
      </div>

      <!-- No RSVP yet -->
      <div v-if="!enabled" class="empty-card">
        <p>This event has no RSVP form.</p>
        <button class="admin-btn" @click="enableRsvp">
          <font-awesome-icon :icon="['fas', 'plus']" /> Add RSVP Form
        </button>
      </div>

      <template v-else>
        <!-- Settings -->
        <div class="form-card">
          <h2 class="card-title">Settings</h2>

          <div class="field-row field-row--inline">
            <label class="switch">
              <input type="checkbox" v-model="settings.active" />
              <span>Accepting RSVPs</span>
            </label>
            <span class="field-hint field-hint--inline">Uncheck to close the form while keeping the fields.</span>
          </div>

          <div class="field-two-col">
            <div class="field-row">
              <label class="field-label">Opens</label>
              <input v-model="settings.start_date" type="datetime-local" class="field-input" />
              <p class="field-hint">Optional. Before this, the form shows as not-yet-open.</p>
            </div>
            <div class="field-row">
              <label class="field-label">Closes</label>
              <input v-model="settings.close_date" type="datetime-local" class="field-input" />
              <p class="field-hint">Optional. After this, RSVPs are closed.</p>
            </div>
          </div>

          <div class="field-row">
            <label class="field-label">Closed message <span class="html-hint">(optional)</span></label>
            <textarea v-model="settings.closed_message" class="field-input" rows="2" placeholder="Shown when RSVP is closed"></textarea>
          </div>

          <div class="field-row">
            <label class="field-label">Override key <span class="html-hint">(optional)</span></label>
            <input v-model="settings.override_key" class="field-input" placeholder="Secret ?key= that bypasses the closed state" />
          </div>

          <button class="remove-rsvp-btn" @click="removeRsvp">
            <font-awesome-icon :icon="['fas', 'trash']" /> Remove RSVP form entirely
          </button>
        </div>

        <!-- Blocks -->
        <div class="blocks-list">
          <div v-for="(block, bIdx) in blocks" :key="block._key" class="block-card" :class="{ 'block-card--section': block.isSection }">
            <div class="block-header">
              <span class="block-badge">{{ block.isSection ? 'Section' : 'Field' }} {{ bIdx + 1 }}</span>
              <div class="block-actions">
                <button class="icon-btn" title="Move up" :disabled="bIdx === 0" @click="moveBlock(bIdx, -1)">
                  <font-awesome-icon :icon="['fas', 'arrow-up']" />
                </button>
                <button class="icon-btn" title="Move down" :disabled="bIdx === blocks.length - 1" @click="moveBlock(bIdx, 1)">
                  <font-awesome-icon :icon="['fas', 'arrow-down']" />
                </button>
                <button class="icon-btn icon-btn--danger" title="Remove" @click="removeBlock(bIdx)">
                  <font-awesome-icon :icon="['fas', 'trash']" />
                </button>
              </div>
            </div>

            <div class="block-body">
              <!-- Section -->
              <template v-if="block.isSection">
                <div class="field-row">
                  <label class="field-label">Section title</label>
                  <input v-model="block.section" class="field-input" placeholder="e.g. Guest Details" />
                </div>

                <div class="nested-fields">
                  <div v-for="(f, fIdx) in block.fields" :key="f._key" class="nested-field">
                    <div class="nested-field-header">
                      <span class="nested-badge">{{ fIdx + 1 }}</span>
                      <div class="block-actions">
                        <button class="icon-btn icon-btn--sm" title="Move up" :disabled="fIdx === 0" @click="moveNested(block, fIdx, -1)">
                          <font-awesome-icon :icon="['fas', 'arrow-up']" />
                        </button>
                        <button class="icon-btn icon-btn--sm" title="Move down" :disabled="fIdx === block.fields.length - 1" @click="moveNested(block, fIdx, 1)">
                          <font-awesome-icon :icon="['fas', 'arrow-down']" />
                        </button>
                        <button class="icon-btn icon-btn--sm icon-btn--danger" title="Remove" @click="block.fields.splice(fIdx, 1)">
                          <font-awesome-icon :icon="['fas', 'trash']" />
                        </button>
                      </div>
                    </div>
                    <AdminRsvpFieldEditor :field="f" :upload-folder="uploadFolder" />
                  </div>
                  <button class="add-btn add-btn--sm" @click="addFieldToSection(block)">
                    <font-awesome-icon :icon="['fas', 'plus']" /> Add Field to Section
                  </button>
                </div>
              </template>

              <!-- Standalone field -->
              <template v-else>
                <AdminRsvpFieldEditor :field="block" :upload-folder="uploadFolder" />
              </template>
            </div>
          </div>
        </div>

        <div class="add-row">
          <button class="add-btn" @click="addField">
            <font-awesome-icon :icon="['fas', 'plus']" /> Add Field
          </button>
          <button class="add-btn" @click="addSection">
            <font-awesome-icon :icon="['fas', 'plus']" /> Add Section
          </button>
        </div>

        <!-- Totals & Filters -->
        <div class="form-card">
          <h2 class="card-title">Totals <span class="card-title-hint">(summed columns in the RSVP viewer)</span></h2>
          <div v-for="(t, idx) in totals" :key="t._key" class="kv-row">
            <input v-model="t.key" class="field-input" placeholder="field key (e.g. guests)" />
            <input v-model="t.label" class="field-input" placeholder="label (e.g. Total Guests)" />
            <button class="icon-btn icon-btn--danger" @click="totals.splice(idx, 1)">
              <font-awesome-icon :icon="['fas', 'trash']" />
            </button>
          </div>
          <button class="add-btn add-btn--sm" @click="totals.push({ _key: genKey(), key: '', label: '' })">
            <font-awesome-icon :icon="['fas', 'plus']" /> Add Total
          </button>
        </div>

        <div class="form-card">
          <h2 class="card-title">Filters <span class="card-title-hint">(dropdown filters in the RSVP viewer)</span></h2>
          <div v-for="(f, idx) in filters" :key="f._key" class="kv-row">
            <input v-model="f.key" class="field-input" placeholder="field key (e.g. attending)" />
            <input v-model="f.label" class="field-input" placeholder="label (e.g. Attending)" />
            <button class="icon-btn icon-btn--danger" @click="filters.splice(idx, 1)">
              <font-awesome-icon :icon="['fas', 'trash']" />
            </button>
          </div>
          <button class="add-btn add-btn--sm" @click="filters.push({ _key: genKey(), key: '', label: '' })">
            <font-awesome-icon :icon="['fas', 'plus']" /> Add Filter
          </button>
        </div>

        <div class="form-footer">
          <button class="admin-btn" :disabled="saving" @click="save">
            <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" spin />
            {{ saving ? 'Saving...' : 'Save RSVP Form' }}
          </button>
        </div>
      </template>
    </template>

    <div v-else class="admin-empty">Event not found.</div>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive} from 'vue';
import {getEvent, updateEventRsvp} from '~/composables/useEvents';
import type {RsvpConfig, RsvpField, RsvpFieldOrSection, RsvpSection} from '~/composables/useRsvp';
import {isSection} from '~/composables/useRsvp';

definePageMeta({layout: 'admin', middleware: 'auth'});

const route = useRoute();
const eventId = route.params.id as string;
// RSVP image uploads live alongside the event, in the shared nsfm bucket
const uploadFolder = `events/${eventId}/rsvp`;

const loading = ref(true);
const saving = ref(false);
const saveMsg = ref('');
const saveError = ref(false);
const event = ref<any>(null);
const enabled = ref(false);

let nextKey = 0;
const genKey = () => ++nextKey;

interface FieldModel {
  _key: number;
  key: string;
  label: string;
  type: RsvpField['type'];
  required: boolean;
  reqIfField: string;
  reqIfValue: string;
  optionsText: string;
  value: string;
}

interface FieldBlock extends FieldModel {
  isSection: false;
}
interface SectionBlock {
  _key: number;
  isSection: true;
  section: string;
  fields: FieldModel[];
}
type Block = FieldBlock | SectionBlock;

const settings = reactive({
  active: true,
  start_date: '',
  close_date: '',
  closed_message: '',
  override_key: '',
});

const blocks = reactive<Block[]>([]);
const totals = reactive<{_key: number; key: string; label: string}[]>([]);
const filters = reactive<{_key: number; key: string; label: string}[]>([]);

/* -------- load -------- */
onMounted(async () => {
  event.value = await getEvent(eventId);
  const rsvp = event.value?.rsvp as RsvpConfig | null;
  if (rsvp) {
    enabled.value = true;
    hydrate(rsvp);
  }
  loading.value = false;
});

function hydrate(rsvp: RsvpConfig) {
  settings.active = !!rsvp.active;
  settings.start_date = isoToLocal(rsvp.start_date);
  settings.close_date = isoToLocal(rsvp.close_date);
  settings.closed_message = rsvp.closed_message ?? '';
  settings.override_key = rsvp.override_key ?? '';

  for (const item of rsvp.fields ?? []) {
    if (isSection(item)) {
      blocks.push({
        _key: genKey(),
        isSection: true,
        section: item.section,
        fields: item.fields.map(toFieldModel),
      });
    } else {
      blocks.push({_key: genKey(), isSection: false, ...toFieldModel(item)});
    }
  }
  for (const t of rsvp.totals ?? []) totals.push({_key: genKey(), key: t.key, label: t.label});
  for (const f of rsvp.filters ?? []) filters.push({_key: genKey(), key: f.key, label: f.label});
}

function toFieldModel(f: RsvpField): FieldModel {
  return {
    _key: genKey(),
    key: f.key ?? '',
    label: f.label ?? '',
    type: f.type ?? 'text',
    required: !!f.required,
    reqIfField: f.required_if?.field ?? '',
    reqIfValue: f.required_if?.value ?? '',
    optionsText: (f.options ?? []).join('\n'),
    value: f.value ?? '',
  };
}

function blankField(): FieldModel {
  return {_key: genKey(), key: '', label: '', type: 'text', required: false, reqIfField: '', reqIfValue: '', optionsText: '', value: ''};
}

/* -------- mutations -------- */
function enableRsvp() {
  enabled.value = true;
}

function removeRsvp() {
  if (!confirm('Remove the RSVP form from this event entirely? Existing responses are kept but the form disappears.')) return;
  enabled.value = false;
  blocks.splice(0);
  totals.splice(0);
  filters.splice(0);
  // persist immediately as null
  saveNull();
}

function addField() {
  blocks.push({isSection: false, ...blankField()});
}

function addSection() {
  blocks.push({_key: genKey(), isSection: true, section: '', fields: []});
}

function addFieldToSection(block: SectionBlock) {
  block.fields.push(blankField());
}

function moveBlock(idx: number, dir: number) {
  const target = idx + dir;
  if (target < 0 || target >= blocks.length) return;
  const [item] = blocks.splice(idx, 1);
  blocks.splice(target, 0, item);
}

function removeBlock(idx: number) {
  blocks.splice(idx, 1);
}

function moveNested(block: SectionBlock, idx: number, dir: number) {
  const target = idx + dir;
  if (target < 0 || target >= block.fields.length) return;
  const [item] = block.fields.splice(idx, 1);
  block.fields.splice(target, 0, item);
}

/* -------- datetime helpers -------- */
function isoToLocal(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localToIso(local: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

/* -------- serialize + save -------- */
function serializeField(f: FieldModel): RsvpField {
  const out: RsvpField = {key: f.key.trim(), label: f.label.trim(), type: f.type};
  if (f.required) out.required = true;
  if (f.reqIfField.trim()) out.required_if = {field: f.reqIfField.trim(), value: f.reqIfValue};
  if (f.type === 'select') {
    const opts = f.optionsText.split('\n').map((o) => o.trim()).filter(Boolean);
    if (opts.length) out.options = opts;
  }
  if ((f.type === 'readonly' || f.type === 'template' || f.type === 'image') && f.value.trim())
    out.value = f.value;
  return out;
}

function buildConfig(): RsvpConfig {
  const fields: RsvpFieldOrSection[] = blocks.map((b) =>
    b.isSection
      ? ({section: b.section.trim(), fields: b.fields.map(serializeField)} as RsvpSection)
      : serializeField(b)
  );

  const config: RsvpConfig = {active: settings.active, fields};
  const start = localToIso(settings.start_date);
  const close = localToIso(settings.close_date);
  if (start) config.start_date = start;
  if (close) config.close_date = close;
  if (settings.closed_message.trim()) config.closed_message = settings.closed_message.trim();
  if (settings.override_key.trim()) config.override_key = settings.override_key.trim();

  const t = totals.filter((x) => x.key.trim()).map((x) => ({key: x.key.trim(), label: x.label.trim()}));
  if (t.length) config.totals = t;
  const fl = filters.filter((x) => x.key.trim()).map((x) => ({key: x.key.trim(), label: x.label.trim()}));
  if (fl.length) config.filters = fl;

  return config;
}

function validate(): string | null {
  const keys: string[] = [];
  const allFields: FieldModel[] = [];
  for (const b of blocks) {
    if (b.isSection) {
      if (!b.section.trim()) return 'Every section needs a title.';
      allFields.push(...b.fields);
    } else {
      allFields.push(b);
    }
  }
  for (const f of allFields) {
    if (!f.key.trim()) return 'Every field needs a key.';
    if (!f.label.trim()) return `Field "${f.key}" needs a label.`;
    if (/\s/.test(f.key.trim())) return `Field key "${f.key}" cannot contain spaces.`;
    keys.push(f.key.trim());
  }
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (dupes.length) return `Duplicate field key: "${dupes[0]}". Keys must be unique.`;
  return null;
}

function flash(msg: string, isError = false) {
  saveMsg.value = msg;
  saveError.value = isError;
  if (!isError) setTimeout(() => (saveMsg.value = ''), 4000);
}

async function save() {
  const err = validate();
  if (err) return flash(err, true);

  saving.value = true;
  const {error} = await updateEventRsvp(eventId, buildConfig());
  saving.value = false;

  if (error) return flash('Failed to save RSVP form. Please try again.', true);
  if (event.value) event.value.rsvp = buildConfig();
  flash('RSVP form saved!');
}

async function saveNull() {
  saving.value = true;
  const {error} = await updateEventRsvp(eventId, null);
  saving.value = false;
  if (error) return flash('Failed to remove RSVP form.', true);
  if (event.value) event.value.rsvp = null;
  flash('RSVP form removed.');
}
</script>

<style scoped>
.admin-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #2563eb;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.admin-back-link:hover {
  text-decoration: underline;
}

.admin-page-title {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0;
}

.editor-meta {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0.25rem 0 0;
}

.admin-loading {
  color: #64748b;
  padding: 2rem 0;
}

.admin-empty {
  color: #94a3b8;
  padding: 2rem 0;
  text-align: center;
}

.form-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.preview-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #2563eb;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
}

.preview-link:hover {
  text-decoration: underline;
}

/* Buttons */
.admin-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #0033a0;
  color: white;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.admin-btn:hover {
  background: #002080;
}

.admin-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: #eff6ff;
  color: #2563eb;
  border: 1px dashed #93c5fd;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.add-btn:hover {
  background: #dbeafe;
  border-color: #60a5fa;
}

.add-btn--sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
}

.icon-btn {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.3rem 0.45rem;
  font-size: 0.72rem;
  display: inline-flex;
  align-items: center;
}

.icon-btn:hover:not(:disabled) {
  background: #e2e8f0;
  color: #334155;
}

.icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.icon-btn--sm {
  padding: 0.2rem 0.35rem;
  font-size: 0.65rem;
}

.icon-btn--danger:hover:not(:disabled) {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

.remove-rsvp-btn {
  align-self: flex-start;
  margin-top: 0.5rem;
  background: none;
  border: none;
  color: #dc2626;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0;
}

.remove-rsvp-btn:hover {
  text-decoration: underline;
}

/* Save message */
.save-msg {
  padding: 0.6rem 1rem;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.save-msg--ok {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.save-msg--error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* Cards */
.empty-card,
.form-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  padding: 1.25rem;
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.empty-card {
  align-items: flex-start;
  gap: 1rem;
  color: #64748b;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.card-title-hint {
  font-weight: 400;
  font-size: 0.78rem;
  color: #94a3b8;
}

/* Blocks */
.blocks-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.block-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.block-card--section {
  border-color: #c7d2fe;
}

.block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 1rem;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.block-card--section .block-header {
  background: #eef2ff;
}

.block-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.block-actions {
  display: flex;
  gap: 0.3rem;
}

.block-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.nested-fields {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  border-top: 1px dashed #e2e8f0;
  padding-top: 0.75rem;
}

.nested-field {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  padding: 0.65rem;
}

.nested-field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.nested-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field-row--inline {
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

.field-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.html-hint {
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
  color: #94a3b8;
  font-size: 0.72rem;
}

.field-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0.15rem 0 0;
}

.field-hint--inline {
  margin: 0;
}

.field-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.4rem 0.55rem;
  border: 1px solid #d1d5db;
  border-radius: 0.35rem;
  font-size: 0.85rem;
  color: #1e293b;
  font-family: inherit;
  transition: border-color 0.15s;
}

.field-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.88rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}

.switch input {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.add-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.kv-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.form-footer {
  display: flex;
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .field-two-col {
    grid-template-columns: 1fr;
  }
}
</style>
