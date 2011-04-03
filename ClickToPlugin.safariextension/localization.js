// ClickToPlugin localization file
// Save with encoding: UTF-8

function fallback(lang) {
    switch(lang) {
        case "en-gb": return "en-us";
        case "en-ca": return "en-gb";
        case "fr-ca": return "fr-fr";
        default: return "en-us";
    }
}

const STRINGS = {
    // Settings
    PLUGINS_TAB: {
        "en-us": "Plug-ins",
        "fr-fr": "Plugins"
    },
    WHITELISTS_TAB: {
        "en-us": "Control lists",
        "fr-fr": "Listes de contrôle"
    },
    KILLERS_TAB: {
        "en-us": "HTML5 replacements",
        "fr-fr": "Substitutions HTML5"
    },
    MEDIA_TAB: {
        "en-us": "Media player",
        "fr-fr": "Lecteur multimédia"
    },
    CONTEXT_MENU_TAB: {
        "en-us": "Shortcut menu",
        "fr-fr": "Menu contextuel"
    },
    KEYBOARD_SHORTCUTS_TAB: {
        "en-us": "Keyboard shortcuts",
        "fr-fr": "Raccourcis clavier"
    },
    MISC_TAB: {
        "en-us": "Miscellaneous",
        "fr-fr": "Divers"
    },
    
    TOGGLE_BUTTON: {
        "en-us": "Toggle",
        "fr-fr": "Inverser"
    },
    SELECT_ALL_BUTTON: {
        "en-us": "Select All",
        "fr-fr": "Tout sélectionner"
    },
    DESELECT_ALL_BUTTON: {
        "en-us": "Clear",
        "fr-fr": "Aucun"
    },
    CLEAR_BUTTON: {
        "en-us": "Clear",
        "fr-fr": "Effacer"
    },
    
    ALLOW_THESE_PLUGINS: {
        "en-us": "Allow these plug-ins",
        "fr-fr": "Autoriser ces plugins"
    },
    NO_PLUGINS_NOTICE: {
        "en-us": "You currently have no enabled plug-ins!",
        "fr-fr": "Aucun plugin actif!"
    },
    PLUGIN_FILENAME: {
        "en-us": "Filename",
        "fr-fr": "Fichier"
    },
    PLUGIN_DESCRIPTION: {
        "en-us": "Description",
        "fr-fr": "Description"
    },
    
    ALLOW_LOCATIONS: {
        "en-us": "Allow plug-ins on these sites",
        "fr-fr": "Autoriser les plugins sur ces sites"
    },
    ALLOW_SOURCES: {
        "en-us": "Allow plug-ins from these sources",
        "fr-fr": "Autoriser les plugins provenant de"
    },
    INVERT_WHITELISTS: {
        "en-us": "Negate lists",
        "fr-fr": "Inverser"
    },
    HIDE_LOCATIONS: {
        "en-us": "Hide plug-ins on these sites",
        "fr-fr": "Masquer les plugins sur ces sites"
    },
    HIDE_SOURCES: {
        "en-us": "Hide plug-ins from these sources",
        "fr-fr": "Masquer les plugins provenant de"
    },
    INVERT_BLACKLISTS: {
        "en-us": "Negate lists",
        "fr-fr": "Inverser"
    },
    ENABLE_THESE_KILLERS: {
        "en-us": "Use HTML5 replacements for these services",
        "fr-fr": "Substituter les plugins par HTML5 pour ces services"
    },
    USE_FALLBACK_MEDIA: {
        "en-us": "Use HTML5 fallbacks",
        "fr-fr": "Utiliser les replis HTML5"
    },
    SHOW_SOURCE_SELECTOR: {
        "en-us": "Show list of available sources",
        "fr-fr": "Afficher la liste des formats disponibles"
    },
    SHOW_PLUGIN_SOURCE: {
        "en-us": "Include plug-in",
        "fr-fr": "Inclure le plugin"
    },
    SHOW_QTP_SOURCE: {
        "en-us": "Include QuickTime Player",
        "fr-fr": "Inclure QuickTime Player"
    },
    USE_PLAYLISTS: {
        "en-us": "Use playlists",
        "fr-fr": "Utiliser les listes de lecture"
    },
    SHOW_POSTER: {
        "en-us": "Show preview image",
        "fr-fr": "Afficher un aperçu de la vidéo"
    },
    SHOW_MEDIA_TOOLTIP: {
        "en-us": "Show video title as tooltip",
        "fr-fr": "Afficher le titre de la vidéo en infobulle"
    },
    SHOW_WEBKIT_VOLUME_SLIDER: {
        "en-us": "Show WebKit volume slider",
        "fr-fr": "Afficher le controlleur de volume"
    },
    HIDE_REWIND_BUTTON: {
        "en-us": "Hide “Rewind” button",
        "fr-fr": "Supprimer le bouton « Rembobiner 30 secondes »"
    },
    AUTOLOAD_MEDIA_PLAYER: {
        "en-us": "Load media player automatically",
        "fr-fr": "Charger le lecteur automatiquement"
    },
    AUTOPLAY_LOCATIONS: {
        "en-us": "Autoplay on these sites",
        "fr-fr": "Lancer la lecture automatiquement sur ces sites"
    },
    START_BUFFERING: {
        "en-us": "Start buffering once loaded",
        "fr-fr": "Commencer le téléchargement automatiquement"
    },
    INITIAL_BEHAVIOR: {
        "en-us": "Initial behavior",
        "en-gb": "Initial behaviour",
        "fr-fr": "Action initiale"
    },
    INITIAL_NO_BUFFER: {
        "en-us": "Do not buffer",
        "fr-fr": "Aucune"
    },
    INITIAL_BUFFER: {
        "en-us": "Start buffering",
        "fr-fr": "Commencer le téléchargement"
    },
    INITIAL_AUTOPLAY: {
        "en-us": "Start buffering and play automatically",
        "fr-fr": "Commencer la lecture automatiquement"
    },
    MAX_RESOLUTION: {
        "en-us": "Default resolution",
        "fr-fr": "Résolution par défaut"
    },
    DEFAULT_PLAYER: {
        "en-us": "Default media player",
        "fr-fr": "Lecteur par défaut"
    },
    HTML5_PLAYER: {
        "en-us": "HTML5",
        "fr-fr": "HTML5"
    },
    QUICKTIME_PLAYER: {
        "en-us": "QuickTime Player",
        "fr-fr": "QuickTime Player"
    },
    PLUGIN_PLAYER: {
        "en-us": "Plug-in",
        "fr-fr": "Plugin"
    },
    NONNATIVE_FORMATS_POLICY: {
        "en-us": "Nonnative formats policy",
        "fr-fr": "Formats non natifs"
    },
    NONNATIVE_IGNORE: {
        "en-us": "Never use as default",
        "fr-fr": "Ne jamais utiliser comme défaut"
    },
    NONNATIVE_LAST_RESORT: {
        "en-us": "Use only as a last resort",
        "fr-fr": "N’utiliser qu'en dernier recours"
    },
    NONNATIVE_USE_FREELY: {
        "en-us": "Use freely",
        "fr-fr": "Utiliser sans restrictions"
    },
    SOUND_VOLUME: {
        "en-us": "Initial sound volume",
        "fr-fr": "Volume sonore initial"
    },
    SHOW_IN_CONTEXT_MENU: {
        "en-us": "Show these options in the shortcut menu",
        "fr-fr": "Afficher ces options dans le menu contextuel"
    },
    DISABLE_ENABLE_CONTEXT: {
        "en-us": "Disable/Enable ClickToPlugin",
        "fr-fr": "Désactiver/Activer ClickToPlugin"
    },
    ALWAYS_ALLOW_CONTEXT: {
        "en-us": "Always Allow",
        "fr-fr": "Toujours autoriser"
    },
    ALWAYS_HIDE_CONTEXT: {
        "en-us": "Always Hide",
        "fr-fr": "Toujours masquer"
    },
    LOAD_ALL_CONTEXT: {
        "en-us": "Load All Plug-ins",
        "fr-fr": "Débloquer tous les plugins"
    },
    LOAD_INVISIBLE_CONTEXT: {
        "en-us": "Load Invisible Plug-ins",
        "fr-fr": "Débloquer les plugins invisibles"
    },
    HIDE_ALL_CONTEXT: {
        "en-us": "Hide All Plug-ins",
        "fr-fr": "Masquer tous les plugins"
    },
    DOWNLOAD_CONTEXT: {
        "en-us": "Download Video",
        "fr-fr": "Télécharger la vidéo"
    },
    VIEW_ON_SITE_CONTEXT: {
        "en-us": "View on Site",
        "fr-fr": "Voir la vidéo sur le site"
    },
    VIEW_IN_QTP_CONTEXT: {
        "en-us": "View in QuickTime Player",
        "fr-fr": "Ouvrir avec QuickTime Player"
    },
    LOAD_ALL_SHORTCUT: {
        "en-us": "Load all plug-ins in frontmost tab",
        "fr-fr": "Débloquer tous les plugins"
    },
    HIDE_ALL_SHORTCUT: {
        "en-us": "Hide all plug-ins in frontmost tab",
        "fr-fr": "Masquer tous les plugins"
    },
    HIDE_PLUGIN_SHORTCUT: {
        "en-us": "Hide targeted plug-in",
        "fr-fr": "Masquer le plugin ciblé"
    },
    PLAY_PAUSE_SHORTCUT: {
        "en-us": "Play/pause",
        "fr-fr": "Lecture/pause"
    },
    ENTER_FULLSCREEN_SHORTCUT: {
        "en-us": "Enter fullscreen",
        "fr-fr": "Mode plein écran"
    },
    VOLUME_UP_SHORTCUT: {
        "en-us": "Volume up",
        "fr-fr": "Augmenter le volume"
    },
    VOLUME_DOWN_SHORTCUT: {
        "en-us": "Volume down",
        "fr-fr": "Diminuer le volume"
    },
    TOGGLE_LOOPING_SHORTCUT: {
        "en-us": "Toggle looping",
        "fr-fr": "Activer/désactiver la répétition"
    },
    PREV_TRACK_SHORTCUT: {
        "en-us": "Previous track",
        "fr-fr": "Piste précédente"
    },
    NEXT_TRACK_SHORTCUT: {
        "en-us": "Next track",
        "fr-fr": "Piste suivante"
    },
    SHOW_TITLE_SHORTCUT: {
        "en-us": "Show/hide track title",
        "fr-fr": "Afficher/masquer le titre"
    },
    PLACEHOLDER_OPACITY: {
        "en-us": "Placeholder opacity",
        "fr-fr": "Transparence des boîtes de remplacement"
    },
    SIFR_POLICY: {
        "en-us": "sIFR text policy",
        "fr-fr": "Texte sIFR"
    },
    SIFR_TEXT_ONLY: {
        "en-us": "Show text only",
        "fr-fr": "N’afficher que le texte"
    },
    SIFR_NORMAL: {
        "en-us": "Treat as regular Flash",
        "fr-fr": "Considérer comme Flash"
    },
    SIFR_AUTOLOAD: {
        "en-us": "Load automatically",
        "fr-fr": "Autoriser"
    },
    MAX_INVISIBLE_SIZE: {
        "en-us": "Invisibility threshold",
        "fr-fr": "Seuil d'invisibilité"
    },
    PIXELS_UNIT: {
        "en-us": "pixels",
        "fr-fr": "pixels"
    },
    ALLOW_INVISIBLE_PLUGINS: {
        "en-us": "Allow invisible plug-ins",
        "fr-fr": "Autoriser les plugins invisibles"
    },
    DEBUG_MODE: {
        "en-us": "Block plug-ins manually",
        "fr-fr": "Bloquer les plugins manuellement"
    },
    SHOW_TOOLTIP: {
        "en-us": "Show plug-in source as tooltip",
        "fr-fr": "Afficher la source du plugin en infobulle"
    },
    YT5_COMPATIBILITY: {
        "en-us": "Use with the YouTube5 extension",
        "fr-fr": "Utiliser avec l'extension YouTube5"
    },
    
    // Context menu items
    PLUGIN_GENERIC: {
        "en-us": "Plug-in",
        "fr-fr": "le plugin"
    },
    CTP_PREFERENCES: {
        "en-us": "ClickToPlugin Preferences",
        "fr-fr": "Préférences ClickToPlugin"
    },
    TURN_CTP_ON: {
        "en-us": "Enable ClickToPlugin",
        "fr-fr": "Activer ClickToPlugin"
    },
    TURN_CTP_OFF: {
        "en-us": "Disable ClickToPlugin",
        "fr-fr": "Désactiver ClickToPlugin"
    },
    LOAD_ALL_PLUGINS: {
        "en-us": "Load All Plug-ins",
        "fr-fr": "Débloquer tous les plugins"
    },
    LOAD_INVISIBLE_PLUGINS: {
        "en-us": "Load Invisible Plug-ins",
        "fr-fr": "Débloquer les plugins invisibles"
    },
    HIDE_ALL_PLUGINS: {
        "en-us": "Hide All Plug-ins",
        "fr-fr": "Masquer tous les plugins"
    },
    ALWAYS_ALLOW_ON_DOMAIN: {
        "en-us": "Allow Plug-ins on Domain",
        "fr-fr": "Autoriser les plugins sur ce domaine"
    },
    ALWAYS_BLOCK_ON_DOMAIN: {
        "en-us": "Block Plug-ins on Domain",
        "fr-fr": "Bloquer les plugins sur ce domaine"
    },
    ALWAYS_ALLOW_SOURCE: {
        "en-us": "Always Allow",
        "fr-fr": "Toujours autoriser"
    },
    ALWAYS_HIDE_ON_DOMAIN: {
        "en-us": "Hide Plug-ins on Domain",
        "fr-fr": "Masquer les plugins sur ce domaine"
    },
    ALWAYS_SHOW_ON_DOMAIN: {
        "en-us": "Show Plug-ins on Domain",
        "fr-fr": "Afficher les plugins sur ce domaine"
    },
    ALWAYS_HIDE_SOURCE: {
        "en-us": "Always Hide",
        "fr-fr": "Toujours masquer"
    },
    DOWNLOAD_VIDEO: {
        "en-us": "Download Video",
        "fr-fr": "Télécharger la vidéo"
    },
    DOWNLOAD_AUDIO: {
        "en-us": "Download Audio",
        "fr-fr": "Télécharger l'audio"
    },
    VIEW_IN_QUICKTIME_PLAYER: {
        "en-us": "View in QuickTime Player",
        "fr-fr": "Ouvrir avec QuickTime Player"
    },
    GET_PLUGIN_INFO: {
        "en-us": "Get Plug-in Info",
        "fr-fr": "Lire les informations"
    },
    LOAD_PLUGIN: {
        "en-us": function(plugin) {return "Load " + plugin;},
        "fr-fr": function(plugin) {return "Charger " + plugin;}
    },
    HIDE_PLUGIN: {
        "en-us": function(plugin) {return "Hide " + plugin;},
        "fr-fr": function(plugin) {return "Masquer " + plugin;}
    },
    RESTORE_PLUGIN: {
        "en-us": function(plugin) {return "Restore " + plugin;},
        "fr-fr": function(plugin) {return "Restaurer " + plugin;}
    },
    VIEW_ON_SITE: {
        "en-us": function(site) {return "View on " + site;},
        "fr-fr": function(site) {return "Voir la vidéo sur " + site;}
    },
    
    // Dialogs
    QT_CONFIRM_LAUNCH_DIALOG: {
        "en-us": function(url) {return "A QuickTime object would like to play\n\n" + url + "\n\nin QuickTime Player. Do you want to allow it?";},
        "fr-fr": function(url) {return "Un objet QuickTime voudrait lancer le lecture de\n\n" + url + "\n\ndans QuickTime Player. Voulez-vous l'autoriser?";}
    }
};

for(var string in STRINGS) {
    var lang = navigator.language;
    do {
        this[string] = STRINGS[string][lang];
        lang = fallback(lang);
    } while(this[string] === undefined);
}

