  <template>
    <div class="manager-container">
      <!-- Header -->
      <div class="manager-header">
        <h1 class="manager-title">📊 Tableau de bord du moral</h1>
        <button @click="logout" class="logout-btn">Déconnexion</button>
      </div>

      <!-- Statistiques générales -->
      <div class="stats-grid">
        <div class="stat-card primary">
          <h3 class="stat-title">Moral Moyen</h3>
          <div class="stat-emoji-large">{{ getMoodEmoji(averageMood) }}</div>
          <div class="stat-value">{{ averageMood.toFixed(1) }}/5</div>
        </div>
        <div class="stat-card secondary">
          <h3 class="stat-title">Total Entrées</h3>
          <div class="stat-value">{{ totalEntries }}</div>
          <div class="stat-subtitle">derniers 30 jours</div>
        </div>
        <div class="stat-card success">
          <h3 class="stat-title">Tendance</h3>
          <div class="stat-emoji-large">{{ trend }}</div>
          <div class="stat-subtitle">vs semaine dernière</div>
        </div>
      </div>

      <!-- Graphique principal -->
      <div class="chart-container">
        <h3 class="chart-title">📈 Évolution du moral (7 derniers jours)</h3>
        <div class="chart-wrapper">
          <Line v-if="ready" :data="chartData" :options="options" />
        </div>
      </div>

      <!-- Répartition par tags -->
      <div class="tags-container">
        <h3 class="tags-title">🏷️ Répartition par catégories</h3>
        <div class="tags-grid">
          <div v-for="(count, tag) in tagStats" :key="tag" class="tag-card">
            <span class="tag-emoji">{{ getTagEmoji(tag) }}</span>
            <div class="tag-name">{{ tag || 'Sans tag' }}</div>
            <div class="tag-count">{{ count }} entrée{{ count > 1 ? 's' : '' }}</div>
          </div>
        </div>
      </div>

      <!-- Nouvelle feature: Commentaires anonymes récents -->
      <div class="comments-container">
        <h3 class="comments-title">💬 Commentaires récents (anonymes)</h3>
        <div v-if="recentComments.length === 0" class="empty-comments">
          <div class="empty-icon">💭</div>
          <p>Aucun commentaire pour le moment</p>
        </div>
        <div v-else class="comments-grid">
          <div v-for="comment in recentComments" :key="comment.id" class="comment-card">
            <div class="comment-header">
              <span class="comment-emoji">{{ ['😞','🙁','😐','🙂','😁'][comment.score-1] }}</span>
              <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
            </div>
            <div class="comment-text">{{ comment.comment }}</div>
            <div v-if="comment.tag" class="comment-tag">{{ getTagLabel(comment.tag) }}</div>
          </div>
        </div>
      </div>

      <!-- Nouvelle feature: Objectif d'équipe -->
      <div class="goal-container">
        <h3 class="goal-title">🎯 Objectif d'équipe</h3>
        <div class="goal-content">
          <div class="goal-info">
            <div class="goal-label">Objectif de moral moyen</div>
            <div class="goal-target">4.0/5</div>
          </div>
          <div class="goal-progress-container">
            <div class="goal-progress-bar">
              <div 
                class="goal-progress-fill" 
                :style="{ width: goalProgress + '%' }"
                :class="{ achieved: goalAchieved }"
              ></div>
            </div>
            <div class="goal-percentage">{{ goalProgress.toFixed(0) }}%</div>
          </div>
          <div class="goal-status">
            <span v-if="goalAchieved" class="status-achieved">✅ Objectif atteint !</span>
            <span v-else class="status-pending">⏳ {{ (4.0 - averageMood).toFixed(1) }} points pour atteindre l'objectif</span>
          </div>
        </div>
      </div>
    </div>
  </template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { api, setAuth, clearAuth } from '../api'
import { Line } from 'vue-chartjs'
import { Chart, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js'
import { useRouter } from 'vue-router'

const router = useRouter()
Chart.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend)

const chartData = ref({ labels: [], datasets: [{ label: 'Moral moyen', data: [] }] })
const options = { 
  responsive: true, 
  tension: 0.4,
  plugins: {
    legend: { display: true, position: 'top' },
    tooltip: {
      callbacks: {
        label: function(context) {
          return `Moral: ${context.parsed.y.toFixed(1)}/5`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 5,
      ticks: {
        stepSize: 1,
        callback: function(value) {
          return ['😞','🙁','😐','🙂','😁'][value-1] || value
        }
      }
    }
  }
}
const ready = ref(false)
const averageMood = ref(0)
const totalEntries = ref(0)
const trend = ref('→')
const tagStats = ref({})
const recentComments = ref([])

// Computed pour l'objectif d'équipe
const goalProgress = computed(() => {
  const goal = 4.0
  return Math.min((averageMood.value / goal) * 100, 100)
})

const goalAchieved = computed(() => {
  return averageMood.value >= 4.0
})

onMounted(async () => {
  const jwt = localStorage.getItem('jwt'); if(!jwt) location.href='/'
  setAuth(jwt)

  try {
    // Récupérer toutes les données
    const { data } = await api.get('/api/moods?pagination[limit]=1000&sort=createdAt:desc')
    const moods = data.data

    if (moods.length === 0) {
      alert('Aucune donnée de moral trouvée. Demandez aux employés de saisir leur moral !')
      return
    }

    // Calculer les statistiques générales
    const scores = moods.map(m => m.score)
    averageMood.value = scores.reduce((a, b) => a + b, 0) / scores.length
    totalEntries.value = moods.length

    // Calculer la tendance (comparaison semaine actuelle vs précédente)
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const thisWeek = moods.filter(m => new Date(m.createdAt) >= oneWeekAgo)
    const lastWeek = moods.filter(m => {
      const date = new Date(m.createdAt)
      return date >= twoWeeksAgo && date < oneWeekAgo
    })

    const thisWeekAvg = thisWeek.length > 0 ? thisWeek.reduce((a, b) => a + b.score, 0) / thisWeek.length : 0
    const lastWeekAvg = lastWeek.length > 0 ? lastWeek.reduce((a, b) => a + b.score, 0) / lastWeek.length : 0

    if (thisWeekAvg > lastWeekAvg + 0.2) trend.value = '📈'
    else if (thisWeekAvg < lastWeekAvg - 0.2) trend.value = '📉'
    else trend.value = '→'

    // Statistiques par tags
      const tags = {}
      moods.forEach(m => {
        const tag = m.tag || 'Sans tag'
        tags[tag] = (tags[tag] || 0) + 1
      })
      tagStats.value = tags

      // Charger les commentaires récents (avec commentaires non vides)
      recentComments.value = moods
        .filter(m => m.comment && m.comment.trim().length > 0)
        .slice(0, 5)

      // Préparer les données du graphique (7 derniers jours)
    const byDate = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      byDate[key] = []
    }

    moods.forEach(m => {
      const key = m.createdAt.slice(0, 10)
      if (byDate[key]) byDate[key].push(m.score)
    })

    const labels = Object.keys(byDate).map(date => {
      const d = new Date(date)
      return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
    })

    const values = Object.values(byDate).map(arr => {
      if (arr.length === 0) return null
      return arr.reduce((a, b) => a + b, 0) / arr.length
    })

    chartData.value = {
      labels,
      datasets: [{
        label: 'Moral moyen',
        data: values,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        fill: true
      }]
    }

    ready.value = true
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
    alert('Erreur lors du chargement des données du graphique')
  }
})

const getMoodEmoji = (score) => {
  if (score >= 4.5) return '😁'
  if (score >= 3.5) return '🙂'
  if (score >= 2.5) return '😐'
  if (score >= 1.5) return '🙁'
  return '😞'
}

const getTagEmoji = (tag) => {
  const emojis = {
    'stress': '😰',
    'charge': '💼',
    'ambiance': '🎉',
    'motivation': '🚀',
    'Sans tag': '📝'
  }
  return emojis[tag] || '📝'
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

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Aujourd\'hui'
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} jours`
  
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
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
  --border-radius: 16px;
  --border-radius-sm: 12px;
  --shadow: 0 10px 30px rgba(0,0,0,0.2);
  --shadow-sm: 0 4px 6px rgba(0,0,0,0.1);
  --transition: all 0.3s ease;
}

.manager-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
}

/* Effet de fond subtil */
.manager-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(240, 147, 251, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

/* Header responsive */
.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
  gap: 20px;
  position: relative;
  z-index: 1;
}

.manager-title {
  font-size: 32px;
  font-weight: 800;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.logout-btn {
  background: var(--danger-gradient);
  color: white;
  border: none;
  padding: 12px 24px;
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

/* Stats cards responsive */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: var(--border-radius);
  padding: 25px;
  text-align: center;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.stat-card:hover::before {
  left: 100%;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow);
}

.stat-card.primary {
  background: var(--primary-gradient);
  color: white;
}

.stat-card.secondary {
  background: var(--secondary-gradient);
  color: white;
}

.stat-card.success {
  background: var(--success-gradient);
  color: white;
}

.stat-title {
  margin: 0 0 10px 0;
  font-size: 14px;
  opacity: 0.9;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: white !important;
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  margin: 0 0 8px 0;
  line-height: 1;
  color: white;
}

.stat-subtitle {
  font-size: 12px;
  opacity: 0.8;
  margin: 0;
}

.stat-emoji-large {
  font-size: 48px;
  margin: 10px 0;
  line-height: 1;
}

/* Chart container responsive */
.chart-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: var(--border-radius);
  padding: 30px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 40px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

.chart-title {
  margin: 0 0 25px 0;
  color: #333 !important;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

.chart-wrapper {
  height: 350px;
  position: relative;
}

/* Tags section responsive */
.tags-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: var(--border-radius);
  padding: 30px;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

.tags-title {
  margin: 0 0 25px 0;
  color: #333 !important;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}

.tag-card {
  text-align: center;
  padding: 20px;
  background: rgba(248, 249, 250, 0.8);
  border-radius: var(--border-radius-sm);
  transition: var(--transition);
  border: 2px solid transparent;
}

.tag-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-sm);
  border-color: #667eea;
}

.tag-emoji {
  font-size: 32px;
  margin-bottom: 10px;
  display: block;
}

.tag-name {
  font-weight: 700;
  color: #333;
  margin: 0 0 5px 0;
  font-size: 16px;
}

.tag-count {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* Desktop optimizations */
@media (min-width: 1024px) {
  .manager-container {
    padding: 40px;
  }
  
  .manager-title {
    font-size: 36px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 30px;
  }
  
  .stat-card {
    padding: 30px;
  }
  
  .stat-value {
    font-size: 42px;
  }
  
  .stat-emoji-large {
    font-size: 64px;
  }
  
  .chart-container {
    padding: 40px;
  }
  
  .chart-title {
    font-size: 28px;
  }
  
  .chart-wrapper {
    height: 400px;
  }
  
  .tags-container {
    padding: 40px;
  }
  
  .tags-title {
    font-size: 28px;
  }
  
  .tags-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 25px;
  }
  
  .tag-card {
    padding: 25px;
  }
  
  .tag-emoji {
    font-size: 36px;
  }
}

/* Tablet optimizations */
@media (min-width: 768px) and (max-width: 1023px) {
  .manager-container {
    padding: 30px;
  }
  
  .manager-title {
    font-size: 28px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  .stat-value {
    font-size: 32px;
  }
  
  .chart-wrapper {
    height: 300px;
  }
  
  .tags-grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 18px;
  }
}

/* Mobile optimizations */
@media (max-width: 767px) {
  .manager-container {
    padding: 15px;
  }
  
  .manager-header {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .manager-title {
    font-size: 24px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .stat-card {
    padding: 20px;
  }
  
  .stat-value {
    font-size: 28px;
  }
  
  .chart-container {
    padding: 20px;
  }
  
  .chart-title {
    font-size: 20px;
  }
  
  .chart-wrapper {
    height: 250px;
  }
  
  .tags-container {
    padding: 20px;
  }
  
  .tags-title {
    font-size: 20px;
  }
  
  .tags-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 15px;
  }
  
  .tag-card {
    padding: 15px;
  }
  
  .tag-emoji {
    font-size: 28px;
  }
  
  .tag-name {
    font-size: 14px;
  }
}

/* Très petits écrans */
@media (max-width: 480px) {
  .manager-container {
    padding: 10px;
  }
  
  .manager-title {
    font-size: 20px;
  }
  
  .stat-card {
    padding: 15px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .chart-container,
  .tags-container {
    padding: 15px;
  }
  
  .chart-title,
  .tags-title {
    font-size: 18px;
  }
  
  .chart-wrapper {
    height: 200px;
  }
  
  .tags-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
  }
  
  .tag-card {
    padding: 12px;
  }
  
  .tag-emoji {
    font-size: 24px;
  }
}

/* Mode sombre (optionnel) */
@media (prefers-color-scheme: dark) {
  .manager-container {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  }
  
  .stat-card,
  .chart-container,
  .tags-container {
    background: rgba(40, 40, 40, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .chart-title,
  .tags-title {
    color: #fff;
  }
  
  .tag-card {
    background: rgba(50, 50, 50, 0.8);
  }
  
  .tag-name {
    color: #fff;
  }
  
  .tag-count {
    color: #ccc;
  }
}

/* Styles pour les nouvelles features */

/* Commentaires anonymes */
.comments-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: var(--border-radius);
  padding: 30px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 40px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

.comments-title {
  margin: 0 0 25px 0;
  color: #333 !important;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

.empty-comments {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
  opacity: 0.5;
}

.empty-comments p {
  color: #666;
  font-size: 16px;
}

.comments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.comment-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: var(--border-radius-sm);
  padding: 20px;
  border: 2px solid transparent;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.comment-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--primary-gradient);
}

.comment-card:hover {
  border-color: #667eea;
  transform: translateY(-3px);
  box-shadow: var(--shadow);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.comment-emoji {
  font-size: 28px;
}

.comment-date {
  font-size: 12px;
  color: #666;
  font-weight: 600;
}

.comment-text {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 10px;
  font-style: italic;
}

.comment-tag {
  font-size: 13px;
  color: #667eea;
  font-weight: 600;
}

/* Objectif d'équipe */
.goal-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: var(--border-radius);
  padding: 30px;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

.goal-title {
  margin: 0 0 25px 0;
  color: #333 !important;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

.goal-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.goal-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goal-label {
  font-size: 16px;
  color: #666;
  font-weight: 600;
}

.goal-target {
  font-size: 28px;
  font-weight: 800;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.goal-progress-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.goal-progress-bar {
  flex: 1;
  height: 30px;
  background: rgba(224, 224, 224, 0.5);
  border-radius: 15px;
  overflow: hidden;
  position: relative;
}

.goal-progress-fill {
  height: 100%;
  background: var(--primary-gradient);
  transition: width 1s ease-out;
  border-radius: 15px;
  position: relative;
  overflow: hidden;
}

.goal-progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer 2s infinite;
}

.goal-progress-fill.achieved {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.goal-percentage {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  min-width: 60px;
  text-align: right;
}

.goal-status {
  text-align: center;
  padding: 15px;
  border-radius: var(--border-radius-sm);
  background: rgba(248, 249, 250, 0.8);
}

.status-achieved {
  font-size: 18px;
  font-weight: 700;
  color: #4facfe;
}

.status-pending {
  font-size: 16px;
  font-weight: 600;
  color: #666;
}

/* Responsive pour les nouvelles features */
@media (min-width: 1024px) {
  .comments-container,
  .goal-container {
    padding: 40px;
  }
  
  .comments-title,
  .goal-title {
    font-size: 28px;
  }
  
  .comments-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 25px;
  }
}

@media (max-width: 767px) {
  .comments-container,
  .goal-container {
    padding: 20px;
  }
  
  .comments-title,
  .goal-title {
    font-size: 20px;
  }
  
  .comments-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .goal-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .goal-progress-container {
    flex-direction: column;
    width: 100%;
  }
  
  .goal-percentage {
    text-align: center;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .comments-container,
  .goal-container {
    padding: 15px;
  }
  
  .comments-title,
  .goal-title {
    font-size: 18px;
  }
  
  .comment-card {
    padding: 15px;
  }
  
  .comment-emoji {
    font-size: 24px;
  }
}
</style>
