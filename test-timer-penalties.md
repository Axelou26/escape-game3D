# Test des Pénalités de Temps

## 🔧 Corrections Apportées

### 1. **Configuration des Pénalités** ✅
- ✅ `TIMER.TIME_PENALTY_POINTS: -30` (au lieu de -10)
- ✅ `SCORE_POINTS.TIME_PENALTY: -30` (cohérence)

### 2. **Rate Limiting** ✅  
- ✅ Augmenté `strictTimerRateLimit` à 15 requêtes/minute
- ✅ Permet 2 requêtes/minute (sync toutes les 30s) + marge

### 3. **Gestion d'Erreurs** ✅
- ✅ Amélioration de la gestion du rate limiting
- ✅ Retry automatique avec délais adaptés

### 4. **Logs de Debug** ✅
- ✅ Logs côté client pour voir les synchronisations
- ✅ Logs côté serveur pour voir les pénalités appliquées

## 🧪 Comment Tester

### 1. **Démarrer le Serveur**
```bash
cd server
npm start
```

### 2. **Démarrer le Client**  
```bash
cd client
npm start
```

### 3. **Tester les Pénalités**
1. Se connecter et démarrer une partie
2. Attendre **2 minutes (120 secondes)**
3. Observer dans la console du navigateur :
   - `🔄 Synchronisation timer`
   - `📊 Réponse serveur`
   - `💰 Mise à jour score`
   - `⏰ X pénalité(s) appliquée(s)`

4. Observer dans la console du serveur :
   - `🕐 Timer sync`
   - `⏰ PÉNALITÉ APPLIQUÉE`

### 4. **Vérifications**
- ✅ Le HUD affiche le nouveau score
- ✅ Animation rouge pour les pénalités
- ✅ Message "⏰ Pénalité de temps: -30 points !"
- ✅ Score diminue de 30 points toutes les 2 minutes

## 🎯 Ce qui devrait se passer

- **0-119s** : Aucune pénalité
- **120s** : -30 points (1ère pénalité)
- **240s** : -30 points (2ème pénalité)  
- **360s** : -30 points (3ème pénalité)
- etc.

## 🐞 Si ça ne marche toujours pas

Vérifier dans la console du navigateur :
1. **Erreurs réseau** (401, 429, 500)
2. **Rate limiting** messages
3. **Réponses du serveur** (structure correcte)

Vérifier dans la console du serveur :
1. **Connexions utilisateur**
2. **Calculs de pénalités**
3. **Mises à jour de score** 