# 🧪 Guide de Test - Nouvelles Fonctionnalités Sécurisées

## 🎯 Fonctionnalités Ajoutées

### 1. **Configuration Centralisée** (`server/src/config/gameConfig.ts`)
- ✅ Tous les paramètres de jeu centralisés côté serveur
- ✅ Impossible de modifier les valeurs côté client
- ✅ Validation automatique de la cohérence

### 2. **Timer Sécurisé** (`client/src/services/secureTimer.ts`)
- ✅ Synchronisation serveur-client toutes les 30 secondes
- ✅ Détection de manipulation temporelle
- ✅ Pénalités automatiques côté serveur
- ✅ Limite de temps de jeu (1 heure)
- ✅ Détection de page cachée (anti-triche)

### 3. **Gestion d'État Sécurisée** (`server/src/controllers/game-state.controller.ts`)
- ✅ Validation d'inventaire côté serveur
- ✅ Contrôle de progression avec prérequis
- ✅ Changement de salle sécurisé
- ✅ Limite d'inventaire (20 objets)

### 4. **APIs Nouvelles** (`/api/game-state/*`)
- ✅ `/config` - Configuration publique du jeu
- ✅ `/inventory/add` - Ajout sécurisé d'objets
- ✅ `/room/change` - Changement de salle validé
- ✅ `/progress/update` - Mise à jour de progression
- ✅ `/timer/sync` - Synchronisation timer
- ✅ `/timer/current` - Temps actuel
- ✅ `/timer/pause` - Pause (future)

## 🔧 Tests à Effectuer

### Test 1: Configuration Centralisée
```bash
# Démarrer le serveur
cd server && npm start

# Tester l'API de configuration
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/game-state/config
```

**Résultat attendu :**
```json
{
  "status": "success",
  "config": {
    "initialScore": 1000,
    "maxGameDuration": 3600,
    "maxInventoryItems": 20,
    "availableRooms": ["library", "laboratory", "secret-chamber"],
    "timePenaltyInterval": 120
  }
}
```

### Test 2: Timer Sécurisé
1. **Démarrer le jeu** et observer la console
2. **Vérifier les logs** :
   - `🕐 Timer sécurisé démarré`
   - Synchronisation toutes les 30s
3. **Changer d'onglet** pendant 10 secondes
   - Vérifier le log : `⚠️ Page cachée pendant Xs - synchronisation forcée`
4. **Attendre 2 minutes** pour voir la pénalité automatique
   - Log : `⏰ 1 pénalité(s) de temps appliquée(s)`

### Test 3: Validation d'Inventaire
```bash
# Test d'ajout d'objet valide
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"itemId":"test-item","itemType":"key","itemName":"Clé Test","itemDescription":"Une clé de test"}' \
     http://localhost:3001/api/game-state/inventory/add

# Test d'ajout d'objet invalide (type incorrect)
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"itemId":"test-item","itemType":"invalid","itemName":"Test","itemDescription":"Test"}' \
     http://localhost:3001/api/game-state/inventory/add
```

### Test 4: Changement de Salle Sécurisé
```bash
# Test changement vers laboratoire sans clé (doit échouer)
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"newRoom":"laboratory"}' \
     http://localhost:3001/api/game-state/room/change

# Test changement vers salle invalide (doit échouer)
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"newRoom":"invalid-room"}' \
     http://localhost:3001/api/game-state/room/change
```

### Test 5: Synchronisation Timer
```bash
# Test synchronisation normale
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"clientElapsedTime":300}' \
     http://localhost:3001/api/game-state/timer/sync

# Test avec temps client suspect (doit détecter la triche)
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"clientElapsedTime":10}' \
     http://localhost:3001/api/game-state/timer/sync
```

## 🛡️ Tests Anti-Triche

### Test 1: Manipulation du Timer
1. Ouvrir les DevTools
2. Essayer de modifier `secureTimer.localElapsedTime`
3. **Résultat attendu :** Synchronisation forcée corrige la valeur

### Test 2: Modification du Score
1. Essayer de modifier `gameState.score` dans React DevTools
2. **Résultat attendu :** Valeur écrasée par la synchronisation serveur

### Test 3: Ajout d'Objets Invalides
1. Essayer d'ajouter un objet avec un type invalide
2. **Résultat attendu :** Erreur 400 "Type d'objet invalide"

### Test 4: Déblocage de Salle Sans Prérequis
1. Essayer d'aller au laboratoire sans la clé
2. **Résultat attendu :** Erreur 403 "Objets requis manquants"

## 📊 Métriques de Performance

### Avant (Timer Local)
- ❌ Timer manipulable côté client
- ❌ Score modifiable dans DevTools
- ❌ Pas de limite de temps
- ❌ Pas de validation d'inventaire

### Après (Timer Sécurisé)
- ✅ Timer inviolable (serveur autoritaire)
- ✅ Score protégé par synchronisation
- ✅ Limite de temps automatique (1h)
- ✅ Validation complète côté serveur
- ✅ Détection de manipulation temporelle
- ✅ Fallback hors-ligne fonctionnel

## 🚀 Prochaines Améliorations Possibles

1. **Chiffrement des communications** (HTTPS + JWT refresh)
2. **Rate limiting** sur les APIs sensibles
3. **Logs d'audit** pour détecter les tentatives de triche
4. **Système de pause/resume** complet
5. **Sauvegarde automatique** plus fréquente
6. **Validation de cohérence** des actions utilisateur

## 🎮 Impact sur l'Expérience Utilisateur

### Positif
- ✅ Jeu plus équitable (impossible de tricher)
- ✅ Scores fiables dans le leaderboard
- ✅ Progression sauvegardée en temps réel
- ✅ Limite de temps claire et respectée

### Neutre
- 🔄 Synchronisation transparente (30s)
- 🔄 Fallback hors-ligne automatique
- 🔄 Performance similaire

### À Surveiller
- ⚠️ Dépendance réseau pour timer précis
- ⚠️ Latence possible sur actions critiques
- ⚠️ Consommation réseau légèrement augmentée 