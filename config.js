/* Orbita — configurazione (la compila una volta chi pubblica il sito o prepara il programma).
   Chi usa l'app vede solo i pulsanti "Accedi": ognuno entra con i propri account.
   Lascia vuoto ciò che non usi. Queste chiavi sono pubbliche per natura (nessun segreto qui). */
window.PITWALL_CONFIG = {
  supabaseUrl: '',         // es. 'https://xxxx.supabase.co'   → sincronizzazione per utente
  supabaseKey: '',         // chiave pubblica "anon" / "publishable" di Supabase
  spotifyClientId: '',     // developer.spotify.com/dashboard
  googleClientId: '',      // console.cloud.google.com › Credenziali › ID client OAuth
  googleClientSecret: '',  // solo per il programma desktop (ID client di tipo "App desktop")
  microsoftClientId: '',   // portal.azure.com › Registrazioni app › ID applicazione (client)
};
