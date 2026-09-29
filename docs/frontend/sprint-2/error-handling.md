# Gestion des erreurs

Les réponses restent ApiError/ProblemDetail. Aucun routage, toast ou affichage dans le client HTTP. Les formulaires traduisent statut et type stable, jamais le texte libre detail.

| Cas                                | Présentation / effet                                                     |
| ---------------------------------- | ------------------------------------------------------------------------ |
| Validation locale                  | RHF/Zod, label visible, aria-invalid, annonce et focus sur premier champ |
| 400 errors[]                       | Liste blanche des champs, message local « Vérifiez ce champ. »           |
| passwordWithinHashingLimit         | Reporté sur password avec limite 72 octets UTF-8                         |
| Login 401 ou type account-inactive | Même message générique, email conservé, mot de passe effacé              |
| Inscription 409                    | Message générique d’inscription impossible, suggestion de connexion      |
| 403 ressource                      | Accès interdit, aucun refresh                                            |
| 429                                | Patienter avant nouvelle tentative manuelle, aucun retry automatique     |
| Réseau/timeout                     | Erreur technique, pas erreur d’identifiants                              |
| 5xx / réponse invalide             | Message sûr et correlationId si disponible                               |
| Échec refresh                      | Session expired, cache effacé, page de reconnexion                       |
| Échec logout                       | Nettoyage local et révocation serveur non confirmée                      |

Aucun cas « compte verrouillé » inventé : absent du contrat. L’inactivité du compte est volontairement masquée par le service de login actuel. La réponse serveur d’inscription peut révéler une collision à un appelant direct ; l’UI ne reprend pas le détail brut et ne peut pas corriger l’énumération possible côté API.

Un échec d’inscription/connexion efface les mots de passe, conserve les autres champs et permet une nouvelle soumission manuelle. Pas de rejeu automatique des POST. Le bouton de soumission et le verrou synchrone empêchent le double submit ; avant hydratation les champs sont désactivés et le formulaire est déclaré en POST.
