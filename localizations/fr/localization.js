// ClickToPlugin localization file
// Save with encoding: UTF-8

// FRANÇAIS

const PLUGIN_GENERIC = "le plugin";

// Contextual menu items
const TURN_CTP_ON = "Activer ClickToPlugin";
const TURN_CTP_OFF = "Désactiver ClickToPlugin";
const LOAD_ALL_PLUGINS = "Débloquer tous les plugins";
const LOAD_INVISIBLE_PLUGINS = "Débloquer les plugins invisibles";
const ADD_TO_LOC_WHITELIST = "Ajouter à la liste blanche";
const ADD_TO_SRC_WHITELIST = "Ajouter à la liste blanche";
const DOWNLOAD_VIDEO = "Télécharger la vidéo";
const DOWNLOAD_AUDIO = "Télécharger l'audio";
const VIEW_IN_QUICKTIME_PLAYER = "Ouvrir avec QuickTime Player";
const SHOW_ELEMENT = "Voir l'élément";
const LOAD_PLUGIN = function(plugin) {return "Lancer " + plugin;};
const REMOVE_PLUGIN = function(plugin) {return "Supprimer " + plugin;};
const RELOAD_IN_PLUGIN = function(plugin) {return "Restaurer " + plugin;};
const VIEW_ON_SITE = function(site) {return "Voir la vidéo sur " + site;};

// Dialogs
const QT_CONFIRM_LAUNCH_DIALOG = function(url) {return "Un objet QuickTime voudrait lancer le lecture de\n\n" + url + "\n\ndans QuickTime Player. Voulez-vous l'autoriser?";};
const ADD_TO_LOC_WHITELIST_DIALOG = "Autoriser les plugins si l'adresse de la page contient";
const ADD_TO_LOC_BLACKLIST_DIALOG = "Bloquer les plugins si l'adresse de la page contient";
const ADD_TO_SRC_WHITELIST_DIALOG = "Autoriser les plugins provenant de";

