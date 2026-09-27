# Erreurs

Le contrat Spring utilise type?, title, status, detail?, instance?, correlationId?,
errorCode? et errors?: [{field,message}]. Ne pas substituer fieldErrors ou code à ces champs.
parseProblemDetail valide la structure; isProblemDetail est le type guard.
extractFieldErrors regroupe les messages dans un dictionnaire sans prototype.
ApiError conserve le statut, le corps validé et la référence de corrélation.

toUserMessage utilise des messages français maîtrisés selon le statut :
400, 401, 403, 404, 409, 422, 429, puis erreur technique pour les 5xx.
Les messages, détails et titres bruts du serveur ne sont jamais rendus dans TechnicalError.
L'adaptateur formulaire associe seulement les champs connus avec un message générique sûr.
Pas de stack, HTML serveur injecté ou toast dans le transport.

CorrelationIdDisplay conserve et copie exactement la référence, avec retour aria-live et gestion
du presse-papiers indisponible. La référence est un identifiant technique non secret.
ErrorBoundary React et les boundaries de routes protègent leurs domaines respectifs.
Les erreurs de bootstrap, antérieures à React, ont un message neutre sans diagnostic brut.

RHF/Zod est intégré par un adaptateur local limité aux schémas plats sans transformation :
validation asynchrone, labels, aria-invalid, aria-describedby, focus de première erreur,
fieldset désactivé et verrou synchrone contre les doubles soumissions.
Les futurs schémas imbriqués nécessiteront un adaptateur explicite.
