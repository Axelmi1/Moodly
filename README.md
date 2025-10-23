# 📱 Moodly - Suivi du Moral des Équipes

> Application mobile moderne pour mesurer et améliorer le bien-être au travail en temps réel.

[![VueJS](https://img.shields.io/badge/VueJS-3.x-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Strapi](https://img.shields.io/badge/Strapi-5.x-4945FF?logo=strapi)](https://strapi.io/)
[![CapacitorJS](https://img.shields.io/badge/Capacitor-Native-119EFF?logo=capacitor)](https://capacitorjs.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Axelmi1%2FMoodly-blue?logo=github)](https://github.com/Axelmi1/Moodly)

---

## 🎯 Objectifs du Projet

📱 **Produire un MVP fonctionnel** d'un outil de mood tracking (application mobile)

⚙️ **Prendre en compte les parties prenantes** : managers et collaborateurs  

🛠️ **Stack technique obligatoire** : Strapi (headless CMS), VueJS & CapacitorJS  

📊 **Fonctionnalités clés** : Les employés renseignent leur moral et les managers visualisent les équipes avec graphiques pour prendre des décisions

---

## ✨ Fonctionnalités

### 👤 Pour les Employés

**📝 Enregistrement rapide (10 secondes)**
- Sélection d'un emoji : 😞 → 😁 (score 1-5)
- Catégorie optionnelle : Stress / Charge / Ambiance / Motivation
- Commentaire anonyme (500 caractères max)

**📊 Historique personnel**
- Moral moyen personnel
- Tendance sur 7 jours (📈/📉/→)
- 10 dernières saisies avec détails

### 📊 Pour les Managers

**Dashboard complet avec :**
- 📈 Moral moyen de l'équipe
- 📅 Total d'entrées (30 derniers jours)
- 🔄 Tendance vs semaine précédente
- 📉 Graphique d'évolution (7 derniers jours)
- 🏷️ Répartition par catégories
- 💬 5 derniers commentaires anonymes
- 🎯 Barre de progression vers objectif (4.0/5)

---

## 🚀 Stack Technique

**Frontend**
- VueJS 3 (Composition API)
- Vite (Build tool)
- CapacitorJS (iOS/Android)
- Chart.js + vue-chartjs
- Vue Router
- Axios

**Backend**
- Strapi v5 (Headless CMS)
- SQLite (Database)
- JWT Authentication
- REST API

**Design**
- CSS moderne responsive
- Glassmorphism effects
- Mobile-first approach

---

## 📦 Installation

### Prérequis
- Node.js v18+
- npm
- Git

### Backend (Strapi)

```bash
cd backend
npm install
npm run develop
```

→ Accessible sur `http://localhost:1337`

**Configuration initiale :**
1. Créez un compte admin sur `http://localhost:1337/admin`
2. Configurez les permissions :
   - Role "Authenticated" : Mood → `find`, `findOne`, `create`

### Frontend (VueJS)

```bash
cd frontend
npm install
npm run dev
```

→ Accessible sur `http://localhost:5174`

### Mobile (iOS/Android)

```bash
cd frontend

# iOS
npx cap sync ios
npx cap open ios

# Android
npx cap sync android
npx cap open android
```

⚠️ **Important :** Mettez à jour votre IP locale dans `frontend/src/api.js`

---

## 🎮 Comptes de Test

**Employé :**
- Email : `employee@test.com`
- Mot de passe : `employee123`

**Manager :**
- Email : `manager@test.com`
- Mot de passe : `manager123`

**Créer ces comptes via Strapi Admin** (`http://localhost:1337/admin`)

---

## 📁 Structure du Projet

```
moodly/
├── backend/                 # Backend Strapi
│   ├── src/
│   │   └── api/
│   │       └── mood/       # Collection Mood
│   ├── config/
│   │   └── middlewares.ts  # CORS config
│   └── package.json
│
├── frontend/               # Frontend VueJS
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.vue
│   │   │   ├── Mood.vue
│   │   │   └── Manager.vue
│   │   ├── api.js
│   │   ├── main.js
│   │   └── style.css
│   ├── ios/               # App iOS
│   └── capacitor.config.json
│
└── README.md              # Vous êtes ici
```

---

## 🎨 Design & UX

- ✨ Design moderne avec glassmorphism
- 🌈 Gradients violet/rose/bleu
- 📱 100% Responsive (Mobile/Tablet/Desktop)
- 🌙 Mode sombre automatique
- ♿ Accessible (navigation clavier, reduced-motion)

---

## 🔐 API & Permissions

### Collections Strapi

**Mood :**
- `score` : Integer (1-5, requis)
- `tag` : String (optionnel)
- `comment` : Text (max 500, optionnel)
- `user` : Relation manyToOne

### Permissions

**Authenticated :**
- Mood : `find`, `findOne`, `create`

**Lifecycle :**
- `beforeCreate` assigne automatiquement l'utilisateur

---

## 📊 Screenshots

### Login
![Login](docs/screenshots/login.png)

### Interface Employé
![Mood Selection](docs/screenshots/employee-mood.png)
![History](docs/screenshots/employee-history.png)

### Dashboard Manager
![Dashboard](docs/screenshots/manager-dashboard.png)

---

## 🐛 Dépannage

**Frontend ne charge pas :**
```bash
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

**App mobile ne se connecte pas :**
- Vérifiez backend sur `http://localhost:1337`
- Mettez à jour IP dans `frontend/src/api.js`
- Vérifiez CORS dans `backend/config/middlewares.ts`

**Cache navigateur :**
- `Cmd + Shift + R` (Mac) ou `Ctrl + Shift + R` (Windows)

---

## 📈 Roadmap

**V2.0**
- 📧 Notifications push
- 🏆 Gamification (badges, streaks)
- 📊 Analytics avancés

**V3.0**
- 🤖 IA prédictive
- 💡 Recommandations automatiques
- 🎨 Thèmes personnalisables

---

## 🤝 Contribution

Les contributions sont bienvenues ! 

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

## 📝 Licence

MIT License - voir [LICENSE](LICENSE) pour plus de détails

---

## 👨‍💻 Auteur

**Axel Misson**
- 🐙 GitHub : [@Axelmi1](https://github.com/Axelmi1)

---

## 🙏 Remerciements

- [Strapi](https://strapi.io/) pour le CMS headless
- [Vue.js](https://vuejs.org/) pour le framework frontend
- [Capacitor](https://capacitorjs.com/) pour la conversion mobile
- [Chart.js](https://www.chartjs.org/) pour les visualisations

---

**Made with ❤️ for better workplace wellbeing**

_Moodly - Parce que le bien-être de votre équipe compte_
