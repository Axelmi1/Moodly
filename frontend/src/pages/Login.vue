<template>
  <div class="login-container">
    <div class="login-card">
      <h2>📱 Moodly</h2>
      <p class="subtitle">Suivi du moral des équipes</p>
      <input v-model="email" placeholder="Email" :disabled="loading" />
      <input v-model="password" type="password" placeholder="Mot de passe" :disabled="loading" />
      <button @click="login" :disabled="loading">
        {{ loading ? 'Connexion...' : 'Se connecter' }}
      </button>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api, setAuth, clearAuth } from '../api'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const router = useRouter()

// Nettoyer les tokens résiduels au chargement de la page
onMounted(() => {
  clearAuth()
})

const login = async () => {
  if (!email.value || !password.value) {
    error.value = 'Veuillez remplir tous les champs'
    return
  }

  loading.value = true
  error.value = ''

  try {
    console.log('🔍 Tentative de connexion avec:', email.value)
    console.log('🌐 URL API:', api.defaults.baseURL)
    
    const { data } = await api.post('/api/auth/local', {
      identifier: email.value,
      password: password.value,
    })
    
    console.log('✅ Connexion réussie:', data)
    localStorage.setItem('jwt', data.jwt)
    setAuth(data.jwt)

    // récupère les infos utilisateur
    const me = await api.get('/api/users/me?populate=role')
    console.log('👤 User data:', me.data) // Debug

    localStorage.setItem('role', me.data.role?.name || 'employee')
    localStorage.setItem('userId', me.data.id)
    localStorage.setItem('username', me.data.username)

    // Redirection basée sur le nom d'utilisateur
    if (me.data.username === 'manager') {
      router.push('/manager')
    } else {
      router.push('/mood')
    }
  } catch (err) {
    console.error('❌ Erreur de connexion:', err)
    console.error('❌ Response:', err.response?.data)
    console.error('❌ Status:', err.response?.status)
    error.value = `Erreur: ${err.response?.status || 'Connexion impossible'}`
  } finally {
    loading.value = false
  }
}
</script>


<style>
/* Variables CSS pour la cohérence */
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --success-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  --border-radius: 16px;
  --border-radius-sm: 12px;
  --shadow: 0 10px 30px rgba(0,0,0,0.2);
  --shadow-sm: 0 4px 6px rgba(0,0,0,0.1);
  --transition: all 0.3s ease;
}

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-gradient);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* Effet de fond animé */
.login-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: var(--border-radius);
  padding: 40px 30px;
  box-shadow: var(--shadow);
  width: 100%;
  max-width: 450px;
  text-align: center;
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

h2 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 32px;
  font-weight: 800;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #666;
  margin: 0 0 30px 0;
  font-size: 16px;
  font-weight: 500;
}

.input-group {
  position: relative;
  margin: 20px 0;
}

input {
  display: block;
  width: 100%;
  padding: 18px 20px;
  border: 2px solid #e1e5e9;
  border-radius: var(--border-radius-sm);
  font-size: 16px;
  transition: var(--transition);
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
}

input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
}

input:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

button {
  width: 100%;
  padding: 18px;
  border: 0;
  border-radius: var(--border-radius-sm);
  background: var(--primary-gradient);
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

button:hover::before {
  left: 100%;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

button:active {
  transform: scale(0.98);
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.error {
  color: #e74c3c;
  margin-top: 15px;
  font-size: 14px;
  padding: 10px;
  background: rgba(231, 76, 60, 0.1);
  border-radius: var(--border-radius-sm);
  border-left: 4px solid #e74c3c;
}

/* Desktop optimizations */
@media (min-width: 1024px) {
  .login-container {
    padding: 40px;
  }
  
  .login-card {
    max-width: 500px;
    padding: 50px 40px;
  }
  
  h2 {
    font-size: 36px;
  }
  
  .subtitle {
    font-size: 18px;
  }
  
  input {
    padding: 20px 24px;
    font-size: 18px;
  }
  
  button {
    padding: 20px;
    font-size: 18px;
  }
}

/* Tablet optimizations */
@media (min-width: 768px) and (max-width: 1023px) {
  .login-container {
    padding: 30px;
  }
  
  .login-card {
    max-width: 450px;
    padding: 45px 35px;
  }
  
  h2 {
    font-size: 30px;
  }
  
  input {
    padding: 18px 22px;
  }
  
  button {
    padding: 18px;
  }
}

/* Mobile optimizations */
@media (max-width: 767px) {
  .login-container {
    padding: 15px;
  }
  
  .login-card {
    padding: 30px 20px;
    max-width: 100%;
  }
  
  h2 {
    font-size: 28px;
  }
  
  .subtitle {
    font-size: 14px;
  }
  
  input, button {
    font-size: 16px; /* Prevents zoom on iOS */
    padding: 16px 18px;
  }
  
  .input-group {
    margin: 15px 0;
  }
}

/* Très petits écrans */
@media (max-width: 480px) {
  .login-container {
    padding: 10px;
  }
  
  .login-card {
    padding: 25px 15px;
  }
  
  h2 {
    font-size: 24px;
  }
  
  input, button {
    padding: 14px 16px;
  }
}

/* Mode sombre (optionnel) */
@media (prefers-color-scheme: dark) {
  .login-card {
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  h2 {
    color: #fff;
  }
  
  .subtitle {
    color: #ccc;
  }
  
  input {
    background: rgba(50, 50, 50, 0.9);
    border-color: #444;
    color: #fff;
  }
  
  input:focus {
    border-color: #667eea;
  }
  
  input::placeholder {
    color: #999;
  }
}
</style>
