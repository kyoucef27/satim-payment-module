# Limitations des Remboursements SATIM (Mise à jour selon documentation officielle)

## ⚠️ Problèmes Courants avec refund.do

### ErrorCode "5" - Causes selon SATIM :
1. **Accès refusé** : Problème d'authentification
2. **Changement de mot de passe requis** : Le compte doit changer son mot de passe
3. **Montant invalide** : Format incorrect ou montant invalide
4. **Montant de dépôt** : Le montant déposé doit être zéro ou plus d'une unité monétaire
5. **Remboursement déjà existant** : Un remboursement avec cet ID existe déjà

### ErrorCode "6" - OrderId non enregistré
- Le `orderId` (mdOrder) n'existe pas dans le système SATIM

### ErrorCode "7" - Erreur système
- Le paiement n'est pas dans un état correct pour remboursement

## ✅ Format Correct selon Documentation SATIM

### Montants de Remboursement
```javascript
// Pour un paiement de 50 DA (5000 centimes)
// Remboursement complet
"amount": 5000

// Pour un paiement de 80.65 DA (8065 centimes) 
// Remboursement complet
"amount": 8065

// IMPORTANT: Même format que register.do
// PAS de multiplication par 10 !
```

### URL de Test SATIM
```
https://test2.satim.dz/payment/rest/refund.do?userName=YOUR_USERNAME&password=YOUR_PASSWORD&amount=5000&orderId=YourOrderId
```

### ErrorCode "6" - Payment ID invalide
- Le `orderId` (mdOrder) n'existe pas
- Le paiement a expiré ou été supprimé

### ErrorCode "7" - Erreur système
- Le paiement n'est pas dans un état valide pour remboursement
- Problème temporaire côté SATIM

## ✅ Solutions et Tests

### 1. Vérifier l'état du paiement AVANT remboursement
```javascript
// D'abord vérifier que OrderStatus = 2
GET /api/payments/{paymentId}/verify
```

### 2. Tester avec un nouveau paiement
- Créer un nouveau paiement
- Le payer complètement
- Attendre quelques minutes
- Essayer le remboursement

### 3. Utiliser des montants valides
```javascript
// Bon : Montants multiples de 100 centimes
"amount": 1000  // 10.00 DZD
"amount": 2500  // 25.00 DZD

// Mauvais : Montants non-multiples
"amount": 1050  // 10.50 DZD - pas supporté
"amount": 99    // < 1 DZD - pas supporté
```

### 4. Éviter les doublons
Le module génère automatiquement un `externalRefundId` unique pour chaque tentative.

## 🧪 Test de Remboursement Complet

1. **Créer paiement** : 5000 centimes (50 DZD)
2. **Payer avec carte test** : `6280 2200 0000 7215`
3. **Vérifier statut** : `OrderStatus = 2`
4. **Attendre 2-3 minutes**
5. **Tenter remboursement** : 5000 centimes (complet)

## 📞 Support

Si les remboursements ne fonctionnent toujours pas :
- **SATIM Support** : 3020 3020
- Vérifier avec SATIM si votre compte sandbox/production supporte les remboursements
- Demander les logs côté SATIM pour diagnostic

## 💡 Alternative : Remboursements Manuels

Si l'API ne fonctionne pas, vous pouvez :
1. Marquer le paiement comme "refunded" dans votre base de données
2. Traiter le remboursement manuellement via l'interface SATIM
3. Envoyer une confirmation au client