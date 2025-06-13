# Migration du Scoring et des Énigmes vers le Back-end

## 🎯 Objectif
Migrer toute la logique de scoring et de gestion des énigmes du front-end vers le back-end pour améliorer la sécurité et la cohérence du jeu.

## ✅ Ce qui a été migré

### 1. Architecture Côté Serveur
- **Nouveaux modèles créés :**
  - `Riddle` : Gestion des énigmes
  - `CodePuzzle` : Gestion des codes et puzzles
  - `ScoreEvent` : Historique des événements de score

### 2. Nouvelles APIs
- **Énigmes (`/api/riddles`) :**
  - `GET /room/:roomId` - Obtenir les énigmes d'une salle
  - `GET /:riddleId` - Obtenir le contenu d'une énigme
  - `POST /:riddleId/validate` - Valider une réponse
  - `POST /:riddleId/hint` - Obtenir un indice

- **Codes (`/api/codes`) :**
  - `GET /room/:roomId` - Obtenir les codes d'une salle
  - `POST /:puzzleId/validate` - Valider un code
  - `POST /:puzzleId/hint` - Obtenir un indice

- **Score (`/api/score`) :**
  - `POST /event` - Ajouter un événement de score
  - `GET /current` - Obtenir le score actuel
  - `POST /time-penalty` - Appliquer une pénalité de temps
  - `GET /history` - Obtenir l'historique des scores

### 3. Services Côté Client
- **`gameApi.ts`** : Interface pour communiquer avec les nouvelles APIs
- **`scoreService.ts`** : Service de scoring avec fallback hors-ligne

## 🔧 Modifications apportées

### Côté Serveur
1. **Modèles de données** pour énigmes, codes et événements de score
2. **Contrôleurs** avec validation et gestion des erreurs
3. **Routes sécurisées** nécessitant une authentification
4. **Script de peuplement** pour migrer les données existantes

### Côté Client
1. **Remplacement de `scoreManager.ts`** par `scoreService.ts`
2. **Modification de `EscapeGame.tsx`** pour utiliser les nouvelles APIs
3. **Fallback en mode hors-ligne** si le serveur n'est pas disponible

## 📊 Données migrées

### Énigmes
- **Bibliothèque :** 2 énigmes (mathématique, sagesse)
- **Laboratoire :** 1 énigme (éléments chimiques)
- **Chambre secrète :** 3 énigmes (ombres, miroir, lumière)

### Codes/Puzzles
- **Code du tiroir** (1963)
- **Code du tableau** (7245)
- **Code final de la chambre** (5313)

## 🔒 Avantages de la migration

### Sécurité
- ✅ Impossible de tricher en modifiant le code côté client
- ✅ Validation centralisée des réponses
- ✅ Historique complet des actions

### Performance
- ✅ Logique centralisée côté serveur
- ✅ Réduction de la taille du bundle client
- ✅ Cache des énigmes côté serveur

### Maintienabilité
- ✅ Ajout facile de nouvelles énigmes via la base de données
- ✅ Modification des points sans redéploiement client
- ✅ Analytics et statistiques détaillées

## 🚀 Comment utiliser

### Démarrer le serveur
```bash
cd server
npm start
```

### Peupler les données (si nécessaire)
```bash
cd server
npx ts-node src/scripts/populate-riddles.ts
```

### Tester les APIs
```bash
cd server
node test-apis.js
```

## 🔄 Rétrocompatibilité

Le système inclut un **fallback automatique** :
- Si le serveur n'est pas disponible, le client bascule en **mode hors-ligne**
- Utilise l'ancien système de scoring local comme sauvegarde
- Synchronisation possible quand le serveur redevient disponible

## 📈 Prochaines étapes possibles

1. **Interface d'administration** pour gérer les énigmes
2. **Système de difficultés** dynamiques
3. **Énigmes temporaires** ou événements spéciaux
4. **Mode multijoueur** avec scores partagés
5. **Intelligence artificielle** pour générer des énigmes

## 🐛 Debugging

### Vérifier que les données sont bien peuplées
```sql
SELECT * FROM riddles;
SELECT * FROM code_puzzles;
SELECT * FROM score_events;
```

### Logs côté serveur
- Les contrôleurs loggent toutes les erreurs
- Vérifier la console du serveur en cas de problème

### Logs côté client
- Le service de scoring log ses actions
- Vérifier la console du navigateur pour les erreurs d'API

## 📝 Conclusion

La migration est **complète et fonctionnelle** ! Le jeu fonctionne maintenant avec un système de scoring et d'énigmes entièrement sécurisé côté serveur, tout en conservant un fallback pour assurer la continuité de service. 