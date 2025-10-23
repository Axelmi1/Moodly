<template>
  <div class="mood-container">
    <!-- Tabs pour naviguer entre les sections -->
    <div class="tabs">
      <button @click="activeTab = 'today'" :class="['tab', { active: activeTab === 'today' }]">
        📝 Aujourd'hui
      </button>
      <button @click="activeTab = 'history'" :class="['tab', { active: activeTab === 'history' }]">
        📊 Mon historique
      </button>
    </div>

    <!-- Section: Enregistrer le moral du jour -->
    <div v-if="activeTab === 'today'" class="mood-card">
      <div class="header">
        <h2>😊 Mon moral du jour</h2>
        <button @click="logout" class="logout-btn">Déconnexion</button>
      </div>
      
      <div class="emoji-selector">
        <div v-for="n in 5" :key="n" @click="score=n" :class="['emoji-btn', { active: n === score }]">
          <span class="emoji">{{ ['😞','🙁','😐','🙂','😁'][n-1] }}</span>
          <span class="label">{{ ['Très mauvais', 'Mauvais', 'Moyen', 'Bon', 'Excellent'][n-1] }}</span>
        </div>
      </div>
      
      <div class="tag-section">
        <label>Catégorie (optionnel) :</label>
    <select v-model="tag">
          <option value="">— Choisir une catégorie —</option>
          <option value="stress">😰 Stress</option>
          <option value="charge">💼 Charge de travail</option>
          <option value="ambiance">🎉 Ambiance</option>
          <option value="motivation">🚀 Motivation</option>
    </select>
      </div>

      <!-- Nouvelle feature: Commentaire anonyme -->
      <div class="comment-section">
        <label>💬 Commentaire anonyme (optionnel) :</label>
        <textarea 
          v-model="comment" 
          placeholder="Partagez ce qui influence votre moral... (max 500 caractères)"
          maxlength="500"
          rows="4"
        ></textarea>
        <div class="char-counter">{{ comment.length }}/500 caractères</div>
      </div>
      
      <button @click="send" :disabled="!score" class="submit-btn">
        {{ score ? '✅ Envoyer mon moral' : '👆 Sélectionnez votre moral' }}
      </button>
    </div>

    <!-- Section: Historique personnel -->
    <div v-if="activeTab === 'history'" class="mood-card history-card">
      <div class="header">
        <h2>📊 Mon historique</h2>
        <button @click="logout" class="logout-btn">Déconnexion</button>
      </div>

      <!-- Statistiques personnelles -->
      <div class="personal-stats">
        <div class="stat-box">
          <div class="stat-icon">📈</div>
          <div class="stat-label">Moral moyen</div>
          <div class="stat-value">{{ myAverageMood.toFixed(1) }}/5</div>
        </div>
        <div class="stat-box">
          <div class="stat-icon">📅</div>
          <div class="stat-label">Entrées totales</div>
          <div class="stat-value">{{ myHistory.length }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-icon">🎯</div>
          <div class="stat-label">Tendance 7j</div>
          <div class="stat-value">{{ myTrend }}</div>
        </div>
      </div>

      <!-- Liste des entrées récentes -->
      <div class="history-list">
        <h3>📝 Dernières entrées</h3>
        <div v-if="myHistory.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <p>Aucune entrée pour le moment</p>
          <button @click="activeTab = 'today'" class="empty-btn">Enregistrer mon moral</button>
        </div>
        <div v-else class="history-items">
          <div v-for="entry in myHistory.slice(0, 10)" :key="entry.id" class="history-item">
            <div class="history-emoji">{{ ['😞','🙁','😐','🙂','😁'][entry.score-1] }}</div>
            <div class="history-info">
              <div class="history-date">{{ formatDate(entry.createdAt) }}</div>
              <div class="history-tag" v-if="entry.tag">{{ getTagLabel(entry.tag) }}</div>
              <div class="history-comment" v-if="entry.comment">
                💬 {{ entry.comment }}
              </div>
            </div>
            <div class="history-score">{{ entry.score }}/5</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { api, setAuth, clearAuth } from '../api'
import { useRouter } from 'vue-router'

const router = useRouter()
const score = ref(0)
const tag = ref('')
const comment = ref('')
const userId = ref(null)
const activeTab = ref('today')
const myHistory = ref([])

onMounted(async () => {
  const jwt = localStorage.getItem('jwt')
  if (!jwt) return router.push('/')
  setAuth(jwt)

  try {
    const me = await api.get('/api/users/me')
    userId.value = me.data.id
    await loadHistory()
  } catch (e) {
    alert('Session invalide, reconnecte-toi.')
    router.push('/')
  }
})

const loadHistory = async () => {
  try {
    console.log('🔍 Chargement historique pour userId:', userId.value)
    const { data } = await api.get(`/api/moods?filters[user][id][$eq]=${userId.value}&sort=createdAt:desc&pagination[limit]=50`)
    console.log('📊 Données historique reçues:', data)
    myHistory.value = data.data || []
  } catch (e) {
    console.error('❌ Erreur lors du chargement de l\'historique:', e)
    myHistory.value = []
  }
}

const myAverageMood = computed(() => {
  if (myHistory.value.length === 0) return 0
  const sum = myHistory.value.reduce((acc, entry) => acc + entry.score, 0)
  return sum / myHistory.value.length
})

const myTrend = computed(() => {
  if (myHistory.value.length < 2) return '→'
  
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  
  const thisWeek = myHistory.value.filter(m => new Date(m.createdAt) >= oneWeekAgo)
  const lastWeek = myHistory.value.filter(m => {
    const date = new Date(m.createdAt)
    return date >= twoWeeksAgo && date < oneWeekAgo
  })
  
  const thisWeekAvg = thisWeek.length > 0 ? thisWeek.reduce((a, b) => a + b.score, 0) / thisWeek.length : 0
  const lastWeekAvg = lastWeek.length > 0 ? lastWeek.reduce((a, b) => a + b.score, 0) / lastWeek.length : 0
  
  if (thisWeekAvg > lastWeekAvg + 0.3) return '📈'
  if (thisWeekAvg < lastWeekAvg - 0.3) return '📉'
  return '→'
})

const send = async () => {
  if (!score.value) return alert('Choisis un niveau 1–5')
  try {
    await api.post('/api/moods', {
      data: { 
        score: score.value, 
        tag: tag.value,
        comment: comment.value 
      }
    })
    alert('✅ Mood enregistré !')
    // Reset form
    score.value = 0
    tag.value = ''
    comment.value = ''
    // Recharger l'historique
    await loadHistory()
  } catch (e) {
    console.error(e)
    alert('❌ Erreur lors de l\'enregistrement (permissions ou schéma).')
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Aujourd\'hui'
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} jours`
  
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const getTagLabel = (tag) => {
  const labels = {
    'stress': '😰 Stress',
    'charge': '💼 Charge de travail',
    'ambiance': '🎉 Ambiance',
    'motivation': '🚀 Motivation'
  }
  return labels[tag] || tag
}

const logout = () => {
  localStorage.removeItem('jwt')
  localStorage.removeItem('role')
  localStorage.removeItem('userId')
  localStorage.removeItem('username')
  clearAuth()
  router.push('/')
}
</script>


<style>
/* Variables CSS pour la cohérence */
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --success-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  --danger-gradient: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  --border-radius: 20px;
  --border-radius-sm: 12px;
  --shadow: 0 15px 35px rgba(0,0,0,0.2);
  --shadow-sm: 0 4px 6px rgba(0,0,0,0.1);
  --transition: all 0.3s ease;
}

.mood-container {
  min-height: 100vh;
  background: var(--primary-gradient);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 60px;
  position: relative;
  overflow: hidden;
}

/* Effet de fond animé */
.mood-container::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: float 8s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.mood-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: var(--border-radius);
  padding: 40px;
  box-shadow: var(--shadow);
  width: 100%;
  max-width: 600px;
  text-align: center;
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
  gap: 20px;
}

h2 {
  margin: 0;
  color: #333;
  font-size: 28px;
  font-weight: 800;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logout-btn {
  background: var(--danger-gradient);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: var(--border-radius-sm);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(231, 76, 60, 0.3);
}

.emoji-selector {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin: 40px 0;
}

.emoji-btn {
  cursor: pointer;
  padding: 20px 15px;
  border-radius: var(--border-radius-sm);
  border: 3px solid #e1e5e9;
  transition: var(--transition);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  position: relative;
  overflow: hidden;
}

.emoji-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.5s;
}

.emoji-btn:hover::before {
  left: 100%;
}

.emoji-btn:hover {
  border-color: #667eea;
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.2);
}

.emoji-btn.active {
  border-color: #667eea;
  background: var(--primary-gradient);
  color: white;
  transform: scale(1.05);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.emoji {
  display: block;
  font-size: 40px;
  margin-bottom: 8px;
  transition: var(--transition);
}

.emoji-btn:hover .emoji {
  transform: scale(1.1);
}

.label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}

.tag-section {
  margin: 40px 0;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 12px;
  color: #333;
  font-weight: 600;
  font-size: 16px;
}

select {
  width: 100%;
  padding: 18px 20px;
  border: 2px solid #e1e5e9;
  border-radius: var(--border-radius-sm);
  font-size: 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  cursor: pointer;
  transition: var(--transition);
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 15px center;
  background-size: 20px;
  padding-right: 50px;
}

select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
}

.submit-btn {
  width: 100%;
  padding: 20px;
  border: none;
  border-radius: var(--border-radius-sm);
  background: var(--success-gradient);
  color: white;
  font-weight: 700;
  font-size: 18px;
  cursor: pointer;
  margin-top: 30px;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.submit-btn:hover::before {
  left: 100%;
}

.submit-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(79, 172, 254, 0.3);
}

.submit-btn:active {
  transform: scale(0.98);
}

.submit-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Desktop optimizations */
@media (min-width: 1024px) {
  .mood-container {
    padding: 40px;
  }
  
  .mood-card {
    max-width: 700px;
    padding: 50px;
  }
  
  h2 {
    font-size: 32px;
  }
  
  .emoji-selector {
    gap: 25px;
    margin: 50px 0;
  }
  
  .emoji-btn {
    padding: 25px 20px;
  }
  
  .emoji {
    font-size: 48px;
  }
  
  .label {
    font-size: 14px;
  }
  
  select {
    padding: 20px 25px;
    font-size: 18px;
  }
  
  .submit-btn {
    padding: 22px;
    font-size: 20px;
  }
}

/* Tablet optimizations */
@media (min-width: 768px) and (max-width: 1023px) {
  .mood-container {
    padding: 30px;
  }
  
  .mood-card {
    max-width: 600px;
    padding: 45px;
  }
  
  h2 {
    font-size: 26px;
  }
  
  .emoji-selector {
    gap: 18px;
  }
  
  .emoji-btn {
    padding: 18px 12px;
  }
  
  .emoji {
    font-size: 36px;
  }
  
  .label {
    font-size: 12px;
  }
}

/* Mobile optimizations */
@media (max-width: 767px) {
  .mood-container {
    padding: 15px;
  }
  
  .mood-card {
    padding: 30px 20px;
    max-width: 100%;
  }
  
  .header {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  h2 {
    font-size: 24px;
  }
  
  .emoji-selector {
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
    margin: 30px 0;
  }
  
  .emoji-btn {
    padding: 15px 8px;
  }
  
  .emoji {
    font-size: 28px;
  }
  
  .label {
    font-size: 11px;
  }
  
  select, .submit-btn {
    font-size: 16px; /* Prevents zoom on iOS */
  }
  
  .tag-section {
    margin: 30px 0;
  }
}

/* Très petits écrans */
@media (max-width: 480px) {
  .mood-container {
    padding: 10px;
  }
  
  .mood-card {
    padding: 25px 15px;
  }
  
  h2 {
    font-size: 20px;
  }
  
  .emoji-selector {
    gap: 8px;
  }
  
  .emoji-btn {
    padding: 12px 6px;
  }
  
  .emoji {
    font-size: 24px;
  }
  
  .label {
    font-size: 10px;
  }
  
  .submit-btn {
    padding: 16px;
    font-size: 16px;
  }
}

/* Styles pour les nouvelles features */

/* Tabs */
.tabs {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  position: relative;
  z-index: 1;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 8px;
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.tab {
  flex: 1;
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  opacity: 0;
  transition: var(--transition);
}

.tab:hover::before {
  opacity: 1;
}

.tab:hover {
  color: white;
  transform: translateY(-1px);
}

.tab.active {
  background: rgba(255, 255, 255, 0.95);
  color: #667eea;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.tab.active::before {
  opacity: 0;
}

/* Section commentaire */
.comment-section {
  margin: 30px 0;
  text-align: left;
}

.comment-section label {
  display: block;
  margin-bottom: 12px;
  color: #333;
  font-weight: 600;
  font-size: 16px;
}

.comment-section textarea {
  width: 100%;
  padding: 18px 20px;
  border: 2px solid #e1e5e9;
  border-radius: var(--border-radius-sm);
  font-size: 16px;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  transition: var(--transition);
  resize: vertical;
  min-height: 100px;
  color: #333;
}

.comment-section textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
}

.comment-section textarea::placeholder {
  color: #999;
}

.char-counter {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

/* Historique personnel */
.history-card {
  max-width: 800px;
}

.personal-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.stat-box {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: var(--border-radius-sm);
  padding: 20px;
  text-align: center;
  transition: var(--transition);
  border: 2px solid transparent;
}

.stat-box:hover {
  border-color: #667eea;
  transform: translateY(-3px);
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 600;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #333;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Liste historique */
.history-list {
  margin-top: 40px;
}

.history-list h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state p {
  color: #666;
  font-size: 16px;
  margin-bottom: 20px;
}

.empty-btn {
  background: var(--primary-gradient);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: var(--border-radius-sm);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.empty-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: rgba(248, 249, 250, 0.8);
  border-radius: var(--border-radius-sm);
  border: 2px solid transparent;
  transition: var(--transition);
}

.history-item:hover {
  border-color: #667eea;
  transform: translateX(5px);
  box-shadow: var(--shadow-sm);
}

.history-emoji {
  font-size: 40px;
  flex-shrink: 0;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-date {
  font-size: 14px;
  color: #666;
  font-weight: 600;
  margin-bottom: 5px;
}

.history-tag {
  font-size: 13px;
  color: #667eea;
  margin-bottom: 8px;
  font-weight: 500;
}

.history-comment {
  font-size: 14px;
  color: #555;
  font-style: italic;
  line-height: 1.5;
  padding: 10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.history-score {
  font-size: 24px;
  font-weight: 800;
  color: #333;
  flex-shrink: 0;
  min-width: 60px;
  text-align: right;
}

/* Responsive pour les nouvelles features */
@media (max-width: 767px) {
  .tabs {
    gap: 8px;
  }
  
  .tab {
    padding: 12px 15px;
    font-size: 14px;
  }
  
  .personal-stats {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .history-item {
    gap: 15px;
    padding: 15px;
  }
  
  .history-emoji {
    font-size: 32px;
  }
  
  .history-score {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .tabs {
    flex-direction: column;
  }
  
  .comment-section textarea {
    font-size: 16px; /* Prevents zoom on iOS */
  }
}

/* Mode sombre (optionnel) */
@media (prefers-color-scheme: dark) {
  .mood-card {
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  h2 {
    color: #fff;
  }
  
  label {
    color: #fff;
  }
  
  .emoji-btn {
    background: rgba(50, 50, 50, 0.9);
    border-color: #444;
  }
  
  select {
    background: rgba(50, 50, 50, 0.9);
    border-color: #444;
    color: #fff;
  }
  
  select:focus {
    border-color: #667eea;
  }
}
</style>
