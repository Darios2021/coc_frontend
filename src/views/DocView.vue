<template>
  <div class="docview ga-3" @keydown.capture="onKeydown">
    <!-- Header -->
    <v-sheet class="toolbar d-flex align-center justify-space-between px-3 py-2">
      <div class="d-flex align-center ga-2">
        <v-btn variant="text" density="comfortable" @click="$router.push('/docs')">
          <v-icon icon="mdi-arrow-left" class="mr-1" /> Volver
        </v-btn>
        <div>
          <div class="text-h6 leading-none">{{ doc?.title || 'Documento' }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ doc?.classification || '—' }} · {{ doc?.doc_type || '—' }} · Versión {{ doc?.version || '—' }}
          </div>
        </div>
      </div>

      <div class="d-flex align-center ga-2">
        <v-chip size="small" :color="visibilityColor(doc?.visibility)" variant="tonal">
          {{ doc?.visibility || 'interno' }}
        </v-chip>

        <v-segmented
          v-model="viewMode"
          :items="[
            { value: 'content', label: 'Contenido' },
            { value: 'pdf', label: 'PDF' }
          ]"
          density="comfortable"
        />

        <v-btn icon :color="isFav ? 'red' : undefined" @click="toggleFav">
          <v-icon :icon="isFav ? 'mdi-heart' : 'mdi-heart-outline'" />
        </v-btn>

        <v-btn icon @click="openShare"><v-icon icon="mdi-share-variant" /></v-btn>
        <v-btn icon @click="openVersions"><v-icon icon="mdi-history" /></v-btn>
        <v-btn icon @click="openAudit"><v-icon icon="mdi-timeline-clock" /></v-btn>

        <v-divider vertical class="mx-1" />

        <v-btn variant="text" prepend-icon="mdi-printer" @click="printView">Imprimir</v-btn>

        <v-menu>
          <template #activator="{ props }">
            <v-btn v-bind="props" icon><v-icon icon="mdi-dots-vertical" /></v-btn>
          </template>
          <v-list density="compact">
            <v-list-item v-if="doc?.pdf_url" :href="doc.pdf_url" target="_blank" prepend-icon="mdi-file-eye" title="Abrir PDF" />
            <v-list-item v-else :to="`/docs/${route.params.id}/pdf`" prepend-icon="mdi-file-eye" title="Abrir PDF" />
            <v-list-item v-if="doc?.download_url" :href="doc.download_url" target="_blank" prepend-icon="mdi-download" title="Descargar" />
            <v-list-item prepend-icon="mdi-link-variant" title="Copiar enlace" @click="copiarEnlace()" />
            <v-divider />
            <v-list-item v-if="canEdit" prepend-icon="mdi-pencil" title="Editar" @click="goEdit" />
            <v-list-item v-if="canEdit" prepend-icon="mdi-publish" :title="doc?.published ? 'Despublicar' : 'Publicar'" @click="togglePublish" />
            <v-list-item prepend-icon="mdi-comment-text-multiple" title="Comentarios" @click="comments.open = true" />
          </v-list>
        </v-menu>
      </div>
    </v-sheet>

    <!-- Meta -->
    <v-card v-if="doc" class="px-3 py-2">
      <div class="d-flex flex-wrap ga-2 align-center">
        <v-chip v-for="t in (doc.tags || [])" :key="t" size="x-small" color="info" label>{{ t }}</v-chip>
        <v-spacer />
        <div class="text-caption text-medium-emphasis">
          Creado: {{ fmtFecha(doc.created_at) }} · Actualizado: {{ fmtFecha(doc.updated_at) }}
          <span v-if="doc.pages_count"> · {{ doc.pages_count }} pág.</span>
          <span v-if="doc.file_size"> · {{ fmtBytes(doc.file_size) }}</span>
        </div>
      </div>
    </v-card>

    <v-alert v-if="error" type="error" class="mb-2">{{ error }}</v-alert>
    <v-skeleton-loader v-if="loading" type="article, image, article" />

    <template v-else>
      <v-row>
        <!-- ASIDE -->
        <v-col cols="12" md="3" class="aside">
          <v-card class="pa-3">
            <!-- LATERAL para CONTENIDO -->
            <template v-if="viewMode === 'content'">
              <v-text-field
                ref="searchInput"
                v-model="q"
                label="Buscar en documento"
                density="comfortable"
                variant="outlined"
                hide-details
                clearable
                @keyup.enter="buscarEnContenido"
              />
              <div class="d-flex ga-2 mt-2">
                <v-btn block @click="buscarEnContenido">Buscar</v-btn>
                <v-btn icon :disabled="!matches.length" @click="gotoPrev"><v-icon icon="mdi-chevron-up" /></v-btn>
                <v-btn icon :disabled="!matches.length" @click="gotoNext"><v-icon icon="mdi-chevron-down" /></v-btn>
                <div class="text-caption d-flex align-center" style="min-width:60px; justify-content:center">
                  {{ matchesIndex+1 }}/{{ matches.length || 0 }}
                </div>
              </div>

              <v-divider class="my-4" />

              <div class="text-caption text-medium-emphasis mb-2">Índice del documento</div>
              <v-list density="compact" nav>
                <v-list-item
                  v-for="sec in toc"
                  :key="sec.id"
                  :title="sec.title || 'Sección'"
                  :class="{'active-toc': sec.id === activeId}"
                  @click="scrollTo(sec.id)"
                >
                  <template #prepend>
                    <v-icon icon="mdi-pound" size="16" class="mr-1" />
                  </template>
                  <template #append>
                    <v-btn icon variant="text" size="x-small" @click.stop="copySectionLink(sec.id)">
                      <v-icon size="16" icon="mdi-link-variant" />
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </template>

            <!-- LATERAL para PDF -->
            <template v-else>
              <v-text-field
                v-model="pdf.q"
                label="Buscar en PDF"
                density="comfortable"
                variant="outlined"
                hide-details
                clearable
                @keyup.enter="pdfFind()"
              />
              <div class="d-flex ga-2 mt-2">
                <v-btn block @click="pdfFind()">Buscar</v-btn>
                <v-btn icon :disabled="!pdf.viewer" @click="pdfFind(false)"><v-icon icon="mdi-chevron-up" /></v-btn>
                <v-btn icon :disabled="!pdf.viewer" @click="pdfFind(true)"><v-icon icon="mdi-chevron-down" /></v-btn>
                <div class="text-caption d-flex align-center" style="min-width:60px; justify-content:center">
                  {{ pdf.matches || 0 }} coincid.
                </div>
              </div>

              <v-divider class="my-4" />

              <div class="d-flex ga-2 align-center">
                <v-btn icon :disabled="!pdf.viewer || pdf.page<=1" @click="pdfGoTo(pdf.page-1)">
                  <v-icon icon="mdi-chevron-left" />
                </v-btn>
                <v-text-field
                  v-model.number="pdf.page"
                  type="number"
                  min="1"
                  :max="pdf.pages || 1"
                  density="comfortable"
                  style="max-width:100px"
                  label="Pág."
                  hide-details
                  @change="pdfGoTo(pdf.page)"
                />
                <div class="text-caption text-medium-emphasis">/ {{ pdf.pages || '—' }}</div>
                <v-btn icon :disabled="!pdf.viewer || pdf.page>=pdf.pages" @click="pdfGoTo(pdf.page+1)">
                  <v-icon icon="mdi-chevron-right" />
                </v-btn>
              </div>

              <v-slider
                class="mt-1"
                :min="1"
                :max="pdf.pages || 1"
                :step="1"
                v-model="pdf.page"
                :disabled="!pdf.viewer"
                @end="pdfGoTo(pdf.page)"
                hide-details
              />

              <div class="d-flex ga-2 mt-2">
                <v-btn block variant="tonal" prepend-icon="mdi-link-variant" :disabled="!pdf.viewer" @click="copyPdfPageLink">
                  Copiar link a esta página
                </v-btn>
              </div>

              <v-divider class="my-4" />

              <div class="text-caption text-medium-emphasis mb-2">Índice (Bookmarks del PDF)</div>
              <v-list density="compact" nav>
                <v-list-item
                  v-for="(it, i) in pdf.outline"
                  :key="i"
                  :title="it.title || 'Sección'"
                  @click="pdfGoToOutline(it)"
                >
                  <template #prepend>
                    <v-icon icon="mdi-bookmark-outline" size="16" class="mr-1" />
                  </template>
                  <template #title="{ title }">
                    <div :style="`margin-left:${it.level*12}px`">{{ title }}</div>
                  </template>
                </v-list-item>
              </v-list>
            </template>
          </v-card>

          <v-card v-if="related.length" class="pa-3 mt-3">
            <div class="text-subtitle-2 mb-2">Relacionados</div>
            <v-list density="compact" nav>
              <v-list-item
                v-for="r in related"
                :key="r.id"
                :title="r.title"
                :subtitle="(r.classification || '—') + ' · ' + (r.doc_type || '—')"
                @click="$router.push(`/docs/${r.id}`)"
              />
            </v-list>
          </v-card>
        </v-col>

        <!-- MAIN -->
        <v-col cols="12" md="9">
          <template v-if="viewMode === 'content'">
            <v-alert v-if="!doc?.sections?.length" type="info" variant="tonal" class="mb-3">
              Este documento no tiene secciones cargadas todavía.
            </v-alert>

            <v-expansion-panels multiple v-model="openPanels">
              <v-expansion-panel
                v-for="(s, i) in (doc?.sections || [])"
                :key="s.id || i"
                :id="idForSection(s, i)"
                ref="sectionEls"
              >
                <v-expansion-panel-title>
                  <div class="d-flex align-center w-100">
                    <v-icon icon="mdi-pound" size="18" class="mr-2" />
                    <span class="mr-auto">{{ s.heading || s.section_path || `Sección ${i+1}` }}</span>
                    <v-btn
                      size="x-small" variant="text" icon
                      @click.stop="copySectionText(s)"
                      :title="'Copiar texto'"
                    >
                      <v-icon size="18" icon="mdi-content-copy" />
                    </v-btn>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="content" v-html="renderContent(s.content)"></div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </template>

          <template v-else>
            <v-sheet class="pdfwrap" rounded="lg" border>
              <div v-if="!doc?.pdf_url" class="pa-6 text-center">
                <div class="mb-2">No tengo un PDF embebible para este documento.</div>
                <v-btn :to="`/docs/${route.params.id}/pdf`" color="primary" variant="tonal">
                  Abrir visor PDF
                </v-btn>
              </div>

              <div v-else ref="pdfHost" class="pdfHost">
                <div ref="viewerEl" class="pdfViewer"></div>
              </div>
            </v-sheet>
          </template>
        </v-col>
      </v-row>
    </template>

    <!-- SHARE dialog -->
    <v-dialog v-model="share.open" max-width="520">
      <v-card>
        <v-card-title>Compartir</v-card-title>
        <v-card-text>
          <v-select v-model="share.exp" :items="share.expires" label="Vence en" hide-details />
          <v-text-field v-model="share.link" label="Enlace" readonly append-inner-icon="mdi-content-copy"
                        @click:append-inner="copyShare" />
          <div class="text-caption text-medium-emphasis">
            Este enlace es de demostración. Integramos firma/expiración cuando tengas el endpoint.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer /><v-btn variant="text" @click="share.open=false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- VERSIONS dialog -->
    <v-dialog v-model="versions.open" max-width="680">
      <v-card>
        <v-card-title>Historial de versiones</v-card-title>
        <v-card-text>
          <v-list density="compact">
            <v-list-item
              v-for="v in versions.items"
              :key="v.id"
              :title="`v${v.number} — ${fmtFecha(v.date)}`"
              :subtitle="v.notes || '—'"
            >
              <template #append>
                <v-btn size="small" variant="text" @click="openVersion(v)">Ver</v-btn>
                <v-btn v-if="canEdit" size="small" color="primary" variant="text" @click="restoreVersion(v)">Restaurar</v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn variant="text" @click="versions.open=false">Cerrar</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <!-- AUDIT dialog -->
    <v-dialog v-model="audit.open" max-width="720">
      <v-card>
        <v-card-title>Bitácora</v-card-title>
        <v-card-text>
          <v-timeline density="compact">
            <v-timeline-item v-for="(a,i) in audit.items" :key="i" :dot-color="a.color" :icon="a.icon">
              <div class="text-subtitle-2">{{ a.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ fmtFecha(a.date) }} · {{ a.user }}</div>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn variant="text" @click="audit.open=false">Cerrar</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <!-- COMMENTS dialog (demo local) -->
    <v-dialog v-model="comments.open" max-width="720">
      <v-card>
        <v-card-title>Comentarios</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item v-for="(c,i) in comments.items" :key="i" :title="c.user" :subtitle="fmtFecha(c.date)">
              <template #append>
                <v-btn icon size="x-small" variant="text" @click="deleteComment(i)">
                  <v-icon size="18" icon="mdi-delete-outline" />
                </v-btn>
              </template>
              <div class="mt-1">{{ c.text }}</div>
            </v-list-item>
          </v-list>
          <v-textarea v-model="comments.draft" rows="3" label="Escribir comentario…" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="comments.open=false">Cerrar</v-btn>
          <v-btn color="primary" :disabled="!comments.draft?.trim()" @click="addComment">Enviar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="2200">{{ snack.msg }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const API = import.meta.env.VITE_API_URL

const role = ref(localStorage.getItem('role') || 'viewer')
const canEdit = computed(() => ['admin','editor'].includes(role.value))

const doc = ref(null)
const related = ref([])
const loading = ref(false)
const error = ref('')
const q = ref('')
const viewMode = ref('content') // 'content' | 'pdf'

// favoritos
const isFav = computed(() => favList().includes(String(route.params.id)))
function favList() { return JSON.parse(localStorage.getItem('fav_docs') || '[]') }
function setFavList(v) { localStorage.setItem('fav_docs', JSON.stringify(v)) }
function toggleFav() {
  const id = String(route.params.id)
  const list = favList()
  const idx = list.indexOf(id)
  if (idx >= 0) list.splice(idx,1); else list.unshift(id)
  setFavList(list.slice(0,200))
}

// fetch
async function cargar() {
  loading.value = true; error.value = ''
  try {
    const res = await fetch(`${API}/docs/${route.params.id}`)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    doc.value = await res.json()

    // relacionados
    try {
      const rr = await fetch(`${API}/docs/${route.params.id}/related`)
      related.value = rr.ok ? await rr.json() : []
    } catch { related.value = [] }

    // versiones (preload silencioso)
    preloadVersions()

    await nextTick()
    initObserver()
    restoreReadingPosition()

    // si ya estoy en modo PDF, inicializo visor
    if (viewMode.value === 'pdf' && doc.value?.pdf_url) {
      await nextTick()
      initPdfViewer()
    }
  } catch (e) {
    error.value = 'No pude cargar el documento: ' + (e?.message || e)
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, cargar)

// TOC + scrollspy (modo contenido)
const sectionEls = ref([])
const activeId = ref(null)
let io = null

const toc = computed(() => {
  const secs = doc.value?.sections || []
  return secs.map((s, i) => ({
    id: idForSection(s, i),
    title: s.heading || s.section_path || `Sección ${i+1}`
  }))
})

function idForSection(s, i) {
  return 'sec-' + (s?.id ?? i)
}

function initObserver() {
  destroyObserver()
  const els = Array.isArray(sectionEls.value) ? sectionEls.value.map(e => e?.$el ?? e) : []
  io = new IntersectionObserver((entries) => {
    const visible = entries.filter(e => e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)
    if (visible[0]) {
      activeId.value = visible[0].target.id
      saveReadingPosition(activeId.value)
    }
  }, { rootMargin: '-20% 0px -70% 0px', threshold: [0.1, 0.25, 0.5] })
  els.forEach(el => el && io.observe(el))
}

function destroyObserver() { if (io) { io.disconnect(); io = null } }

function scrollTo(id) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior:'smooth', block:'start' }) }

// búsqueda interna + navegación entre coincidencias (modo contenido)
const matches = ref([])           // ids de secciones con match
const matchesIndex = ref(0)
const searchInput = ref(null)
function renderContent(text) {
  if (!text) return ''
  const safe = escapeHtml(text)
  if (!q.value?.trim()) return safe.replace(/\n/g,'<br/>')
  const pattern = new RegExp(`(${escapeRegExp(q.value.trim())})`, 'ig')
  return safe.replace(/\n/g,'<br/>').replace(pattern,'<mark>$1</mark>')
}
function buscarEnContenido() {
  const qv = q.value?.trim()
  const secs = doc.value?.sections || []
  matches.value = !qv ? [] :
    secs.map((s,i)=>({id:idForSection(s,i),hit:(s.content||'').toLowerCase().includes(qv.toLowerCase())}))
        .filter(x=>x.hit).map(x=>x.id)
  matchesIndex.value = 0
  if (matches.value.length) scrollTo(matches.value[0])
}
function gotoNext(){ if(!matches.value.length) return; matchesIndex.value=(matchesIndex.value+1)%matches.value.length; scrollTo(matches.value[matchesIndex.value]) }
function gotoPrev(){ if(!matches.value.length) return; matchesIndex.value=(matchesIndex.value-1+matches.value.length)%matches.value.length; scrollTo(matches.value[matchesIndex.value]) }

// copiar cosas (generales)
const snack = ref({ show:false, msg:'' })
async function copiarEnlace(){ try{ await navigator.clipboard.writeText(location.href); toast('Enlace copiado')}catch{toast('No pude copiar el enlace')} }
async function copySectionLink(id){ try{ const url = `${location.origin}${location.pathname}#${id}`; await navigator.clipboard.writeText(url); toast('Enlace de sección copiado')}catch{toast('No pude copiar')} }
async function copySectionText(s){ try{ await navigator.clipboard.writeText(s?.content || ''); toast('Texto copiado')}catch{toast('No pude copiar')} }
function toast(m){ snack.value={show:true,msg:m} }

// 👈 Este import es obligatorio, si no pdfjsLib no existe
import * as pdfjsLib from 'pdfjs-dist'

// 👇 Estos imports son válidos (no uses legacy)
import { EventBus, PDFLinkService, PDFFindController, PDFViewer } from 'pdfjs-dist/legacy/web/pdf_viewer.js'
import 'pdfjs-dist/legacy/web/pdf_viewer.css'


// 👇 Worker correcto en Vite
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker





const pdfHost = ref(null)
const viewerEl = ref(null)
const pdf = reactive({
  loading: false,
  doc: /** @type {import('pdfjs-dist').PDFDocumentProxy|null} */(null),
  viewer: /** @type {PDFViewer|null} */(null),
  eventBus: /** @type {EventBus|null} */(null),
  link: /** @type {PDFLinkService|null} */(null),
  find: /** @type {PDFFindController|null} */(null),
  page: 1,
  pages: 0,
  q: '',
  matches: 0,
  outline: /** @type {Array<{title:string, dest:any, url?:string, level:number}>} */([]),
  initedForDocId: null
})

async function initPdfViewer() {
  if (!doc.value?.pdf_url) return
  const currentId = String(route.params.id)
  if (pdf.initedForDocId === currentId && pdf.viewer) return

  await destroyPdf()
  pdf.loading = true
  try {
    const eventBus = new EventBus()
    const link = new PDFLinkService({ eventBus })
    const find = new PDFFindController({ eventBus, linkService: link })
    const viewer = new PDFViewer({
      container: pdfHost.value,
      viewer: viewerEl.value,
      eventBus,
      linkService: link,
      findController: find,
      textLayerMode: 1,
      removePageBorders: false
    })
    link.setViewer(viewer)

    const loadingTask = pdfjsLib.getDocument({ url: doc.value.pdf_url })
    const pdfDoc = await loadingTask.promise

    pdf.doc = pdfDoc
    pdf.pages = pdfDoc.numPages
    pdf.page = 1
    pdf.eventBus = eventBus
    pdf.link = link
    pdf.find = find
    pdf.viewer = viewer
    pdf.initedForDocId = currentId

    viewer.setDocument(pdfDoc)
    link.setDocument(pdfDoc, null)
    viewer.currentScaleValue = 'page-width'

    try {
      const outline = await pdfDoc.getOutline()
      pdf.outline = flattenOutline(outline || [], 0)
    } catch { pdf.outline = [] }

    eventBus.on('pagechanging', (e) => {
      pdf.page = e.pageNumber
    })
    eventBus.on('updatefindmatchescount', (e) => {
      const total = (e?.matchesCount && (e.matchesCount.total ?? 0)) || 0
      pdf.matches = total
    })
  } catch (e) {
    toast('No pude abrir el PDF')
    console.error(e)
  } finally {
    pdf.loading = false
  }
}

function flattenOutline(items, level) {
  const out = []
  for (const it of items) {
    out.push({ title: it.title, dest: it.dest, url: it.url, level })
    if (it.items?.length) out.push(...flattenOutline(it.items, level + 1))
  }
  return out
}

function pdfGoTo(n) {
  if (!pdf.viewer) return
  const page = Math.max(1, Math.min(n, pdf.pages || 1))
  pdf.viewer.currentPageNumber = page
  pdf.page = page
}

function pdfFind(forward = true) {
  if (!pdf.find) return
  const query = (pdf.q || '').trim()
  if (!query) return
  pdf.find.executeCommand('find', {
    query,
    phraseSearch: true,
    caseSensitive: false,
    highlightAll: true,
    findPrevious: !forward
  })
}

function pdfGoToOutline(it) {
  if (!pdf.link) return
  if (it?.url) { window.open(it.url, '_blank'); return }
  if (it?.dest) { pdf.link.navigateTo(it.dest) }
}

async function copyPdfPageLink() {
  try {
    const url = `${doc.value?.pdf_url || ''}#page=${pdf.page}`
    await navigator.clipboard.writeText(url)
    toast('Link a la página copiado')
  } catch {
    toast('No pude copiar')
  }
}

async function destroyPdf() {
  try {
    if (pdf.viewer) pdf.viewer.setDocument(null)
    if (pdf.doc) await pdf.doc.destroy()
  } catch {}
  pdf.doc = null
  pdf.viewer = null
  pdf.eventBus = null
  pdf.link = null
  pdf.find = null
  pdf.pages = 0
  pdf.page = 1
  pdf.q = ''
  pdf.matches = 0
  pdf.outline = []
  pdf.initedForDocId = null
}

// Inicializar cuando entro a modo PDF o cambia el doc
watch([viewMode, () => doc.value?.pdf_url, () => route.params.id], async ([mode]) => {
  if (mode === 'pdf' && doc.value?.pdf_url) {
    await nextTick()
    initPdfViewer()
  }
})

// meta utils
function fmtFecha(s){ if(!s) return '—'; const d=new Date(s); return isNaN(d)?s:d.toLocaleString() }
function fmtBytes(bytes){ if(!bytes) return '—'; const u=['B','KB','MB','GB']; let i=0,v=bytes; while(v>=1024&&i<u.length-1){v/=1024;i++} return `${v.toFixed(v>=10||i===0?0:1)} ${u[i]}` }
function visibilityColor(v){ const map={ public:'success', interno:'grey', restricted:'warning', privado:'error' }; return map[v] || 'grey' }
function escapeHtml(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;') }
function escapeRegExp(str){ return str.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') }

// open panels por defecto (todas abiertas)
const openPanels = ref([])
watch(()=>doc.value, (d)=>{ if(d?.sections?.length){ openPanels.value = d.sections.map((_,i)=>i) }},{immediate:true})

// compartir (demo)
const share = ref({
  open:false,
  exp:'7d',
  expires:['1d','7d','30d'],
  link:''
})
function openShare(){
  share.value.open = true
  const tok = Math.random().toString(36).slice(2)
  share.value.link = `${location.origin}/docs/${route.params.id}?t=${tok}&exp=${share.value.exp}`
}
async function copyShare(){ try{ await navigator.clipboard.writeText(share.value.link); toast('Enlace copiado')}catch{toast('No pude copiar')} }

// versiones (demo + fetch opcional)
const versions = ref({ open:false, items:[] })
async function preloadVersions(){
  try{
    const r = await fetch(`${API}/docs/${route.params.id}/versions`)
    if(r.ok){ versions.value.items = await r.json(); return }
  }catch{}
  // fallback
  versions.value.items = [
    { id:'v3', number:3, date:doc.value?.updated_at || new Date().toISOString(), notes:'Correcciones menores' },
    { id:'v2', number:2, date:new Date(Date.now()-864e5*20).toISOString(), notes:'Ajustes de formato' },
    { id:'v1', number:1, date:new Date(Date.now()-864e5*60).toISOString(), notes:'Versión inicial' },
  ]
}
function openVersions(){ versions.value.open=true }
function openVersion(v){ toast(`Abrir versión v${v.number} (demo)`) }
function restoreVersion(v){ if(!canEdit.value) return; toast(`Restaurar v${v.number} (demo)`) }

// auditoría (demo)
const audit = ref({
  open:false,
  items:[
    { title:'Descarga', user:'jperez', date:new Date().toISOString(), color:'blue', icon:'mdi-download' },
    { title:'Actualización de metadatos', user:'mcalderon', date:new Date(Date.now()-3600e3).toISOString(), color:'green', icon:'mdi-pencil' },
    { title:'Vista de documento', user:'dperez', date:new Date(Date.now()-7200e3).toISOString(), color:'grey', icon:'mdi-eye' },
  ]
})
function openAudit(){ audit.value.open = true }

// publicar/despublicar (demo)
async function togglePublish(){
  if(!canEdit.value) return
  const newState = !doc.value?.published
  // acá podrías hacer PUT `${API}/docs/:id/publish` body { published: newState }
  doc.value = { ...(doc.value||{}), published:newState }
  toast(newState ? 'Publicado' : 'Despublicado')
}
function goEdit(){ /* $router.push(`/docs/${route.params.id}/edit`) */ toast('Abrir editor (demo)') }

// impresión
function printView(){
  if(viewMode.value === 'pdf'){ window.print(); return }
  const w = window.open('', '_blank')
  const html = `
    <html><head><title>${doc.value?.title || 'Documento'}</title></head>
    <body>${(doc.value?.sections||[]).map(s=>`<h3>${s.heading||s.section_path||''}</h3><pre>${escapeHtml(s.content||'')}</pre>`).join('<hr/>')}</body></html>`
  w.document.write(html); w.document.close(); w.focus(); w.print(); w.close()
}

// posición de lectura
function saveReadingPosition(id){ localStorage.setItem(`doc:${route.params.id}:pos`, id) }
function restoreReadingPosition(){
  const id = localStorage.getItem(`doc:${route.params.id}:pos`)
  if(id){ setTimeout(()=>scrollTo(id), 200) }
}

// atajos
function onKeydown(e){
  if (e.key === '/' && !e.ctrlKey && !e.metaKey){ e.preventDefault(); searchInput.value?.focus(); return }
  if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey){ e.preventDefault(); toggleFav(); return }
  if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey){ e.preventDefault(); printView(); return }
  if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey){ e.preventDefault(); window.scrollTo({top:0,behavior:'smooth'}); return }
  if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey){ e.preventDefault(); e.shiftKey ? gotoPrev() : gotoNext(); return }
}

// comentarios (demo local)
const comments = ref({
  open: false,
  draft: '',
  items: [
    { user: 'dperez', date: new Date().toISOString(), text: 'Revisar protocolo de evacuación en pág. 12.' }
  ]
})
function addComment(){
  comments.value.items.unshift({ user:'yo', date:new Date().toISOString(), text: comments.value.draft.trim() })
  comments.value.draft = ''
  toast('Comentario agregado')
}
function deleteComment(i){
  comments.value.items.splice(i,1)
  toast('Comentario eliminado')
}

onMounted(cargar)
onBeforeUnmount(() => {
  destroyObserver()
  destroyPdf()
})
</script>

<style scoped>
.ga-3 { display: grid; gap: 12px; }

/* Header pegajoso */
.toolbar { position: sticky; top: 0; z-index: 5; background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline-variant)); border-radius: 12px; }

/* Aside pegajoso */
.aside { position: sticky; top: 88px; }

/* Contenido */
.content { white-space: pre-wrap; line-height: 1.5; }
.content mark { padding: 0 .15em; border-radius: 4px; }

/* TOC activo */
.active-toc { background: rgba(var(--v-theme-primary), .08); }

/* PDF */
.pdfwrap { height: 80vh; overflow: hidden; }
.pdfHost { height: 80vh; overflow: auto; }
.pdfViewer .page { margin: 12px auto; }

.leading-none { line-height: 1; }
</style>
