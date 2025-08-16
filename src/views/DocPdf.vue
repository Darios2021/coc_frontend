<template>
  <!-- Vista completa: Topbar + MiniHeader sticky + Contenido -->
  <div class="reader-root">
    <!-- Topbar -->
    <v-toolbar density="compact" flat class="topbar">
      <v-btn size="small" variant="text" @click="$router.push('/docs')">
        <v-icon icon="mdi-arrow-left" class="mr-1" /> Volver
      </v-btn>

      <div class="d-flex flex-column">
        <div class="text-subtitle-2">{{ doc?.title || 'Documento' }}</div>
        <div class="text-caption text-medium-emphasis">
          <span v-if="doc?.classification">{{ doc.classification }} · </span>
          <span v-if="doc?.doc_type">{{ doc.doc_type }}</span>
          <span v-if="doc?.version"> · v{{ doc.version }}</span>
        </div>
      </div>

      <v-spacer />

      <!-- Estado de lectura + acción de marcado -->
      <div class="d-flex align-center ga-2">
        <v-chip v-if="pdfReady" size="x-small" variant="tonal">{{ page }} / {{ pages }}</v-chip>
        <v-chip v-if="pdfReady" size="x-small" color="primary" variant="flat">{{ progressPct }}%</v-chip>
        <v-divider vertical class="mx-1" />
        <v-btn v-if="pdfReady" icon variant="text" :title="'Marcar página '+page" @click="addBookmark">
          <v-icon icon="mdi-bookmark-plus-outline" />
        </v-btn>
        <v-chip v-if="doc?.visibility" size="x-small" variant="tonal">{{ doc.visibility }}</v-chip>
      </div>
    </v-toolbar>

    <!-- Mini header global -->
    <div class="mini-header">
      <div class="mini-left">
        <v-icon size="16" icon="mdi-file-document-outline" class="mr-1" />
        <span class="mini-label">Avance de lectura</span>
      </div>
      <div class="mini-right">
        <span class="mini-percent">{{ progressPct }}%</span>
      </div>
      <div class="mini-progress">
        <div class="mini-bar" :style="{ width: progressPct + '%' }"></div>
      </div>
    </div>

    <!-- Layout principal en dos columnas -->
    <div class="main-row">
      <!-- LATERAL (ancho ajustable) -->
      <aside
        :style="{
          flex: `0 0 ${asideW}px`,
          minWidth: '260px',
          maxWidth: '560px',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(var(--v-theme-on-surface),.06)',
          minHeight: 0,
          overflow: 'hidden',
          'overflow-anchor': 'none'
        }"
      >
        <div class="aside-wrap">
          <v-card rounded="lg" flat class="aside-card">
            <!-- ⬇️ Único contenedor con scroll -->
            <div class="aside-scroll">
              <!-- Tabs sticky -->
              <div class="tabs-stick">
                <v-tabs
                  v-model="asideTab"
                  :height="44"
                  grow
                  bg-color="transparent"
                  slider-color="primary"
                  density="comfortable"
                  class="aside-tabs text-button"
                >
                  <v-tab value="indice"     prepend-icon="mdi-format-list-bulleted" class="px-4" style="font-weight:600">Índice</v-tab>
                  <v-tab value="marcadores" prepend-icon="mdi-bookmark-outline"     class="px-4" style="font-weight:600">Marcadores</v-tab>
                </v-tabs>
                <v-divider />
              </div>

              <!-- ÍNDICE -->
              <div v-show="asideTab==='indice'" class="aside-pane">
                <!-- Header búsqueda (sticky debajo de tabs) -->
                <div class="aside-stick">
                  <div class="pa-3 pb-2">
                    <div class="d-flex ga-2">
                      <v-text-field
                        v-model.trim="panelQ"
                        density="comfortable"
                        hide-details
                        placeholder="Buscar en PDF"
                        clearable
                        clear-icon="mdi-close-circle"
                        @keyup.enter="panelFind"
                      />
                      <v-btn
                        size="small"
                        variant="tonal"
                        :disabled="!panelQ?.trim()"
                        @click="panelFind"
                        prepend-icon="mdi-magnify"
                      >
                        Buscar
                      </v-btn>
                    </div>
                    <v-progress-linear
                      v-if="!pdfReady"
                      indeterminate
                      height="2"
                      class="mt-2"
                    />
                  </div>
                  <v-divider />
                </div>

                <!-- Resultados (coincidencias en PDF) -->
<!-- Resultados (coincidencias en PDF e Índice) -->
<div v-if="results.total || idxCount" class="results-box">
  <div class="results-head">
    <div class="text-caption">
      <div class="line">
        <strong>Resultados en PDF:</strong>
        {{ nf(results.total) }} {{ results.total === 1 ? 'coincidencia' : 'coincidencias' }}
        <span v-if="results.pages.length">
          · {{ nf(results.pages.length) }} {{ results.pages.length === 1 ? 'página' : 'páginas' }}
        </span>
      </div>
      <div class="line" v-if="panelQ">
        <strong>Resultados en ÍNDICE:</strong>
        {{ nf(idxCount) }} {{ idxCount === 1 ? 'coincidencia' : 'coincidencias' }}
      </div>
    </div>

    <div class="d-flex ga-1">
      <v-btn size="x-small" variant="text" prepend-icon="mdi-chevron-up" @click="resultsCollapsed=!resultsCollapsed">
        {{ resultsCollapsed ? 'Expandir' : 'Contraer' }}
      </v-btn>
      <v-btn size="x-small" variant="text" prepend-icon="mdi-close" @click="clearResults">
        Limpiar
      </v-btn>
    </div>
  </div>

  <v-expand-transition>
    <div v-show="!resultsCollapsed" class="results-list">
      <v-list density="compact" nav>
        <v-list-item
          v-for="rp in results.pages"
          :key="rp.page"
          @click="setPage(rp.page)"
        >
          <template #prepend>
            <v-chip size="x-small" variant="tonal">p. {{ rp.page }}</v-chip>
          </template>
          <template #title>
            {{ nf(rp.count) }} {{ rp.count===1 ? 'coincidencia' : 'coincidencias' }}
          </template>
        </v-list-item>
      </v-list>
    </div>
  </v-expand-transition>
</div>


                <!-- Lista del índice -->
                <div class="outline-col">
                  <div class="outline-scroll">
                    <div v-if="!outlineFlat.length" class="text-caption text-medium-emphasis pa-3">
                      {{ pdfReady ? 'Sin índice detectado' : 'Cargando…' }}
                    </div>

                    <v-list v-else class="outline-list" density="comfortable" nav>
                      <v-list-item
                        v-for="n in visibleOutline" :key="n.id"
                        :ripple="false"
                        :class="{ 'is-active': n.page && activeOutlinePage === n.page }"
                        @click.prevent.stop="n.hasChildren ? toggleExpand(n) : openOutline(n)"
                      >
                        <template #prepend>
                          <v-btn
                            v-if="n.hasChildren"
                            size="x-small" variant="text" icon
                            @click.stop="toggleExpand(n)"
                          >
                            <v-icon :icon="isExpanded(n) ? 'mdi-chevron-down' : 'mdi-chevron-right'" />
                          </v-btn>
                          <v-icon v-else size="16" icon="mdi-bookmark-outline" class="mr-1" />
                        </template>

                        <template #title>
                          <div class="d-flex align-center justify-space-between">
                            <div
                              :style="`padding-left:${n.level*12}px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px`"
                              v-html="highlightTitle(n.title)"
                            ></div>
                            <v-chip v-if="n.page" size="x-small" variant="tonal">p. {{ n.page }}</v-chip>
                          </div>
                        </template>

                        <template #append>
                          <v-btn v-if="!n.hasChildren" icon size="x-small" variant="text" @click.stop="openOutline(n)">
                            <v-icon size="16" icon="mdi-arrow-right" />
                          </v-btn>
                        </template>
                      </v-list-item>
                    </v-list>
                  </div>
                </div>
              </div>

              <!-- MARCADORES -->
              <div v-show="asideTab==='marcadores'" class="aside-pane">
                <div class="pa-3">
                  <div class="d-flex ga-2">
                    <v-btn size="small" variant="tonal" prepend-icon="mdi-bookmark-plus" :disabled="!pdfReady" @click="addBookmark">
                      Marcar página
                    </v-btn>
                    <v-btn size="small" variant="text" prepend-icon="mdi-delete-outline" :disabled="!bookmarks.length" @click="clearBookmarks">
                      Borrar todos
                    </v-btn>
                  </div>
                </div>

                <div class="bookmark-scroll">
                  <v-list v-if="bookmarks.length" density="comfortable" nav>
                    <v-list-item
                      v-for="(b,i) in bookmarks" :key="b.ts"
                      @click="openBookmark(b)"
                    >
                      <template #prepend><v-icon icon="mdi-bookmark" class="mr-2" /></template>
                      <template #title>{{ b.label }}</template>
                      <template #subtitle>p. {{ b.page }}</template>
                      <template #append>
                        <v-btn icon size="x-small" variant="text" @click.stop="delBookmark(i)">
                          <v-icon size="16" icon="mdi-close" />
                        </v-btn>
                      </template>
                    </v-list-item>
                  </v-list>

                  <div v-else class="text-caption text-medium-emphasis pa-3">
                    No tenés marcadores en este documento.
                  </div>
                </div>
              </div>
            </div>
            <!-- ⬆️ Fin del único scroller -->
          </v-card>
        </div>
      </aside>

      <!-- Tirador para redimensionar el aside -->
      <div class="aside-resizer" @mousedown="startResize" title="Ajustar panel"></div>

      <!-- VISOR -->
      <section class="viewer-col">
        <div class="viewer-box">
          <object
            v-if="useNative"
            :data="fileUrl"
            type="application/pdf"
            class="viewer-embed"
          />
          <iframe
            v-else
            ref="frame"
            :key="frameKey"
            :src="viewerHref"
            class="viewer-embed"
            @load="onFrameLoad"
          />
        </div>
      </section>
    </div>

    <v-snackbar v-model="snack.show" :timeout="2200">{{ snack.msg }}</v-snackbar>
  </div>
</template>



<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

/* ------------ datos del doc ------------- */
const route = useRoute()
const API = import.meta.env.VITE_API_URL

const role = ref(localStorage.getItem('role') || 'viewer')
const doc  = ref({ title: 'Documento', visibility: 'interno' })
const error = ref('')

/* --- ancho variable del panel lateral --- */
const asideW = ref(340)
let resizing = false
function startResize(e) {
  resizing = true
  const startX = e.clientX
  const startW = asideW.value
  const prevSel = document.body.style.userSelect
  document.body.style.userSelect = 'none'
  const onMove = (ev) => {
    if (!resizing) return
    const dx = ev.clientX - startX
    asideW.value = Math.min(560, Math.max(260, startW + dx))
  }
  const onUp = () => {
    resizing = false
    document.body.style.userSelect = prevSel || ''
    window.removeEventListener('mousemove', onMove, true)
    window.removeEventListener('mouseup', onUp, true)
  }
  window.addEventListener('mousemove', onMove, true)
  window.addEventListener('mouseup', onUp, true)
}

async function loadDoc () {
  error.value = ''
  try {
    const r = await fetch(`${API}/docs/${route.params.id}`, { headers: { 'X-Role': role.value } })
    if (!r.ok) return
    doc.value = { ...doc.value, ...(await r.json()) }
  } catch {
    error.value = 'No pude cargar el documento'
  }
}

/* ------------ visor PDF.js embebido ------------- */
const useNative = ref(false)
const frame = ref(null)
const frameKey = ref('')
const bust = ref(Date.now().toString())

const fileUrl = computed(() => {
  const u = new URL(`${API}/docs/${route.params.id}/file`)
  u.searchParams.set('v', bust.value)
  return u.toString()
})
const viewerHref = computed(() =>
  `${location.origin}/pdfjs/web/viewer.html?vv=${Date.now()}&file=${encodeURIComponent(fileUrl.value)}`
)
function setFrameKey () { frameKey.value = `${route.params.id}-${bust.value}` }

function app () { try { return frame.value?.contentWindow?.PDFViewerApplication || null } catch { return null } }
function linkService () { const a = app(); return a?.pdfLinkService || a?._pdfLinkService || null }

/* ====== readiness ====== */
function hasPages () {
  const a = app()
  const pagesArr = a?.pdfViewer?._pages
  return Array.isArray(pagesArr) && pagesArr.length > 0
}
function waitForPagesReady (timeoutMs = 5000) {
  return new Promise((resolve) => {
    const a = app()
    if (!a) return resolve(false)
    if (hasPages()) return resolve(true)
    const eb = a.eventBus || a._eventBus
    let done = false
    const off = () => { eb?.off?.('pagesinit', onEvt); eb?.off?.('pagesloaded', onEvt) }
    const onEvt = () => { if (!done && hasPages()) { done = true; off(); resolve(true) } }
    eb?.on?.('pagesinit', onEvt); eb?.on?.('pagesloaded', onEvt)
    const started = Date.now()
    const tick = () => {
      if (done) return
      if (hasPages()) { done = true; off(); resolve(true); return }
      if (Date.now() - started > timeoutMs) { off(); resolve(false); return }
      setTimeout(tick, 100)
    }
    tick()
  })
}
async function scrollPdfTop (delay = 0) {
  const go = async () => {
    const ok = await waitForPagesReady()
    if (!ok) return
    const a = app(); if (!a) return
    try {
      if (a.pdfViewer?.currentPageNumber !== 1) a.pdfViewer.currentPageNumber = 1
      if (a.pdfViewer?.container) a.pdfViewer.container.scrollTop = 0
    } catch {}
  }
  delay ? setTimeout(go, delay) : go()
}
function onFrameLoad () {
  setTimeout(() => {
    try { app() ? bindPdf() : (useNative.value = true) }
    catch { useNative.value = true }
  }, 250)
}

const pdfReady = ref(false)
const page = ref(1)
const pages = ref(0)
const scale = ref(1)
const zoomLabel = computed(() => `${Math.round(scale.value * 100)}%`)
const progressPct = computed(() =>
  pages.value ? Math.min(100, Math.max(0, Math.round((page.value / pages.value) * 100))) : 0
)
let infoInterval = null

function bindPdf () {
  const a = app(); if (!a) return
  const eb = a.eventBus || a._eventBus
  eb?.on?.('pagesinit', () => scrollPdfTop(0))
  eb?.on?.('pagesloaded', () => scrollPdfTop(0))

  pages.value = a.pdfViewer?.pagesCount || a.pagesCount || 0
  page.value  = a.pdfViewer?.currentPageNumber || a.page || 1
  scale.value = a.pdfViewer?.currentScale || 1
  pdfReady.value = true

  loadOutline()

  // 🔎 actualizamos resultados cuando PDF.js progresa con los matches
  eb?.on?.('updatefindmatchescount', () => collectFindMatches())
  eb?.on?.('updatetextlayermatches', () => collectFindMatches())

  if (infoInterval) clearInterval(infoInterval)
  infoInterval = setInterval(() => {
    const m = app(); if (!m) return
    const cur = m.pdfViewer?.currentPageNumber || m.page || 1
    const cnt = m.pdfViewer?.pagesCount || m.pagesCount || 0
    const sc  = m.pdfViewer?.currentScale || 1
    if (cur !== page.value)  page.value  = cur
    if (cnt !== pages.value) pages.value = cnt
    if (Math.abs(sc - scale.value) > 0.001) scale.value = sc
  }, 350)
}

/* ------------ navegación y zoom ------------- */
function setPage (n) {
  const a = app(); if (!a) return
  waitForPagesReady().then(ok => {
    if (!ok) return
    try { a.pdfViewer.currentPageNumber = Number(n) }
    catch {
      const url = new URL(frame.value.src)
      const params = new URLSearchParams(url.hash.replace(/^#/, ''))
      params.set('page', String(n))
      url.hash = `#${params.toString()}`
      frame.value.src = url.toString()
    }
  })
}
function pdfGo   () { if (page.value>=1 && (!pages.value || page.value<=pages.value)) setPage(page.value) }
function pdfNext () { setPage(Math.min(page.value + 1, pages.value || page.value + 1)) }
function pdfPrev () { setPage(Math.max(page.value - 1, 1)) }
function zoomIn  () { const a = app(); if (!a) return; a.pdfViewer.currentScale = Math.min((a.pdfViewer.currentScale || 1) * 1.10, 3) }
function zoomOut () { const a = app(); if (!a) return; a.pdfViewer.currentScale = Math.max((a.pdfViewer.currentScale || 1) / 1.10, 0.5) }

/* ------------ buscador integrado ------------- */
const panelQ = ref('')

// Resultados de búsqueda en PDF: total + por página (ordenado)
const results = ref({ total: 0, pages: [] }) // pages: [{page, count}]
const resultsCollapsed = ref(false)
function clearResults(){ results.value = { total: 0, pages: [] } }
watch(panelQ, (v) => { if (!v?.trim()) clearResults() })

/* ✅ contador correcto por página (soporta frases y palabras) */
function collectFindMatches () {
  try {
    const a = app(); if (!a) return
    const fc =
      a.pdfViewer?.findController ||
      a.findController ||
      a._findController
    if (!fc) return

    const pm  = fc._pageMatches || []          // array<array<number>>
    const pml = fc._pageMatchesLength || []    // array<array<number>> (para frases)

    let total = 0
    const pagesArr = []
    for (let i = 0; i < pm.length; i++) {
      const arr = Array.isArray(pml[i]) && pml[i].length > 0
        ? pml[i]
        : (Array.isArray(pm[i]) ? pm[i] : [])
      const cnt = Array.isArray(arr) ? arr.length : (typeof arr === 'number' ? arr : 0)
      if (cnt > 0) {
        pagesArr.push({ page: i + 1, count: cnt })
        total += cnt
      }
    }
    pagesArr.sort((a,b) => a.page - b.page)
    results.value = { total, pages: pagesArr }
  } catch { /* noop */ }
}

function panelFind () {
  const a = app(); if (!a) return
  const eb = a.eventBus || a._eventBus
  eb?.dispatch?.('find', {
    source: a, type: 'find',
    query: panelQ.value || '',
    phraseSearch: true,
    caseSensitive: false,
    entireWord:   false,
    highlightAll: true,
    findPrevious: false
  })
  // pequeña espera para el primer recuento
  setTimeout(collectFindMatches, 200)
}

/* ------------ índice plano + expandible ------------- */
const outlineFlat = ref([])        // [{id,parentId,level,title,dest,url,hasChildren,page,destArray}]
const expanded    = ref(new Set()) // ids abiertos
const asideTab    = ref('indice')

function isExpanded (n) { return expanded.value.has(n.id) }
function toggleExpand (n) {
  if (!n.hasChildren) return
  const s = new Set(expanded.value)
  s.has(n.id) ? s.delete(n.id) : s.add(n.id)
  expanded.value = s
  scrollPdfTop(0)
}
function expandAll   () {
  const s = new Set()
  outlineFlat.value.forEach(n => n.hasChildren && s.add(n.id))
  expanded.value = s
  scrollPdfTop(0)
}
function collapseAll () { expanded.value = new Set(); scrollPdfTop(0) }

const visibleOutline = computed(() => {
  const byId = new Map(outlineFlat.value.map(n => [n.id, n]))
  const cache = new Map()
  const ancestors = (id) => {
    if (cache.has(id)) return cache.get(id)
    const arr = []
    let cur = byId.get(id)
    while (cur && cur.parentId) { arr.unshift(cur.parentId); cur = byId.get(cur.parentId) }
    cache.set(id, arr)
    return arr
  }
  const q = (panelQ.value || '').trim().toLowerCase()
  if (!q) return outlineFlat.value.filter(n => n.level === 0 || ancestors(n.id).every(pid => expanded.value.has(pid)))
  const keep = new Set()
  for (const n of outlineFlat.value) {
    const t = (n.title || '').toLowerCase()
    if (t.includes(q)) {
      keep.add(n.id)
      for (const pid of ancestors(n.id)) keep.add(pid)
    }
  }
  return outlineFlat.value.filter(n => keep.has(n.id))
})

/* ---- contador “Resultados en ÍNDICE” (solo títulos) ---- */
const numberFmt = new Intl.NumberFormat('es-ES')
const nf = (n) => numberFmt.format(n)
const idxCount = computed(() => {
  const q = (panelQ.value || '').trim().toLowerCase()
  if (!q) return 0
  return outlineFlat.value.reduce((acc, n) => {
    const t = (n.title || '').toLowerCase()
    return acc + (t.includes(q) ? 1 : 0)
  }, 0)
})

const activeOutlinePage = computed(() => {
  const cand = outlineFlat.value.filter(n => n.page && n.page <= page.value)
  return cand.length ? cand[cand.length - 1].page : null
})

async function loadOutline () {
  outlineFlat.value = []
  try {
    const a = app(); if (!a) return
    const pdfDoc = a.pdfDocument || a.pdfViewer?.pdfDocument
    if (!pdfDoc) return

    const tree = await pdfDoc.getOutline() || []
    const flat = []
    const walk = (items, level, parentId, prefix) => {
      ;(items || []).forEach((it, idx) => {
        const id = prefix ? `${prefix}-${idx}` : `${idx}`
        const hasChildren = !!(it.items && it.items.length)
        flat.push({ id, parentId, level, title: it.title, dest: it.dest, url: it.url || null, hasChildren, destArray: null, page: null })
        if (hasChildren) walk(it.items, level + 1, id, id)
      })
    }
    walk(tree, 0, null, '')
    // resolver destinos -> páginas
    for (const n of flat) {
      if (!n.dest) continue
      let dest = n.dest
      if (typeof dest === 'string') dest = await pdfDoc.getDestination(dest)
      if (Array.isArray(dest)) {
        n.destArray = dest
        const [ref] = dest
        n.page = (await pdfDoc.getPageIndex(ref)) + 1
      }
    }
    outlineFlat.value = flat
    expanded.value = new Set(flat.filter(n => n.hasChildren).map(n => n.id))
  } catch { outlineFlat.value = [] }
}

async function openOutline (n) {
  const a = app(); if (!a) return
  if (!n || (!n.dest && !n.url)) return
  if (n.url) { window.open(n.url, '_blank'); return }
  try {
    const ls = linkService()
    if (ls?.navigateTo) { ls.navigateTo(n.dest); return }
  } catch {}
  try {
    const pdfDoc = a.pdfDocument || a.pdfViewer?.pdfDocument
    if (!pdfDoc) return
    let dest = n.dest
    if (typeof dest === 'string') dest = await pdfDoc.getDestination(dest)
    if (Array.isArray(dest)) {
      const [ref] = dest
      const pageIdx = await pdfDoc.getPageIndex(ref)
      const pageNum = pageIdx + 1
      if (a.pdfViewer?.scrollPageIntoView) { a.pdfViewer.scrollPageIntoView({ pageNumber: pageNum, destArray: dest }); return }
      const ls = linkService()
      const hash = ls?.getDestinationHash?.(dest)
      if (hash) {
        const url = new URL(frame.value.src)
        url.hash = hash.startsWith('#') ? hash : ('#' + hash)
        frame.value.src = url.toString()
        return
      }
      setPage(pageNum)
    }
  } catch (e) { console.warn('openOutline fallback error', e) }
}

/* ------------ helpers highlight ------------- */
function escapeHtml (s='') {
  return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')
}
function escapeRegExp (s='') { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
function highlightTitle (title) {
  const clean = escapeHtml(title || 'Sección')
  const q = (panelQ.value || '').trim()
  if (!q) return clean
  const re = new RegExp(escapeRegExp(q), 'ig')
  return clean.replace(re, (m) => `<mark>${m}</mark>`)
}

/* ------------ marcadores ------------- */
const KEY = computed(() => `doc:${route.params.id}:bmks`)
const bookmarks = ref([])
function loadBookmarks () { bookmarks.value = JSON.parse(localStorage.getItem(KEY.value) || '[]') }
function saveBookmarks () { localStorage.setItem(KEY.value, JSON.stringify(bookmarks.value)) }
function addBookmark () {
  const label = prompt('Etiqueta (opcional):', `Página ${page.value}`) || `Página ${page.value}`
  bookmarks.value.unshift({ page: page.value, label, ts: Date.now() })
  saveBookmarks()
}
function delBookmark (i) { bookmarks.value.splice(i, 1); saveBookmarks() }
function clearBookmarks () { if (confirm('¿Borrar todos los marcadores?')) { bookmarks.value = []; saveBookmarks() } }
function openBookmark (b) { setPage(b.page) }

/* ------------ lifecycle ------------- */
watch(() => route.params.id, () => {
  pdfReady.value = false
  page.value = 1; pages.value = 0
  outlineFlat.value = []; expanded.value = new Set()
  panelQ.value = ''
  useNative.value = false
  bust.value = Date.now().toString(); setFrameKey()
  clearResults()
  loadDoc(); loadBookmarks()
})
watch(asideTab, () => scrollPdfTop(0))

onMounted(() => { setFrameKey(); loadDoc(); loadBookmarks() })
onBeforeUnmount(() => { if (infoInterval) clearInterval(infoInterval); resizing = false })

/* ------------ UI utils ------------- */
const snack = ref({ show: false, msg: '' })
function toast (m) { snack.value = { show: true, msg: m } }
</script>






<style scoped>
/* ====== Vars ====== */
.reader-root{
  --tabs-h: 44px;
  --tabs-div: 1px;
  --tabs-offset: calc(var(--tabs-h) + var(--tabs-div));
}

/* ====== Grid raíz ====== */
.reader-root{
  height: 100vh;
  display: grid;
  grid-template-rows: 44px auto 1fr;
  min-height: 0;
  background: rgb(var(--v-theme-background));
}
.topbar{ height: 44px; padding: 0 8px !important; }

/* ====== Mini header ====== */
.mini-header{
  position: sticky; top: 0; z-index: 5;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .06);
  padding: 6px 10px 8px;
  display: grid; grid-template-columns: 1fr auto; align-items: center;
}
.mini-left{ display:flex; align-items:center; }
.mini-label{ font-size:.9rem; color: rgba(var(--v-theme-on-surface), .7); }
.mini-right{ font-variant-numeric: tabular-nums; font-size:.85rem; color: rgba(var(--v-theme-on-surface), .6); }
.mini-progress{ grid-column:1/-1; height:3px; background: rgba(var(--v-theme-on-surface), .08); margin-top:6px; border-radius:2px; overflow:hidden; }
.mini-bar{ height:100%; background: rgb(var(--v-theme-primary)); transition: width .2s ease; }

/* ====== Fila principal ====== */
.main-row{ display:flex; min-height:0; }

/* ====== Aside ====== */
.aside-wrap{ flex:1; min-height:0; display:flex; flex-direction:column; padding:8px; }
.aside-card{
  flex:1; min-height:0; display:flex; flex-direction:column;
  background: rgb(var(--v-theme-surface));
  border:1px solid rgba(var(--v-theme-on-surface), .08);
}

/* ÚNICO scroller (tabs + header + resultados + listas) */
.aside-scroll{
  flex:1 1 auto; min-height:0;
  overflow-y: auto; overflow-x: hidden;
  position: relative;
  scrollbar-gutter: stable both-edges;
}

/* Tabs sticky */
.tabs-stick{
  position: sticky; top: 0; z-index: 20;
  background: rgb(var(--v-theme-surface));
}
:deep(.aside-tabs){ height: var(--tabs-h) !important; }
:deep(.aside-tabs .v-slide-group),
:deep(.aside-tabs .v-slide-group__container),
:deep(.aside-tabs .v-slide-group__content),
:deep(.aside-tabs .v-tab){
  height: var(--tabs-h) !important; min-height: 0 !important;
}
:deep(.aside-tabs .v-tab__slider){ bottom: 0; }

/* Paneles internos */
.aside-pane{ display:flex; flex-direction:column; flex:1 1 auto; min-height:0; overflow: visible; }

/* Header de búsqueda sticky (debajo de tabs) */
.aside-stick{
  position: sticky;
  top: var(--tabs-offset);
  z-index: 10;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .06);
}

/* Resultados de búsqueda */
.results-box{
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .06);
  background: rgb(var(--v-theme-surface));
}
.results-head{
  display:flex; align-items:center; justify-content:space-between;
  padding: 6px 12px;
  gap: 8px;
}
.results-head .line{ line-height: 1.3; }
.results-list{ padding: 0 6px 6px; }

/* Lista índice */
.outline-col{ flex:1 1 auto; min-height:0; display:flex; }
.outline-scroll{ flex:1 1 auto; min-height:0; overflow: visible; padding: 0 12px 12px; }
.outline-list .v-list-item.is-active{ background: rgba(var(--v-theme-primary), .08); }
.outline-list mark{ padding:0 2px; border-radius:2px; }

/* Scrollbars del aside */
.aside-scroll::-webkit-scrollbar{ width:10px; }
.aside-scroll::-webkit-scrollbar-thumb{ background: rgba(var(--v-theme-on-surface), .38); border-radius:8px; }
.aside-scroll::-webkit-scrollbar-track{ background: rgba(var(--v-theme-on-surface), .06); }
.aside-scroll{ scrollbar-width: thin; scrollbar-color: rgba(var(--v-theme-on-surface), .45) transparent; }

/* Marcadores */
.bookmark-scroll{
  flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden;
  padding: 0 12px 12px; overscroll-behavior: contain; scrollbar-gutter: stable both-edges;
}
.bookmark-scroll::-webkit-scrollbar{ width:10px; }
.bookmark-scroll::-webkit-scrollbar-thumb{ background: rgba(var(--v-theme-on-surface), .38); border-radius:8px; }
.bookmark-scroll::-webkit-scrollbar-track{ background: rgba(var(--v-theme-on-surface), .06); }
.bookmark-scroll{ scrollbar-width: thin; scrollbar-color: rgba(var(--v-theme-on-surface), .45) transparent; }

/* Resizer del aside */
.aside-resizer{ width:6px; cursor:col-resize; background:transparent; }

/* Visor */
.viewer-col{ flex:1; min-width:0; display:flex; flex-direction:column; min-height:0; }
.viewer-box{ flex:1; min-height:0; }
.viewer-embed{ width:100%; height:100%; border:0; display:block; }
</style>
