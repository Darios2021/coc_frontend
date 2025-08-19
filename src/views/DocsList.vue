<!-- src/views/DocsList.vue -->
<template>
  <div class="library ga-3">
    <!-- Toolbar -->
    <v-sheet class="toolbar d-flex align-center justify-space-between px-3 py-2">
      <div class="d-flex align-center ga-2">
        <v-icon icon="mdi-library-shelves" size="28" />
        <div>
          <div class="text-h6 leading-none">Biblioteca</div>
          <div class="text-caption text-medium-emphasis">
            {{ total }} documento{{ total === 1 ? '' : 's' }} disponibles
          </div>
        </div>
      </div>

      <div class="d-flex align-center ga-2">
        <v-chip color="primary" variant="tonal" size="small">
          Rol: {{ role.toUpperCase() }}
        </v-chip>

        <v-select
          v-model="filters.sort"
          :items="sortItems"
          density="comfortable"
          variant="outlined"
          hide-details
          style="max-width: 220px"
          @update:model-value="refrescar()"
        />

        <v-select
          v-model="perPage"
          :items="[12, 24, 48]"
          label="Por página"
          density="comfortable"
          variant="outlined"
          hide-details
          style="max-width: 140px"
          @update:model-value="irAPagina(1)"
        />

        <v-btn
          v-if="canUpload"
          color="primary"
          prepend-icon="mdi-upload"
          @click="$router.push('/docs/nuevo')"
        >
          Subir documento
        </v-btn>
      </div>
    </v-sheet>

    <!-- Buscador avanzado -->
    <AdvancedSearch
      v-model="filters"
      :loading="loading"
      :api="API"
      @search="irAPagina(1)"
    />

    <!-- Chips de filtros activos -->
    <div v-if="hayFiltrosActivos" class="px-1">
      <v-chip
        v-if="filters.q"
        class="mr-1 mb-2"
        color="secondary"
        label
        closable
        @click:close="limpiarCampo('q')"
      >
        Búsqueda: “{{ filters.q }}”
      </v-chip>

      <v-chip
        v-if="filters.classification"
        class="mr-1 mb-2"
        :color="classificationColor(filters.classification)"
        label
        closable
        @click:close="limpiarCampo('classification')"
      >
        {{ filters.classification }}
      </v-chip>

      <v-chip
        v-if="filters.type"
        class="mr-1 mb-2"
        color="info"
        label
        closable
        @click:close="limpiarCampo('type')"
      >
        {{ filters.type }}
      </v-chip>

      <v-btn variant="text" size="small" class="mb-2" @click="resetFiltros">
        Limpiar filtros
      </v-btn>
    </div>

    <!-- Estados -->
    <v-alert v-if="error" type="error" class="mb-2">{{ error }}</v-alert>

    <template v-if="loading">
      <v-row dense>
        <v-col v-for="n in 12" :key="n" cols="12" sm="6" md="4" lg="3">
          <v-skeleton-loader type="image, article, actions" />
        </v-col>
      </v-row>
    </template>

    <template v-else>
      <v-row v-if="displayedDocs.length" dense>
        <v-col
          v-for="d in displayedDocs"
          :key="d.id"
          cols="12" sm="6" md="4" lg="3"
        >
          <v-card class="doc-card h-100">
            <div class="thumb d-flex align-center justify-center">
              <template v-if="d.thumbnail_url">
                <v-img :src="d.thumbnail_url" cover />
              </template>
              <template v-else>
                <v-icon
                  :icon="iconoPorTipo(d.doc_type)"
                  size="56"
                  class="text-medium-emphasis"
                />
              </template>
            </div>

            <v-card-item>
              <v-card-title class="text-wrap">{{ d.title }}</v-card-title>
              <v-card-subtitle class="text-caption">
                <span v-if="d.classification">
                  <v-chip
                    :color="classificationColor(d.classification)"
                    size="x-small" class="mr-1" label
                  >
                    {{ d.classification }}
                  </v-chip>
                </span>
                <v-chip v-if="d.doc_type" color="info" size="x-small" label class="mr-1">
                  {{ d.doc_type }}
                </v-chip>
                <v-chip
                  size="x-small"
                  :color="visibilityColor(d.visibility)"
                  label
                >
                  {{ d.visibility || 'interno' }}
                </v-chip>
              </v-card-subtitle>
            </v-card-item>

            <v-card-actions class="px-3 pb-3">
              <v-btn :to="`/docs/${d.id}/pdf`" variant="tonal" size="small" prepend-icon="mdi-file-eye">
                Ver PDF
              </v-btn>
              <v-spacer />
              <v-menu>
                <template #activator="{ props }">
                  <v-btn icon variant="text" v-bind="props">
                    <v-icon icon="mdi-dots-vertical" />
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item :to="`/docs/${d.id}`" prepend-icon="mdi-information-outline" title="Ver detalle" />
                  <v-list-item v-if="d.download_url" :href="d.download_url" target="_blank"
                               prepend-icon="mdi-download" title="Descargar" />
                  <v-list-item
                    prepend-icon="mdi-link-variant"
                    title="Copiar enlace"
                    @click="copiarEnlace(d.id)"
                  />
                </v-list>
              </v-menu>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <v-sheet
        v-else
        class="empty d-flex flex-column align-center justify-center text-center pa-8"
        color="surface"
        rounded="lg"
        border
      >
        <v-icon icon="mdi-file-search-outline" size="56" class="mb-2" />
        <div class="text-subtitle-1 mb-1">No hay resultados</div>
        <div class="text-medium-emphasis mb-4">
          Probá ajustar la búsqueda o limpiar los filtros.
        </div>
        <v-btn variant="text" @click="resetFiltros">Limpiar filtros</v-btn>
      </v-sheet>

      <!-- Paginación -->
      <div v-if="total > perPage" class="d-flex justify-center my-4">
        <v-pagination
          v-model="page"
          :length="pages"
          rounded="lg"
          @update:model-value="refrescar()"
        />
      </div>
    </template>

    <!-- Snackbar -->
    <v-snackbar v-model="snack.show" :timeout="2200">
      {{ snack.msg }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdvancedSearch from '@/components/AdvancedSearch.vue'

import { apiUrl } from '@/lib/config'
// Rol (ejemplo demo)
const role = ref(localStorage.getItem('role') || 'viewer')
const canUpload = computed(() => ['admin', 'editor'].includes(role.value))

// Estado
const loading = ref(false)
const error = ref('')
const allDocs = ref([])     // página actual o lista completa (fallback)
const total = ref(0)

// Filtros + orden + paginación
const filters = ref({
  q: '',
  classification: null,
  type: null,
  sort: 'recent',
})

const sortItems = [
  { title: 'Más recientes', value: 'recent' },
  { title: 'Más antiguos',  value: 'oldest' },
  { title: 'A → Z',         value: 'az' },
  { title: 'Z → A',         value: 'za' },
  { title: 'Más vistos',    value: 'views' },
]

const page = ref(1)
const perPage = ref(12)
const serverPagination = ref(false) // se activa si la API devuelve total y ya pagina

const pages = computed(() => Math.max(1, Math.ceil(total.value / perPage.value)))

// Docs a mostrar (cliente si no hay paginación del server)
const displayedDocs = computed(() => {
  if (serverPagination.value) return allDocs.value
  const start = (page.value - 1) * perPage.value
  return allDocs.value.slice(start, start + perPage.value)
})

const hayFiltrosActivos = computed(() =>
  !!(filters.value.q || filters.value.classification || filters.value.type)
)

// Cargar / refrescar
async function cargar() {
  loading.value = true
  error.value = ''
  try {
   const url = new URL(apiUrl('/docs'))
    // filtros
    if (filters.value.q) url.searchParams.set('q', filters.value.q)
    if (filters.value.classification) url.searchParams.set('classification', filters.value.classification)
    if (filters.value.type) url.searchParams.set('type', filters.value.type)
    if (filters.value.sort) url.searchParams.set('sort', filters.value.sort)
    // paginación (si el backend la soporta)
    url.searchParams.set('page', page.value.toString())
    url.searchParams.set('perPage', perPage.value.toString())

    const res = await fetch(url.toString(), {
      headers: { 'X-Role': role.value }
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const data = await res.json()

    // Detecta forma de respuesta
    if (Array.isArray(data)) {
      // Sin paginación del server
      serverPagination.value = false
      allDocs.value = data
      total.value = data.length
    } else {
      // Estilo { data, total } o similar
      serverPagination.value = true
      allDocs.value = data.data ?? data.items ?? []
      total.value = data.total ?? data.meta?.total ?? allDocs.value.length
    }
  } catch (e) {
    error.value = 'No pude cargar documentos: ' + (e?.message || e)
  } finally {
    loading.value = false
  }
}

function refrescar() {
  cargar()
}

function irAPagina(n) {
  page.value = n
  refrescar()
}

// Helpers UI
function classificationColor(c) {
  const map = {
    'Protocolo': 'deep-purple',
    'Procedimiento': 'indigo',
    'Manual': 'teal',
    'Marco legal': 'amber',
  }
  return map[c] || 'grey'
}

function visibilityColor(v) {
  const map = {
    'public': 'success',
    'interno': 'grey',
    'restricted': 'warning',
    'privado': 'error',
  }
  return map[v] || 'grey'
}

function iconoPorTipo(t) {
  const map = {
    'PDF': 'mdi-file-pdf-box',
    'DOC': 'mdi-file-word-box',
    'XLS': 'mdi-file-excel-box',
    'PPT': 'mdi-file-powerpoint-box',
  }
  return map[t?.toUpperCase?.()] || 'mdi-file-document-outline'
}

function limpiarCampo(key) {
  filters.value[key] = key === 'q' ? '' : null
  irAPagina(1)
}

function resetFiltros() {
  filters.value = { q: '', classification: null, type: null, sort: filters.value.sort || 'recent' }
  irAPagina(1)
}

// Acciones
const snack = ref({ show: false, msg: '' })
async function copiarEnlace(id) {
  try {
    const url = `${location.origin}/docs/${id}`
    await navigator.clipboard.writeText(url)
    snack.value = { show: true, msg: 'Enlace copiado' }
  } catch {
    snack.value = { show: true, msg: 'No se pudo copiar el enlace' }
  }
}

onMounted(cargar)
</script>

<style scoped>
.ga-3 { display: grid; gap: 12px; }

/* Toolbar “pegajosa” */
.toolbar {
  position: sticky;
  top: 0;
  z-index: 5;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: 12px;
}

/* Card de documento */
.doc-card .thumb {
  height: 164px;
  background: linear-gradient(
      0deg,
      rgba(0,0,0,0.02),
      rgba(0,0,0,0.02)
    ),
    rgb(var(--v-theme-surface-variant));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .06);
}
.doc-card .v-card-title {
  line-height: 1.2;
  min-height: 48px;
}

/* Estado vacío */
.empty { min-height: 280px; }

.leading-none { line-height: 1; }
</style>
