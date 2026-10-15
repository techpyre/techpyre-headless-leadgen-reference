import type {
  ApplicationCase,
  ArchitectureComparisonRow,
  SectorServed,
  TechnicalSpec,
} from "../types/catalog.ts";

/**
 * Contenuti della landing di Kinetix Robotics & Vision S.r.l. (azienda fittizia).
 */

export const COMPANY = {
  name: "Kinetix Robotics & Vision S.r.l.",
  shortName: "Kinetix",
  location: "Distretto meccatronico di Modena — sede fittizia",
  tagline: "Isole robotizzate di saldatura laser e visione artificiale per il controllo qualità in linea.",
  product: "Cella Robotizzata Kinetix-X400 con Visione Laser AI",
} as const;

export const TECHPYRE = {
  name: "TechPYRE",
  url: "https://www.techpyre.eu",
  studio: "Studio di Ingegneria del Software B2B",
  head: "Riccardo Granza",
  repoUrl: "https://github.com/techpyre/techpyre-headless-leadgen-reference",
  demoUrl: "https://headless-demo.techpyre.eu",
} as const;

export const X400_SPECS: readonly TechnicalSpec[] = [
  { group: "Robot", parameter: "Manipolatore", value: "Antropomorfo 6 assi", note: "Portata al polso 12 kg" },
  { group: "Robot", parameter: "Sbraccio", value: "1.440 mm" },
  { group: "Robot", parameter: "Ripetibilità di posizionamento", value: "± 0,02 mm", note: "ISO 9283" },
  { group: "Laser", parameter: "Sorgente", value: "Fibra 3 kW, λ 1.070 nm", note: "Testa wobble integrata" },
  { group: "Laser", parameter: "Velocità di saldatura", value: "fino a 6 m/min", note: "Acciaio 2 mm" },
  { group: "Visione AI", parameter: "Sensore di ispezione", value: "Profilometro laser 3D + camera 12 MP" },
  { group: "Visione AI", parameter: "Tempo di inferenza", value: "< 18 ms per pezzo", note: "GPU embedded in cella" },
  { group: "Visione AI", parameter: "Risoluzione metrologica", value: "fino a 8 µm", note: "Pacchetto Metrology" },
  { group: "Integrazione", parameter: "Bus di campo", value: "PROFINET, EtherNet/IP, OPC UA" },
  { group: "Integrazione", parameter: "Dati di processo", value: "MQTT / REST verso MES ed ERP", note: "Interconnessione 4.0" },
  { group: "Sicurezza", parameter: "Protezione", value: "Cabina classe laser 1, PLd cat. 3", note: "EN ISO 13849-1" },
  { group: "Ingombri", parameter: "Footprint cella", value: "3,2 × 2,8 m", note: "Altezza 2,6 m" },
] as const;

export const APPLICATIONS: readonly ApplicationCase[] = [
  {
    title: "Saldatura laser con controllo del cordone",
    description:
      "Il profilometro 3D misura larghezza, sovrametallo e porosità superficiale del cordone subito dopo la passata, con retroazione sui parametri laser.",
    metric: "Ispezione 100% in linea",
  },
  {
    title: "Ispezione ottica dimensionale",
    description:
      "Verifica di quote critiche, fori e pieghe confrontando la nuvola di punti con il modello CAD del pezzo e scartando automaticamente i fuori tolleranza.",
    metric: "Confronto CAD in tempo reale",
  },
  {
    title: "Classificazione difetti con AI",
    description:
      "Rete neurale addestrata sui difetti del cliente (cricche, spruzzi, inclusioni) con registrazione delle immagini per audit e miglioramento continuo.",
    metric: "Storico immagini per audit",
  },
] as const;

export const SECTORS_SERVED: readonly SectorServed[] = [
  { name: "Automotive", parts: "Staffe, traverse, componenti BIW, supporti batteria", standard: "IATF 16949" },
  { name: "Packaging", parts: "Chiusure, saldature termiche, marcature di lotto", standard: "ISO 9001" },
  { name: "Aerospazio", parts: "Condotti in titanio, staffe in Inconel, carter", standard: "EN 9100" },
  { name: "Lavorazione Lamiera", parts: "Carpenteria leggera, quadri elettrici, armadi", standard: "EN 1090" },
] as const;

export const ARCHITECTURE_COMPARISON: readonly ArchitectureComparisonRow[] = [
  { aspect: "Rendering", legacy: "PHP + MySQL a ogni richiesta", edge: "HTML pre-renderizzato (SSG/ISR) in CDN" },
  { aspect: "TTFB tipico", legacy: "1–2 s sotto carico campagna", edge: "< 50 ms dal nodo Edge più vicino" },
  { aspect: "Picchi di traffico Ads", legacy: "Saturazione PHP-FPM, errori 502/504", edge: "Assorbiti dalla cache CDN" },
  { aspect: "Invio form", legacy: "Chiamata sincrona al CRM: se cade, il lead è perso", edge: "Outbox persistente + retry + Dead-Letter Queue" },
  { aspect: "Integrità del lead", legacy: "Nessuna firma, possibili duplicati", edge: "Firma HMAC SHA-256 + chiave di idempotenza" },
  { aspect: "Superficie d'attacco", legacy: "24 plugin da aggiornare", edge: "Nessun runtime CMS esposto" },
] as const;
