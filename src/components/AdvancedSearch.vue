<template>
  <v-card class="p-3">
    <div class="d-flex flex-wrap ga-3 align-center">
      <v-text-field
        v-model="local.q"
        label="Buscar texto"
        variant="outlined"
        density="compact"
        hide-details
        style="min-width:280px"
        @keyup.enter="emitSearch"
      />

      <v-select
        v-model="local.classification"
        :items="classifications"
        item-title="label"
        item-value="value"
        label="Clasificación"
        variant="outlined"
        density="compact"
        hide-details
        style="min-width:220px"
        clearable
      />

      <v-select
        v-model="local.type"
        :items="types"
        item-title="label"
        item-value="value"
        label="Tipo (opcional)"
        variant="outlined"
        density="compact"
        hide-details
        style="min-width:220px"
        clearable
      />

      <v-select
        v-model="local.sort"
        :items="sorts"
        item-title="title"
        item-value="value"
        label="Ordenar"
        variant="outlined"
        density="compact"
        hide-details
        style="min-width:200px"
      />

      <v-spacer />

      <v-btn color="primary" :loading="loading" @click="emitSearch">Buscar</v-btn>
      <v-btn variant="text" @click="reset">Limpiar</v-btn>
    </div>

    <div v-if="showChips && activeChips.length" class="mt-3 d-flex ga-2 flex-wrap">
      <v-chip
        v-for="k in activeChips"
        :key="k.key"
        closable
        @click:close="removeChip(k.key)"
        color="primary"
        variant="tonal"
        size="small"
      >
        {{ k.label }}
      </v-chip>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  api: { type: String, required: true },
  showChips: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue', 'search'])

// ordenamientos alineados con la vista
const sorts = [
  { title: 'Más recientes', value: 'recent' },
  { title: 'Más antiguos',  value: 'oldest' },
  { title: 'Título A→Z',    value: 'az' },
  { title: 'Título Z→A',    value: 'za' },
  { title: 'Más vistos',    value: 'views' }
]

const classifications = ref([]) // [{label, value}]
const types = ref([])           // [{label, value}]

const local = ref({
  q: '',
  classification: null,
  type: null,
  sort: 'recent'
})

onMounted(async () => {
  // inicializar con el v-model del padre
  local.value = { sort: 'recent', ...props.modelValue }

  // cargar listas
  try {
    const [clsRes, typeRes] = await Promise.allSettled([
      fetch(`${props.api}/classifications`),
      fetch(`${props.api}/doc-types`)
    ])

    if (clsRes.status === 'fulfilled' && clsRes.value.ok) {
      classifications.value = await clsRes.value.json()
    }
    if (typeRes.status === 'fulfilled' && typeRes.value.ok) {
      types.value = await typeRes.value.json()
    } else {
      // fallback si tu API aún no tiene endpoint de tipos
      types.value = [
        { label: 'PDF', value: 'PDF' },
        { label: 'DOC', value: 'DOC' },
        { label: 'XLS', value: 'XLS' },
        { label: 'PPT', value: 'PPT' }
      ]
    }
  } catch {
    // silencioso
  }
})

const activeChips = computed(() => {
  const chips = []
  if (local.value.q) chips.push({ key: 'q', label: `Texto: “${local.value.q}”` })
  const cls = classifications.value.find(c => c.value === local.value.classification)
  if (cls) chips.push({ key: 'classification', label: `Clasificación: ${cls.label}` })
  const tp = types.value.find(t => t.value === local.value.type)
  if (tp) chips.push({ key: 'type', label: `Tipo: ${tp.label}` })
  if (local.value.sort && local.value.sort !== 'recent') {
    const s = sorts.find(s => s.value === local.value.sort)?.title || 'Orden personalizado'
    chips.push({ key: 'sort', label: `Orden: ${s}` })
  }
  return chips
})

function removeChip(key) {
  if (key === 'q') local.value.q = ''
  else if (key === 'sort') local.value.sort = 'recent'
  else local.value[key] = null
  emitSearch()
}

function emitSearch() {
  emit('update:modelValue', { ...local.value })
  emit('search', { ...local.value })
}

function reset() {
  local.value = { q: '', classification: null, type: null, sort: 'recent' }
  emitSearch()
}
</script>

<style scoped>
.p-3 { padding: 12px; }
.ga-2 { gap: 8px; }
.ga-3 { gap: 12px; }
</style>
