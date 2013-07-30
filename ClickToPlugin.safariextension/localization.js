"use strict";
// ClickToPlugin localization file
// Save with encoding: UTF-8

var PREFERENCES_STRINGS = {
	"PREFERENCES_LAYOUT": {
		"en-us": ["nav{padding-right:1px;}", "#general li > span:first-child{max-width:160px;}"],
		"tr-tr": [],
		"it-it": ["#media_player li > span.textarea_label > label{max-width:200px;}"],
		"fr-fr": ["#media_player li > span:first-child{max-width:220px;}"],
		"es-es": ["nav{padding-right:1px;}", "#media_player li > span.textarea_label > label{max-width:200px;}"],
		"de-de": ["#general li > span:first-child{max-width:170px;}", "#media_player li > span.textarea_label > label{max-width:180px;}"],
		"ja-jp": ["nav{padding-right:1px;}", "#general li > span:first-child{max-width:250px;}"],
		"zh-tw": ["nav{padding-right:1px;}"],
		"zh-cn": [],
		"pl-pl": ["#control_lists li:nth-child(-n+2) span.textarea_label > label {min-width:230px;}"]
	},
	"PREFERENCES_TITLE": {
		"en-us": "ClickToPlugin Preferences",
		"tr-tr": "ClickToPlugin Ayarları",
		"it-it": "Preferenze di ClickToPlugin",
		"fr-fr": "Préférences ClickToPlugin",
		"es-es": "Preferencias de ClickToPlugin",
		"de-de": "ClickToPlugin-Einstellungen",
		"ja-jp": "ClickToPlugin 設定",
		"zh-tw": "ClickToPlugin 偏好設定",
		"zh-cn": "ClickToPlugin 設定",
		"pl-pl": "Ustawienia ClickToPlugin"
	},
	
	// Tabs
	"GENERAL_TAB": {
		"en-us": "General",
		"tr-tr": "Genel",
		"it-it": "Generale",
		"fr-fr": "Général",
		"es-es": "General",
		"de-de": "Allgemein",
		"ja-jp": "一般",
		"zh-tw": "一般",
		"zh-cn": "通用",
		"pl-pl": "Ogólne"
	},
	"PLUGINS_TAB": {
		"en-us": "Plug-ins",
		"tr-tr": "Plug-inler",
		"it-it": "Plugin",
		"fr-fr": "Plugins",
		"es-es": "Complementos",
		"de-de": "Plug-Ins",
		"ja-jp": "プラグイン",
		"zh-tw": "外掛模組",
		"zh-cn": "插件",
		"pl-pl": "Wtyczki"
	},
	"CONTROL_LISTS_TAB": {
		"en-us": "Control lists",
		"tr-tr": "Kontrol listeleri",
		"it-it": "Elenchi Controllo",
		"fr-fr": "Listes de contrôle",
		"es-es": "Listas de control",
		"de-de": "Filterregeln",
		"ja-jp": "制御リスト",
		"zh-tw": "控制表",
		"zh-cn": "控制表",
		"pl-pl": "Listy wyjątków"
	},
	"MEDIA_TAB": {
		"en-us": "Media player",
		"tr-tr": "Ortam oynatıcısı",
		"it-it": "Lettore multimediale",
		"fr-fr": "Lecteur multimédia",
		"es-es": "Reproductor multimedia",
		"de-de": "Media-Player",
		"ja-jp": "プレーヤー",
		"zh-tw": "影片播放器",
		"zh-cn": "视频播放器",
		"pl-pl": "Odtwarzacz mediów"
	},
	"CONTEXT_MENU_TAB": {
		"en-us": "Shortcut menu",
		"tr-tr": "Kısayol menüsü",
		"it-it": "Menu di scelta rapida",
		"fr-fr": "Menu contextuel",
		"es-es": "Menú contextual",
		"de-de": "Kontextmenü",
		"ja-jp": "コンテキストメニュー",
		"zh-tw": "快顯功能表",
		"zh-cn": "快显菜单",
		"pl-pl": "Menu kontekstowe"
	},
	"SHORTCUTS_TAB": {
		"en-us": "Keyboard shortcuts",
		"tr-tr": "Klavye kısayolları",
		"it-it": "Abbreviazioni da tastiera",
		"fr-fr": "Raccourcis clavier",
		"es-es": "Accesos por teclado",
		"de-de": "Keyboard-Shortcuts",
		"ja-jp": "ショートカット",
		"zh-tw": "鍵盤快速鍵",
		"zh-cn": "快捷键",
		"pl-pl": "Skróty klawiszowe"
	},
	
	// General tab
	"PLACEHOLDER_OPACITY": {
		"en-us": "Placeholder opacity:",
		"tr-tr": "Yer tutucu saydamlığı",
		"it-it": "Opacità segnaposto:",
		"fr-fr": "Transparence des boîtes de remplacement :",
		"es-es": "Opacidad:",
		"de-de": "Platzhalter-Transparenz",
		"ja-jp": "プレイスホールダーの不透明度",
		"zh-tw": "佔位符不透明度",
		"zh-cn": "占位符不透明度",
		"pl-pl": "Nieprzezroczystość zastępczego obrazka:"
	},
	"SHOW_TOOLTIP": {
		"en-us": "Show plug-in source as tooltip",
		"tr-tr": "Plug-in kaynağını tiyo olarak göster",
		"it-it": "Mostra fonte plugin come suggerimento",
		"fr-fr": "Afficher la source du plugin en infobulle",
		"es-es": "Mostrar la procedencia del complemento como mensaje de ayuda contextual",
		"de-de": "Plug-In-Quelle im Tooltip anzeigen",
		"ja-jp": "ツールチップとしてプラグインのソースを表示する",
		"zh-tw": "以快顯視窗顯示外掛模組來源",
		"zh-cn": "在工具提示控件显示插件来源",
		"pl-pl": "Pokaż adres źródłowy w etykietce"
	},
	"ALLOW_INVISIBLE_PLUGINS": {
		"en-us": "Allow invisible plug-ins",
		"tr-tr": "Görünmez plug-inlere izin ver",
		"it-it": "Permetti plugin invisibili",
		"fr-fr": "Autoriser les plugins invisibles",
		"es-es": "Permitir los complementos invisibles",
		"de-de": "Unsichtbare Plug-Ins erlauben",
		"ja-jp": "不可視プラグインを有効にする",
		"zh-tw": "載入不可見的外掛模組",
		"zh-cn": "加载不可見的插件",
		"pl-pl": "Zezwól na niewidoczne wtyczki"
	},
	"DEBUG_MODE": {
		"en-us": "Block plug-ins manually",
		"tr-tr": "Plug-inleri el ile engelle",
		"it-it": "Blocca plugin manualmente",
		"fr-fr": "Bloquer les plugins manuellement",
		"es-es": "Bloquear los complementos manualmente",
		"de-de": "Plug-Ins manuell blockieren",
		"ja-jp": "手動的にプラグインを抑止する",
		"zh-tw": "手動阻擋外掛模組",
		"zh-cn": "手动屏蔽插件",
		"pl-pl": "Blokuj wtyczki ręcznie"
	},
	"SIFR_POLICY": {
		"en-us": "sIFR text policy:",
		"tr-tr": "sIFR metin politikası",
		"it-it": "Testo sIFR:",
		"fr-fr": "Texte sIFR :",
		"es-es": "Texto sIFR:",
		"de-de": "sIFR-Richtlinie:",
		"ja-jp": "sIFR テキスト設定：",
		"zh-tw": "sIFR 文字設定：",
		"zh-cn": "sIFR 文字:",
		"pl-pl": "Tekst sIFR:"
	},
	"SIFR_TEXT_ONLY": {
		"en-us": "Show text only",
		"tr-tr": "Sadece metin olarak göster",
		"it-it": "Mostra solo testo",
		"fr-fr": "N’afficher que le texte",
		"es-es": "Únicamente mostrar el texto",
		"de-de": "Nur Text anzeigen",
		"ja-jp": "テキストのみを表示",
		"zh-tw": "只顯示文字",
		"zh-cn": "只显示文本",
		"pl-pl": "Tylko pokaż tekst"
	},
	"SIFR_NORMAL": {
		"en-us": "Treat as regular Flash",
		"tr-tr": "Olağan flash olarak muamele et",
		"it-it": "Tratta come normale Flash",
		"fr-fr": "Considérer comme Flash",
		"es-es": "Tratar como un complemento Flash",
		"de-de": "Als normales Flash behandeln",
		"ja-jp": "Flash として扱う",
		"zh-tw": "當作一般 Flash",
		"zh-cn": "当作一般 Flash",
		"pl-pl": "Traktuj jak wtyczkę Flash"
	},
	"SIFR_AUTOLOAD": {
		"en-us": "Load automatically",
		"tr-tr": "Otomatik yükle",
		"it-it": "Carica automaticamente",
		"fr-fr": "Autoriser",
		"es-es": "Cargar automáticamente",
		"de-de": "Automatisch laden",
		"ja-jp": "自動的に読み込む",
		"zh-tw": "自動載入",
		"zh-cn": "自动加载",
		"pl-pl": "Wczytaj automatycznie"
	},
	"KILLER_SCRIPTS": {
		"en-us": "Plug-in to HTML5 conversion scripts:",
		"tr-tr": "Plug-ini HTML5’e çevirme komutları",
		"it-it": "Script per la conversione in HTML5:",
		"fr-fr": "Scripts de conversion en HTML5 :",
		"es-es": "Scripts para conversiones en HTML5:",
		"de-de": "Scripte zum umwandeln von Plug-Ins zu HTML5:",
		"ja-jp": "これらのスクリプトを使用してHTML5の置き換えを実行する：",
		"zh-tw": "使用這些腳本進行HTML5取代：",
		"zh-cn": "使用这些脚本进行HTML5替代:",
		"pl-pl": "Skrypty konwersji wtyczek na HTML5:"
	},
	"DEFAULT_KILLERS_BUTTON": {
		"en-us": "Use default",
		"tr-tr": "Varsayılana dön",
		"it-it": "Utilizza default",
		"fr-fr": "Défaut",
		"es-es": "Predeterminado",
		"de-de": "Zurücksetzen",
		"ja-jp": "デフォルトに戻す",
		"zh-tw": "使用預設值",
		"zh-cn": "还原默认值",
		"pl-pl": "Przywróć domyślne"
	},
	"LOAD_PLUGIN_IF_NOT_KILLED": {
		"en-us": "Load plug-in if HTML5 conversion fails",
		"tr-tr": "Plug-ini, eğer HTML5 çevrimi başarısız olursa yükle",
		"it-it": "Carica plugin se la conversione in HTML5 non riesce",
		"fr-fr": "Charger le plugin si la conversion en HTML5 échoue",
		"es-es": "Cargar el complemento si la conversión a HTML5 falla",
		"de-de": "Lade Plug-in wenn HTML5-Umwandlung fehlschlägt",
		"ja-jp": "HTML5の置き換えに問題が発生する場合はプラグインに戻す",
		"zh-tw": "當外掛模組不能被轉換成 HTML5 時重新載入外掛模組",
		"zh-cn": "当HTML5替代失败时重新加载插件",
		"pl-pl": "Użyj wtyczki, gdy konwersja się nie powiedzie"
	},
	"USE_FALLBACK_MEDIA": {
		"en-us": "Use HTML5 media fallbacks",
		"tr-tr": "HTML5 medya yedeklerini kullan",
		"it-it": "Utilizza HTML5 fallback media",
		"fr-fr": "Utiliser les replis HTML5",
		"es-es": "Utilizar “fallbacks” en HTML5",
		"de-de": "HTML5-Media-Fallbacks benutzen",
		"ja-jp": "HTML5 のフォールバックセクションを有効にする",
		"zh-tw": "使用 HTML5 的後備（Fallback）機制",
		"zh-cn": "使用 HTML5 的应变（Fallback）计划",
		"pl-pl": "Zastępcze pliki dla mediów HTML5"
	},
	"DOWNLOADING": {
		"en-us": "Downloading:",
		"tr-tr": "İndiriyor",
		"it-it": "Download:",
		"fr-fr": "Téléchargements :",
		"es-es": "Descargas:",
		"de-de": "Download:",
		"ja-jp": "ダウンロード：",
		"zh-tw": "下載：",
		"zh-cn": "下载:",
		"pl-pl": "Pobieranie:"
	},
	"USE_DOWNLOAD_MANAGER": {
		"en-us": "Use a download manager",
		"tr-tr": "İndirme yöneticisi kullan",
		"it-it": "Utilizza un gestore di download",
		"fr-fr": "Utiliser un gestionnaire de téléchargement",
		"es-es": "Utilizar un gestor de descargas",
		"de-de": "Downloadmanager benutzen",
		"ja-jp": "ダウンロードマネージャーを使う",
		"zh-tw": "啟用下載管理程式",
		"zh-cn": "启用下载管理工具",
		"pl-pl": "Użyj menedżera pobierania"
	},
	"AIRPLAY_HOSTNAME": {
		"en-us": "AirPlay device hostname:",
		"tr-tr": "AirPlay aygıt ismi:",
		"it-it": "Nome host dispositivo AirPlay:",
		"fr-fr": "Périphérique AirPlay :",
		"es-es": "Nombre del dispositivo AirPlay:",
		"de-de": "AirPlay-Geräte-Hostname:",
		"ja-jp": "AirPlay ホスト名：",
		"zh-tw": "AirPlay 主機名稱：",
		"zh-cn": "AirPlay 主机名称:",
		"pl-pl": "Host urządzenia AirPlay:"
	},
	"AIRPLAY_PASSWORD": {
		"en-us": "AirPlay password:",
		"tr-tr": "AirPlay parolası:",
		"it-it": "Password AirPlay:",
		"fr-fr": "Mot de passe AirPlay :",
		"es-es": "Contraseña para AirPlay:",
		"de-de": "AirPlay-Passwort:",
		"ja-jp": "AirPlay パスワード：",
		"zh-tw": "AirPlay 密碼：",
		"zh-cn": "AirPlay 密码:",
		"pl-pl": "Hasło AirPlay:"
	},
	
	// Plug-ins tab
	"ALLOW_THESE_PLUGINS": {
		"en-us": "Load these plug-ins automatically:",
		"tr-tr": "Bu plug-inlerı otomatik yükle:",
		"it-it": "Carica questi plugin automaticamente:",
		"fr-fr": "Autoriser ces plugins :",
		"es-es": "Permitir estos complementos:",
		"de-de": "Folgende Plug-Ins automatisch laden:",
		"ja-jp": "これらのプラグインを有効にする：",
		"zh-tw": "允許載入這些外掛模組：",
		"zh-cn": "加载这些插件:",
		"pl-pl": "Wczytaj te wtyczki automatycznie:"
	},
	"NO_PLUGINS_NOTICE": {
		"en-us": "You currently have no enabled plug-ins!",
		"tr-tr": "Şu anda aktif plug-ininiz yok!",
		"it-it": "Attualmente non hai nessun plugin abilitato!",
		"fr-fr": "Aucun plugin actif!",
		"es-es": "Actualmente no tienens ningún complemento habilitado!",
		"de-de": "Sie haben aktuell keine Plug-Ins aktiviert!",
		"ja-jp": "有効されているプラグインは見つかりませんでした。",
		"zh-tw": "現在沒有被啟用的外掛模組。",
		"zh-cn": "没有已激活的插件。",
		"pl-pl": "Nie masz włączonych wtyczek."
	},
	"PLUGIN_FILENAME": {
		"en-us": function(file) {return "From file: " + file;},
		"tr-tr": function(file) {return file + " dosyasından";},
		"it-it": function(file) {return "Dal file: " + file;},
		"fr-fr": function(file) {return "Fichier : " + file;},
		"es-es": function(file) {return "Desde el archivo: " + file;},
		"de-de": function(file) {return "Von Datei: " + file;},
		"ja-jp": function(file) {return "ファイルから：" + file;},
		"zh-tw": function(file) {return "從檔案：" + file;},
		"zh-cn": function(file) {return "从文件: " + file;},
		"pl-pl": function(file) {return "Plik wtyczki: " + file;}
	},
	"PLUGIN_DESCRIPTION": {
		"en-us": function(text) {return "Description: " + text;},
		"tr-tr": function(text) {return "Tanım: " + text;},
		"it-it": function(text) {return "Descrizione: " + text;},
		"fr-fr": function(text) {return "Description : " + text;},
		"es-es": function(text) {return "Descripción: " + text;},
		"de-de": function(text) {return "Beschreibung: " + text;},
		"ja-jp": function(text) {return "情報：" + text;},
		"zh-tw": function(text) {return "詳細資料：" + text;},
		"zh-cn": function(text) {return "细节: " + text;},
		"pl-pl": function(text) {return "Opis: " + text;}
	},
	
	// Control lists tab
	"ALLOW_LOCATIONS": {
		"en-us": "Allow plug-ins on these sites:",
		"tr-tr": "Bu sayfalardaki plug-inlere izin ver:",
		"it-it": "Permetti plugin su questi siti:",
		"fr-fr": "Autoriser les plugins sur ces sites :",
		"es-es": "Permitir los complementos en estos sitios:",
		"de-de": "Plug-Ins auf folgenden Seiten erlauben:",
		"ja-jp": "これらのサイトならプラグインの読み込みを許可：",
		"zh-tw": "永遠載入包含這些網址的外掛模組：",
		"zh-cn": "永远加载这些地址的插件:",
		"pl-pl": "Zezwól na wtyczki na tych stronach:"
	},
	"ALLOW_SOURCES": {
		"en-us": "Allow plug-ins from these sources:",
		"tr-tr": "Bu kaynaklardaki plug-inlere izin ver:",
		"it-it": "Permetti plugin da queste fonti:",
		"fr-fr": "Autoriser les plugins provenant de :",
		"es-es": "Permitir los complementos en los archivos:",
		"de-de": "Plug-Ins von folgenden Quellen erlauben:",
		"ja-jp": "これらのソースならプラグインの読み込みを許可：",
		"zh-tw": "永遠載入包含這些來源的外掛模組：",
		"zh-cn": "永远加载这些来源的插件:",
		"pl-pl": "Zezwól na wtyczki z tych źródeł:"
	},
	"BLOCK_LOCATIONS": {
		"en-us": "Block plug-ins on these sites:",
		"tr-tr": "Bu sayfalardaki plug-inleri engelle:",
		"it-it": "Blocca plugin su questi siti:",
		"fr-fr": "Bloquer les plugins sur ces sites :",
		"es-es": "Bloquear los complementos en estos sitios:",
		"de-de": "Plug-Ins auf folgenden Seiten blockieren:",
		"ja-jp": "これらのサイトならプラグイン読み込むことを抑止：",
		"zh-tw": "阻擋包含這些網址的外掛模組：",
		"zh-cn": "永远屏蔽这些地址的插件:",
		"pl-pl": "Blokuj wtyczki na tych stronach:"
	},
	"BLOCK_SOURCES": {
		"en-us": "Block plug-ins from these sources:",
		"tr-tr": "Bu kaynaklardaki plug-inleri engelle:",
		"it-it": "Blocca plugin da queste fonti:",
		"fr-fr": "Bloquer les plugins provenant de :",
		"es-es": "Bloquear los complementos en los archivos:",
		"de-de": "Plug-Ins von folgenden Quellen blockieren:",
		"ja-jp": "これらのソースならプラグイン読み込むことを抑止：",
		"zh-tw": "阻擋這些來源的外掛模組：",
		"zh-cn": "永远屏蔽这些来源的插件:",
		"pl-pl": "Blokuj wtyczki z tych źródeł:"
	},
	"INVERT_WHITELISTS": {
		"en-us": "Invert lists",
		"tr-tr": "Listeleri çevir",
		"it-it": "Inverti elenchi",
		"fr-fr": "Inverser",
		"es-es": "Invertir las listas",
		"de-de": "Listen invertieren",
		"ja-jp": "逆にする",
		"zh-tw": "逆向操作",
		"zh-cn": "反转清单",
		"pl-pl": "Odwróć listy"
	},
	"HIDE_LOCATIONS": {
		"en-us": "Hide plug-ins on these sites:",
		"tr-tr": "Bu sayfalardaki plug-inleri gizle:",
		"it-it": "Nascondi plugin su questi siti:",
		"fr-fr": "Masquer les plugins sur ces sites :",
		"es-es": "Ocultar los complementos en estos sitios:",
		"de-de": "Plug-Ins auf folgenden Seiten verstecken:",
		"ja-jp": "これらのサイトならプラグインを隠す：",
		"zh-tw": "隱藏包含這些網址的外掛模組：",
		"zh-cn": "隐藏这些地址的插件:",
		"pl-pl": "Ukryj wtyczki na tych stronach:"
	},
	"HIDE_SOURCES": {
		"en-us": "Hide plug-ins from these sources:",
		"tr-tr": "Bu kaynaklardaki plug-inleri gizle:",
		"it-it": "Nascondi plugin da queste fonti:",
		"fr-fr": "Masquer les plugins provenant de :",
		"es-es": "Ocultar los complementos en los archivos:",
		"de-de": "Plug-Ins von folgenden Quellen verstecken:",
		"ja-jp": "これらのソースならプラグインを隠す：",
		"zh-tw": "隱藏這些來源的外掛模組：",
		"zh-cn": "隐藏这些来源的插件:",
		"pl-pl": "Ukryj wtyczki z tych źródeł:"
	},
	"SHOW_LOCATIONS": {
		"en-us": "Show plug-ins on these sites:",
		"tr-tr": "Bu sayfalardaki plug-inleri göster",
		"it-it": "Mostra plugin su questi siti:",
		"fr-fr": "Afficher les plugins sur ces sites :",
		"es-es": "Mostrar los complementos en estos sitios:",
		"de-de": "Plug-Ins auf folgenden Seiten anzeigen:",
		"ja-jp": "これらのサイトならプラグインを表示する：",
		"zh-tw": "顯示包含這些網址的外掛模組：",
		"zh-cn": "显示这些地址的插件:",
		"pl-pl": "Pokaż wtyczki na tych stronach:"
	},
	"SHOW_SOURCES": {
		"en-us": "Show plug-ins from these sources:",
		"tr-tr": "Bu kaynaklardaki plug-inleri göster",
		"it-it": "Mostra plugin da queste fonti:",
		"fr-fr": "Afficher les plugins provenant de :",
		"es-es": "Mostrar los complementos en los archivos:",
		"de-de": "Plug-Ins von folgenden Quellen anzeigen:",
		"ja-jp": "これらのソースならプラグインを表示する：",
		"zh-tw": "顯示這些來源的外掛模組：",
		"zh-cn": "永远显示这些来源的插件:",
		"pl-pl": "Pokaż wtyczki z tych źródeł:"
	},
	"INVERT_BLACKLISTS": {
		"en-us": "Invert lists",
		"tr-tr": "Listeleri çevir",
		"it-it": "Inverti elenchi",
		"fr-fr": "Inverser",
		"es-es": "Invertir las listas",
		"de-de": "Listen invertieren",
		"ja-jp": "逆にする",
		"zh-tw": "逆向操作",
		"zh-cn": "反转清单",
		"pl-pl": "Odwróć listy"
	},
	
	// Media player tab
	"DEFAULT_PLAYER": {
		"en-us": "Default media player:",
		"tr-tr": "Varsayılan ortam oynatıcı:",
		"it-it": "Lettore multimediale di default:",
		"fr-fr": "Lecteur par défaut :",
		"es-es": "Reproductor multimedia por defecto:",
		"de-de": "Standard Media-Player:",
		"ja-jp": "デフォルトプレーヤー：",
		"zh-tw": "預設播放器：",
		"zh-cn": "默认播放器:",
		"pl-pl": "Domyślny odtwarzacz mediów:"
	},
	// "HTML5_PLAYER": {} // "HTML5"
	"PLUGIN_PLAYER": {
		"en-us": "Plug-in",
		"tr-tr": "Plug-in",
		"it-it": "Plugin",
		"fr-fr": "Plugin",
		"es-es": "Complemento",
		"de-de": "Plug-In",
		"ja-jp": "プラグイン",
		"zh-tw": "外掛模組",
		"zh-cn": "插件",
		"pl-pl": "Wtyczka"
	},
	"QUICKTIME_PLAYER": {
		"en-us": "QuickTime Player",
		"tr-tr": "QuickTime Player",
		"it-it": "QuickTime Player",
		"fr-fr": "QuickTime Player",
		"es-es": "QuickTime Player",
		"de-de": "QuickTime-Player",
		"ja-jp": "QuickTime プレーヤー",
		"zh-tw": "QuickTime Player",
		"zh-cn": "QuickTime Player",
		"pl-pl": "QuickTime Player"
	},
	// "AIRPLAY_PLAYER": {} // "AirPlay"
	"AUTOLOAD_MEDIA_PLAYER": {
		"en-us": "Load media player automatically",
		"tr-tr": "Ortam oynatıcısını otomatik yükle",
		"it-it": "Carica lettore multimediale automaticamente",
		"fr-fr": "Charger le lecteur automatiquement",
		"es-es": "Cargar el reproductor automáticamente",
		"de-de": "Media-Player automatisch laden",
		"ja-jp": "プレーヤーを自動的に読み込む",
		"zh-tw": "自動載入播放器",
		"zh-cn": "自动加载播放器",
		"pl-pl": "Wczytaj odtwarzacz automatycznie"
	},
	"AUTOPLAY_LOCATIONS": {
		"en-us": "Autoplay on these sites:",
		"tr-tr": "Bu sayfalarda otomatik oynat:",
		"it-it": "Riproduzione automatica su questi siti:",
		"fr-fr": "Lancer la lecture automatiquement sur ces sites :",
		"es-es": "Reproducir automáticamente en estos sitios:",
		"de-de": "Automatische Wiedergabe auf folgenden Seiten:",
		"ja-jp": "これらのサイトならプレーヤーを自動的に起動する：",
		"zh-tw": "在這些網址自動播放：",
		"zh-cn": "在这些地址启用自动播放:",
		"pl-pl": "Odtwarzaj automatycznie na tych stronach:"
	},
	"INITIAL_BEHAVIOR": {
		"en-us": "Initial behavior:",
		"tr-tr": "İlk davranış:",
		"it-it": "Comportamento iniziale:",
		"en-gb": "Initial behaviour:",
		"fr-fr": "Action initiale :",
		"es-es": "Acción inicial:",
		"de-de": "Standardverhalten:",
		"ja-jp": "初期挙動：",
		"zh-tw": "初始動作：",
		"zh-cn": "初始動作:",
		"pl-pl": "Początkowe działanie:"
	},
	"INITIAL_NO_BUFFER": {
		"en-us": "Do not preload",
		"tr-tr": "Ön yükleme yapma",
		"it-it": "Non precaricare",
		"fr-fr": "Aucune",
		"es-es": "No precargar",
		"de-de": "Nicht puffern",
		"ja-jp": "何もしません",
		"zh-tw": "不緩衝",
		"zh-cn": "不缓冲",
		"pl-pl": "Nie wczytuj"
	},
	"INITIAL_BUFFER": {
		"en-us": "Preload",
		"tr-tr": "Önyükleme",
		"it-it": "Precarica",
		"fr-fr": "Préchargement",
		"es-es": "Emprezar la precarga",
		"de-de": "Puffern",
		"ja-jp": "バッファリングを始めます",
		"zh-tw": "只開始緩衝",
		"zh-cn": "开始缓冲",
		"pl-pl": "Wczytuj"
	},
	"INITIAL_AUTOPLAY": {
		"en-us": "Autoplay",
		"tr-tr": "Otomatik oynat",
		"it-it": "Riproduzione automatica",
		"fr-fr": "Lecture automatique",
		"es-es": "Reproducir automáticamente",
		"de-de": "Automatisch wiedergeben",
		"ja-jp": "バッファリングを始めると共に再生します",
		"zh-tw": "開始緩衝並且自動播放",
		"zh-cn": "开始缓冲并且自动播放",
		"pl-pl": "Odtwarzaj automatycznie"
	},
	"INSTANT_AUTOPLAY": {
		"en-us": "Instant autoplay",
		"tr-tr": "Anında oynat",
		"it-it": "Riproduzione automatica immediata",
		"fr-fr": "Lecture automatique immédiate",
		"es-es": "Reproducción sin esperas",
		"de-de": "Sofortige Wiedergabe",
		"ja-jp": "直接に再生",
		"zh-tw": "即時播放",
		"zh-cn": "立即播放",
		"pl-pl": "Natychmiastowe auto odtwarzanie"
	},
	"DEFAULT_RESOLUTION": {
		"en-us": "Default resolution:",
		"tr-tr": "Varsayılan çözünürlük:",
		"it-it": "Risoluzione di default:",
		"fr-fr": "Résolution par défaut :",
		"es-es": "Resolución por defecto:",
		"de-de": "Standardauflösung:",
		"ja-jp": "デフォルト解像度：",
		"zh-tw": "預設解像度：",
		"zh-cn": "默认解像度:",
		"pl-pl": "Domyślna jakość:"
	},
	"NONNATIVE_FORMATS_POLICY": {
		"en-us": "Nonnative formats policy:",
		"tr-tr": "Yerel olmayan biçimler için kurallar:",
		"it-it": "Formati non nativi:",
		"fr-fr": "Formats non natifs :",
		"es-es": "Formatos no nativos:",
		"de-de": "Regel für proprietäre Formate:",
		"ja-jp": "非ネイティブなコーデック：",
		"zh-tw": "非原生解碼器：",
		"zh-cn": "非原生解码器:",
		"pl-pl": "Nienatywne formaty:"
	},
	"NONNATIVE_IGNORE": {
		"en-us": "Never use as default",
		"tr-tr": "Asla varsayılan olarak kullanma",
		"it-it": "Non utilizzare come default",
		"fr-fr": "Ne jamais utiliser comme défaut",
		"es-es": "Nunca usar por defecto",
		"de-de": "Niemals als Standard verwenden",
		"ja-jp": "使用せず",
		"zh-tw": "不使用",
		"zh-cn": "不使用",
		"pl-pl": "Nigdy nie używaj"
	},
	"NONNATIVE_LAST_RESORT": {
		"en-us": "Use only as a last resort",
		"tr-tr": "Son çare olarak kullan",
		"it-it": "Utilizza solo come ultima risorsa",
		"fr-fr": "N’utiliser qu’en dernier recours",
		"es-es": "Usar como última opción",
		"de-de": "Nur als letzten Versuch verwenden",
		"ja-jp": "候補にする",
		"zh-tw": "作為最後選擇",
		"zh-cn": "作为最后选择",
		"pl-pl": "Używaj w ostateczności"
	},
	"NONNATIVE_USE_FREELY": {
		"en-us": "Use freely",
		"tr-tr": "Serbestçe kullan",
		"it-it": "Utilizza liberamente",
		"fr-fr": "Utiliser sans restrictions",
		"es-es": "Usar libremente",
		"de-de": "Frei verwenden",
		"ja-jp": "自由に使う",
		"zh-tw": "任意使用",
		"zh-cn": "自由使用",
		"pl-pl": "Używaj swobodnie"
	},
	"SOURCE_SELECTOR": {
		"en-us": "Source selector:",
		"tr-tr": "Kaynak seçimi:",
		"it-it": "Selettore di fonte:",
		"fr-fr": "Sélecteur de médias :",
		"es-es": "Selector de fuentes:",
		"de-de": "Quellenauswahl:",
		"ja-jp": "ソースセレクタ：",
		"zh-tw": "來源選取器：",
		"zh-cn": "来源选择器:",
		"pl-pl": "Wybór źródła:"
	},
	"SHOW_MEDIA_SOURCES": {
		"en-us": "Include media sources",
		"tr-tr": "Ortam kaynaklarını göster",
		"it-it": "Includi fonti multimediali",
		"fr-fr": "Inclure les formats disponibles",
		"es-es": "Incluir fuentes multimedia",
		"de-de": "Medienquellen anzeigen",
		"ja-jp": "メディアのソースを含む",
		"zh-tw": "包括媒體來源",
		"zh-cn": "包含媒体的来源",
		"pl-pl": "Dołącz źródła mediów"
	},
	"SHOW_PLUGIN_SOURCE": {
		"en-us": "Include plug-in",
		"tr-tr": "Plug-ini göster",
		"it-it": "Includi plugin",
		"fr-fr": "Inclure le plugin",
		"es-es": "Incluir el complemento",
		"de-de": "Plug-In anzeigen",
		"ja-jp": "プラグインを含む",
		"zh-tw": "包括外掛模組",
		"zh-cn": "包含插件",
		"pl-pl": "Dołącz wtyczkę"
	},
	"SHOW_QTP_SOURCE": {
		"en-us": "Include QuickTime Player",
		"tr-tr": "QuickTime Player’ı göster",
		"it-it": "Includi QuickTime Player",
		"fr-fr": "Inclure QuickTime Player",
		"es-es": "Incluir QuickTime Player",
		"de-de": "QuickTime-Player anzeigen",
		"ja-jp": "QuickTime プレーヤーを含む",
		"zh-tw": "包括 QuickTime Player",
		"zh-cn": "包含 QuickTime Player",
		"pl-pl": "Dołącz QuickTime Player"
	},
	"SHOW_AIRPLAY_SOURCE": {
		"en-us": "Include AirPlay",
		"tr-tr": "AirPlay’i göster",
		"it-it": "Includi AirPlay",
		"fr-fr": "Inclure AirPlay",
		"es-es": "Incluir AirPlay",
		"de-de": "AirPlay anzeigen",
		"ja-jp": "AirPlay を含む",
		"zh-tw": "包括 AirPlay",
		"zh-cn": "包含 AirPlay",
		"pl-pl": "Dołącz AirPlay"
	},
	"SHOW_SITE_SOURCE": {
		"en-us": "Include the video’s web page",
		"tr-tr": "Videonun sayfasını göster",
		"it-it": "Includi la pagina web del video",
		"fr-fr": "Inclure la page web de la vidéo",
		"es-es": "Incluir la página web del video",
		"de-de": "Video-Seite anzeigen",
		"ja-jp": "ビデオの参照元URLを含む",
		"zh-tw": "包括影片的來源頁",
		"zh-cn": "包含视频原先的页面",
		"pl-pl": "Dołącz stronę z wideo"
	},
	"SHOW_POSTER": {
		"en-us": "Show preview image",
		"tr-tr": "Önizleme resmini göster",
		"it-it": "Mostra immagine di anteprima",
		"fr-fr": "Afficher un aperçu de la vidéo",
		"es-es": "Mostrar la imagen de previsualización",
		"de-de": "Vorschau anzeigen",
		"ja-jp": "プレビューを有効にする",
		"zh-tw": "啟用預覽",
		"zh-cn": "显示缩图",
		"pl-pl": "Pokaż obrazek podglądu"
	},
	"HIDE_REWIND_BUTTON": {
		"en-us": "Hide “Rewind” button",
		"tr-tr": "“Sarma” tuşunu gizle",
		"it-it": "Nascondi pulsante “Riavvolgi”",
		"fr-fr": "Supprimer le bouton « Rembobiner »",
		"es-es": "Ocultar el botón Rebobinar",
		"de-de": "„Zurückspul“-Knopf ausblenden",
		"ja-jp": "「巻き戻し」ボタンを隠す",
		"zh-tw": "隱藏「迴轉」按鈕",
		"zh-cn": "隐藏「倒带」按钮",
		"pl-pl": "Ukryj przycisk „Przewiń wstecz”"
	},
	"SOUND_VOLUME": {
		"en-us": "Sound volume:",
		"tr-tr": "Ses seviyesi: ",
		"it-it": "Volume del suono:",
		"fr-fr": "Volume sonore :",
		"es-es": "Volumen del sonido:",
		"de-de": "Lautstärke:",
		"ja-jp": "音量：",
		"zh-tw": "音量：",
		"zh-cn": "音量:",
		"pl-pl": "Głośność dźwięku:"
	},
	
	// Shortcut menu tab
	"SHOW_IN_CONTEXT_MENU": {
		"en-us": "Show these commands in the shortcut menu:",
		"tr-tr": "Bu komutları kısayol menüsünde göster:",
		"it-it": "Mostra questi comandi nel menu di scelta rapida:",
		"fr-fr": "Afficher ces options dans le menu contextuel :",
		"es-es": "Mostrar estas opciones en el menú contextual:",
		"de-de": "Folgende Befehle im Kontextmenü anzeigen:",
		"ja-jp": "これらのコマンドをコンテキストメニューで表示：",
		"zh-tw": "在快顯功能表顯示這些指令：",
		"zh-cn": "在快显菜单显示这些命令:",
		"pl-pl": "Pokaż te komendy w menu kontekstowym:"
	},
	"SETTINGS_CONTEXT": {
		"en-us": "ClickToPlugin Preferences",
		"tr-tr": "ClickToPlugin ayarları",
		"it-it": "Preferenze di ClickToPlugin",
		"fr-fr": "Préférences ClickToPlugin",
		"es-es": "Preferencias de ClickToPlugin",
		"de-de": "ClickToPlugin-Einstellungen",
		"ja-jp": "ClickToPlugin 設定",
		"zh-tw": "ClickToPlugin 偏好設定",
		"zh-cn": "ClickToPlugin 設定",
		"pl-pl": "Ustawienia ClickToPlugin"
	},
	"DISABLE_ENABLE_CONTEXT": {
		"en-us": "Disable/Enable ClickToPlugin",
		"tr-tr": "ClickToPlugin’i aç/kapa",
		"it-it": "Disabilita/Abilita ClickToPlugin",
		"fr-fr": "Désactiver/Activer ClickToPlugin",
		"es-es": "Desactivar/Activar ClickToPlugin",
		"de-de": "ClickToPlugin deaktivieren/aktivieren",
		"ja-jp": "ClickToPlugin を有効／無効にする",
		"zh-tw": "啟用或停用 ClickToPlugin",
		"zh-cn": "启用/停用 ClickToPlugin",
		"pl-pl": "Aktywuj/dezaktywuj ClickToPlugin"
	},
	"ALWAYS_ALLOW_CONTEXT": {
		"en-us": "Always Allow",
		"tr-tr": "Herzaman izin ver",
		"it-it": "Consenti sempre",
		"fr-fr": "Toujours autoriser",
		"es-es": "Permitir siempre",
		"de-de": "Immer erlauben",
		"ja-jp": "あらゆる許可",
		"zh-tw": "永遠允許",
		"zh-cn": "以后都准许",
		"pl-pl": "Zawsze zezwalaj"
	},
	"ALWAYS_HIDE_CONTEXT": {
		"en-us": "Always Hide",
		"tr-tr": "Herzaman gizle",
		"it-it": "Nascondi sempre",
		"fr-fr": "Toujours masquer",
		"es-es": "Ocultar siempre",
		"de-de": "Immer verstecken",
		"ja-jp": "あらゆる隠す",
		"zh-tw": "永遠隱藏",
		"zh-cn": "以后都隐藏",
		"pl-pl": "Zawsze ukrywaj"
	},
	"LOAD_ALL_CONTEXT": {
		"en-us": "Load All Plug-ins",
		"tr-tr": "Bütün plug-inleri yükle",
		"it-it": "Carica tutti i plugin",
		"fr-fr": "Débloquer tous les plugins",
		"es-es": "Cargar todos los complementos",
		"de-de": "Alle Plug-Ins laden",
		"ja-jp": "プラグインをすべて読み込む",
		"zh-tw": "載入所有外掛模組",
		"zh-cn": "加载所有插件",
		"pl-pl": "Wczytaj wszystkie wtyczki"
	},
	"LOAD_INVISIBLE_CONTEXT": {
		"en-us": "Load Invisible Plug-ins",
		"tr-tr": "Bütün görünmez plug-inleri göster",
		"it-it": "Carica i plugin invisibili",
		"fr-fr": "Débloquer les plugins invisibles",
		"es-es": "Cargar los complementos invisibles",
		"de-de": "Unsichtbare Plug-Ins laden",
		"ja-jp": "不可視プラグインを読み込む",
		"zh-tw": "載入所有不可見的外掛模組",
		"zh-cn": "加载所有不可見的插件",
		"pl-pl": "Wczytaj niewidoczne wtyczki"
	},
	"HIDE_ALL_CONTEXT": { // UNUSED
		"en-us": "Hide All Plug-ins",
		"tr-tr": "Bütün plug-inleri gizle",
		"it-it": "Nascondi tutti i plugin",
		"fr-fr": "Masquer tous les plugins",
		"es-es": "Ocultar todos los complementos",
		"de-de": "Alle Plug-Ins verstecken",
		"ja-jp": "プラグインをすべて隠す",
		"zh-tw": "隱藏所有外掛模組",
		"zh-cn": "隐藏所有插件",
		"pl-pl": "Ukryj wszystkie wtyczki"
	},
	"DOWNLOAD_CONTEXT": {
		"en-us": "Download Video",
		"tr-tr": "Videoyu indir",
		"it-it": "Scarica il video",
		"fr-fr": "Télécharger la vidéo",
		"es-es": "Descargar el vídeo",
		"de-de": "Video herunterladen",
		"ja-jp": "ビデオを保存",
		"zh-tw": "下載影片",
		"zh-cn": "下载视频",
		"pl-pl": "Pobierz wideo"
	},
	"VIEW_ON_SITE_CONTEXT": {
		"en-us": "View on Site",
		"tr-tr": "Sayfada göster",
		"it-it": "Visualizza sul sito",
		"fr-fr": "Voir la vidéo sur le site",
		"es-es": "Ver en la página web",
		"de-de": "Auf Seite wiedergeben",
		"ja-jp": "サイトで開く",
		"zh-tw": "於網站上檢視",
		"zh-cn": "在网站上查看",
		"pl-pl": "Wyświetl na stronie"
	},
	"OPEN_IN_QTP_CONTEXT": {
		"en-us": "Open in QuickTime Player",
		"tr-tr": "QuickTime Player’da aç",
		"it-it": "Apri in QuickTime Player",
		"fr-fr": "Ouvrir dans QuickTime Player",
		"es-es": "Abrir en QuickTime Player",
		"de-de": "Im QuickTime-Player öffnen",
		"ja-jp": "QuickTime プレーヤーで開く",
		"zh-tw": "於 QuickTime Player 檢視",
		"zh-cn": "在 QuickTime Player 查看",
		"pl-pl": "Odtwórz w QuickTime Player"
	},
	"SEND_VIA_AIRPLAY_CONTEXT": {
		"en-us": "Send via AirPlay",
		"tr-tr": "AirPlay ile gönder",
		"it-it": "Invia tramite AirPlay",
		"fr-fr": "Envoyer par AirPlay",
		"es-es": "Enviar vía AirPlay",
		"de-de": "An AirPlay-Gerät senden",
		"ja-jp": "AirPlay を経由で出力",
		"zh-tw": "經由 AirPlay 輸出",
		"zh-cn": "通过 AirPlay 输出",
		"pl-pl": "Prześlij przez AirPlay"
	},
	
	// Keyboard shortcuts tab
	"CLEAR_BUTTON": {
		"en-us": "Clear",
		"tr-tr": "Temizle",
		"it-it": "Cancella",
		"fr-fr": "Effacer",
		"es-es": "Limpiar",
		"de-de": "Leeren",
		"ja-jp": "クリア",
		"zh-tw": "清除",
		"zh-cn": "清除",
		"pl-pl": "Wyczyść"
	},
	"SETTINGS_SHORTCUT": {
		"en-us": "Open preferences:",
		"tr-tr": "Ayarları aç:",
		"it-it": "Apri le preferenze:",
		"fr-fr": "Ouvrir les préférences :",
		"es-es": "Mostrar las preferencias:",
		"de-de": "Einstellungen öffnen",
		"ja-jp": "設定を開く：",
		"zh-tw": "開啟偏好設定面板：",
		"zh-cn": "开启设定面板:",
		"pl-pl": "Otwórz ustawienia:"
	},
	"WHITELIST_SHORTCUT": {
		"en-us": "Allow plug-ins on domain:",
		"tr-tr": "Bu alandaki plug-inlere izin ver:",
		"it-it": "Permetti plugin su dominio:",
		"fr-fr": "Autoriser les plugins sur ce domaine :",
		"es-es": "Permitir los complementos en el dominio:",
		"de-de": "Plug-Ins auf dieser Domäne erlauben:",
		"ja-jp": "このドメインならプラグイン自動的に読み込む：",
		"zh-tw": "載入包含這個域名的外掛模組：",
		"zh-cn": "加载包含这个域名的插件:",
		"pl-pl": "Zezwól na wtyczki w domenie:"
	},
	"LOAD_ALL_SHORTCUT": {
		"en-us": "Load all plug-ins in frontmost tab:",
		"tr-tr": "Bütün plug-inleri en öndeki sekmede yükle:",
		"it-it": "Carica tutti i plugin nella scheda in primo piano:",
		"fr-fr": "Débloquer tous les plugins :",
		"es-es": "Cargar todos los complementos en la pestaña actual:",
		"de-de": "Alle Plug-Ins im vordersten Tab laden:",
		"ja-jp": "一番手前のタブでのプラグインをすべて読み込む：",
		"zh-tw": "載入所有最前方標籤頁中的外掛模組：",
		"zh-cn": "加载最前方标签中的所有插件:",
		"pl-pl": "Wczytaj wszystkie wtyczki na karcie:"
	},
	"HIDE_ALL_SHORTCUT": {
		"en-us": "Hide all plug-ins in frontmost tab:",
		"tr-tr": "Bütün plug-inleri en öndeki sekmede gizle:",
		"it-it": "Nascondi tutti i plugin nella scheda in primo piano:",
		"fr-fr": "Masquer tous les plugins :",
		"es-es": "Ocultar todos los complementos en la pestaña actual:",
		"de-de": "Alle Plug-Ins im vordersten Tab verstecken:",
		"ja-jp": "一番手前のタブでのプラグインをすべて隠す：",
		"zh-tw": "隱藏所有最前方標籤頁中的外掛模組：",
		"zh-cn": "隐藏最前方标签中的所有插件:",
		"pl-pl": "Ukryj wszystkie wtyczki na karcie:"
	},
	"HIDE_PLUGIN_SHORTCUT": {
		"en-us": "Hide targeted plug-in:",
		"tr-tr": "Seçilmiş plug-ini gizle:",
		"it-it": "Nascondi plugin selezionato:",
		"fr-fr": "Masquer le plugin ciblé :",
		"es-es": "Ocultar el complemento seleccionado:",
		"de-de": "Plug-In verstecken:",
		"ja-jp": "指定されたプラグインを隠す：",
		"zh-tw": "隱藏指定外掛模組：",
		"zh-cn": "隐藏指定的插件:",
		"pl-pl": "Ukryj wskazaną wtyczkę:"
	},
	"PLAY_PAUSE_SHORTCUT": {
		"en-us": "Play/pause:",
		"tr-tr": "Oynat/durdur",
		"it-it": "Riproduci/Pausa:",
		"fr-fr": "Lecture/pause :",
		"es-es": "Reproducir/Pausar:",
		"de-de": "Wiedergabe/Pause:",
		"ja-jp": "再生／一時停止：",
		"zh-tw": "播放/暫停：",
		"zh-cn": "播放/暂停:",
		"pl-pl": "Odtwórz/wstrzymaj:"
	},
	"TOGGLE_FULLSCREEN_SHORTCUT": {
		"en-us": "Enter fullscreen:",
		"tr-tr": "Tamekran yap:",
		"it-it": "Attiva modalità a tutto schermo:",
		"fr-fr": "Mode plein écran :",
		"es-es": "Ver en pantalla completa:",
		"de-de": "Vollbild:",
		"ja-jp": "フルスクリーンにする：",
		"zh-tw": "全螢幕：",
		"zh-cn": "全屏幕:",
		"pl-pl": "Tryb pełnoekranowy:"
	},
	"VOLUME_UP_SHORTCUT": {
		"en-us": "Volume up:",
		"tr-tr": "Sesi aç",
		"it-it": "Aumenta il volume:",
		"fr-fr": "Augmenter le volume :",
		"es-es": "Subir el volumen:",
		"de-de": "Lautstärke erhöhen:",
		"ja-jp": "音量を上げる：",
		"zh-tw": "調高音量：",
		"zh-cn": "上升音量:",
		"pl-pl": "Zwiększ głośność:"
	},
	"VOLUME_DOWN_SHORTCUT": {
		"en-us": "Volume down:",
		"tr-tr": "Sesi kıs:",
		"it-it": "Abbassa il volume:",
		"fr-fr": "Diminuer le volume :",
		"es-es": "Bajar el volumen:",
		"de-de": "Lautstärke senken:",
		"ja-jp": "音量を下げる：",
		"zh-tw": "調低音量：",
		"zh-cn": "下降音量:",
		"pl-pl": "Zmniejsz głośność:"
	},
	"TOGGLE_LOOPING_SHORTCUT": {
		"en-us": "Toggle repeat:",
		"tr-tr": "Tekrarı değiştir:",
		"it-it": "Attiva/disattiva ripetizione:",
		"fr-fr": "Activer/désactiver la répétition :",
		"es-es": "Activar/Desactivar la repetición:",
		"de-de": "Wiederholen umschalten:",
		"ja-jp": "繰り返す：",
		"zh-tw": "重播：",
		"zh-cn": "重播:",
		"pl-pl": "Przełącz powtarzanie:"
	},
	"PREV_TRACK_SHORTCUT": {
		"en-us": "Previous track:",
		"tr-tr": "Önceki iz:",
		"it-it": "Traccia precedente:",
		"fr-fr": "Piste précédente :",
		"es-es": "Pista anterior:",
		"de-de": "Vorheriger Spur:",
		"ja-jp": "前のトラック：",
		"zh-tw": "上一個音軌：",
		"zh-cn": "上一个曲目:",
		"pl-pl": "Poprzednia ścieżka:"
	},
	"NEXT_TRACK_SHORTCUT": {
		"en-us": "Next track:",
		"tr-tr": "Sonraki iz:",
		"it-it": "Traccia successiva:",
		"fr-fr": "Piste suivante :",
		"es-es": "Pista siguiente:",
		"de-de": "Nächster Spur:",
		"ja-jp": "次のトラック：",
		"zh-tw": "下一個音軌：",
		"zh-cn": "下一个曲目:",
		"pl-pl": "Następna ścieżka:"
	},
	"TRACK_SELECTOR_SHORTCUT": {
		"en-us": "Show/hide track selector:",
		"tr-tr": "İz seçimini göster/gizle:",
		"it-it": "Mostra/nascondi selettore della traccia:",
		"fr-fr": "Afficher/masquer le selecteur de pistes :",
		"es-es": "Mostrar/Ocultar el selector de pistas:",
		"de-de": "Spurauswahl ein-/ausblenden:",
		"ja-jp": "トラックセレクタの表示／非表示：",
		"zh-tw": "顯示/隱藏曲目選擇器：",
		"zh-cn": "显示/隐藏曲目选择器:",
		"pl-pl": "Pokaż/ukryj wybór ścieżek:"
	}
};

var GLOBAL_STRINGS = {
	// Context menu items
	"PREFERENCES": {
		"en-us": "ClickToPlugin Preferences…",
		"tr-tr": "ClickToPlugin Ayarları...",
		"it-it": "Preferenze di ClickToPlugin…",
		"fr-fr": "Préférences ClickToPlugin…",
		"es-es": "Preferencias de ClickToPlugin…",
		"de-de": "ClickToPlugin-Einstellungen …",
		"ja-jp": "ClickToPlugin 設定...",
		"zh-tw": "ClickToPlugin 偏好設定⋯",
		"zh-cn": "ClickToPlugin 設定…",
		"pl-pl": "Ustawienia ClickToPlugin"
	},
	"SWITCH_ON": {
		"en-us": "Enable ClickToPlugin",
		"tr-tr": "ClickToPlugin’i aç",
		"it-it": "Abilita ClickToPlugin",
		"fr-fr": "Activer ClickToPlugin",
		"es-es": "Activar ClickToPlugin",
		"de-de": "ClickToPlugin aktivieren",
		"ja-jp": "ClickToPlugin を有効",
		"zh-tw": "啟用 ClickToPlugin",
		"zh-cn": "启用 ClickToPlugin",
		"pl-pl": "Aktywuj ClickToPlugin"
	},
	"SWITCH_OFF": {
		"en-us": "Disable ClickToPlugin",
		"tr-tr": "ClickToPlugin’i kapat",
		"it-it": "Disabilita ClickToPlugin",
		"fr-fr": "Désactiver ClickToPlugin",
		"es-es": "Desactivar ClickToPlugin",
		"de-de": "ClickToPlugin deaktivieren",
		"ja-jp": "ClickToPlugin を無効",
		"zh-tw": "停用 ClickToPlugin",
		"zh-cn": "停用 ClickToPlugin",
		"pl-pl": "Dezaktywuj ClickToPlugin"
	},
	"LOAD_ALL_PLUGINS": {
		"en-us": "Load All Plug-ins",
		"tr-tr": "Bütün plug-inleri yükle",
		"it-it": "Carica tutti i plugin",
		"fr-fr": "Débloquer tous les plugins",
		"es-es": "Cargar todos los complementos",
		"de-de": "Alle Plug-Ins laden",
		"ja-jp": "プラグインを全部読み込む",
		"zh-tw": "載入所有外掛模組",
		"zh-cn": "加载所有插件",
		"pl-pl": "Wczytaj wszystkie wtyczki"
	},
	"LOAD_INVISIBLE_PLUGINS": {
		"en-us": "Load Invisible Plug-ins",
		"tr-tr": "Bütün gizli plug-inleri yükle",
		"it-it": "Carica i plugin invisibili",
		"fr-fr": "Débloquer les plugins invisibles",
		"es-es": "Cargar los complementos invisibles",
		"de-de": "Unsichtbare Plug-Ins laden",
		"ja-jp": "不可視のプラグインを全部読み込む",
		"zh-tw": "載入所有不可見的外掛模組",
		"zh-cn": "加载所有不可見的插件",
		"pl-pl": "Wczytaj niewidoczne wtyczki"
	},
	"HIDE_ALL_PLUGINS": { // UNUSED
		"en-us": "Hide All Plug-ins",
		"tr-tr": "Bütün plug-inleri gizle",
		"it-it": "Nascondi tutti i plugin",
		"fr-fr": "Masquer tous les plugins",
		"es-es": "Ocultar todos los complementos",
		"de-de": "Alle Plug-Ins verstecken",
		"ja-jp": "プラグインを全部隠す",
		"zh-tw": "隱藏所有外掛模組",
		"zh-cn": "隐藏所有插件",
		"pl-pl": "Ukryj wszystkie wtyczki"
	},
	"ALWAYS_ALLOW_ON_DOMAIN": {
		"en-us": "Allow Plug-ins on Domain",
		"tr-tr": "Bu alandaki plug-inlere izin ver",
		"it-it": "Permetti plugin su dominio",
		"fr-fr": "Autoriser les plugins sur ce domaine",
		"es-es": "Permitir los complementos en del dominio",
		"de-de": "Plug-Ins auf dieser Domäne erlauben",
		"ja-jp": "このドメインならプラグイン読み込むを有効",
		"zh-tw": "載入包含這個域名的外掛模組",
		"zh-cn": "加载包含这个域名的插件",
		"pl-pl": "Zezwól na wtyczki w domenie"
	},
	"ALWAYS_BLOCK_ON_DOMAIN": {
		"en-us": "Block Plug-ins on Domain",
		"tr-tr": "Bu alandaki plug-inleri engelle",
		"it-it": "Blocca plugin su dominio",
		"fr-fr": "Bloquer les plugins sur ce domaine",
		"es-es": "Bloquear los complementos en del dominio",
		"de-de": "Plug-Ins auf dieser Domäne blockieren",
		"ja-jp": "このドメインならプラグイン読み込むを抑止",
		"zh-tw": "阻擋包含這個域名的外掛模組",
		"zh-cn": "屏蔽这个域名的插件",
		"pl-pl": "Zablokuj wtyczki w domenie"
	},
	"ALWAYS_ALLOW_SOURCE": {
		"en-us": "Always Allow",
		"tr-tr": "Hep izin ver",
		"it-it": "Consenti sempre",
		"fr-fr": "Toujours autoriser",
		"es-es": "Permitir siempre",
		"de-de": "Immer erlauben",
		"ja-jp": "あらゆる許可",
		"zh-tw": "永遠允許",
		"zh-cn": "以后都准许",
		"pl-pl": "Zawsze zezwalaj"
	},
	"ALWAYS_HIDE_ON_DOMAIN": {
		"en-us": "Hide Plug-ins on Domain",
		"tr-tr": "Bu alandaki plug-inleri gizle",
		"it-it": "Nascondi plugin su dominio",
		"fr-fr": "Masquer les plugins sur ce domaine",
		"es-es": "Ocultar los complementos en del dominio",
		"de-de": "Plug-Ins auf dieser Domäne verstecken",
		"ja-jp": "このドメインならプラグインを隠す",
		"zh-tw": "隱藏包含這個域名的外掛模組",
		"zh-cn": "隐藏包含这个域名的插件",
		"pl-pl": "Ukryj wtyczki w domenie"
	},
	"ALWAYS_SHOW_ON_DOMAIN": {
		"en-us": "Show Plug-ins on Domain",
		"tr-tr": "Bu alandaki plug-inleri göster",
		"it-it": "Mostra plugin su dominio",
		"fr-fr": "Afficher les plugins sur ce domaine",
		"es-es": "Mostrar los complementos en del dominio",
		"de-de": "Plug-Ins auf dieser Domäne anzeigen",
		"ja-jp": "このドメインならプラグインを表示",
		"zh-tw": "顯示包含這個域名的外掛模組",
		"zh-cn": "显示包含这个域名的插件",
		"pl-pl": "Pokaż wtyczki w domenie"
	},
	"ALWAYS_HIDE_SOURCE": {
		"en-us": "Always Hide",
		"tr-tr": "Hep gizle",
		"it-it": "Nascondi sempre",
		"fr-fr": "Toujours masquer",
		"es-es": "Ocultar siempre",
		"de-de": "Immer verstecken",
		"ja-jp": "あらゆる隠す",
		"zh-tw": "永遠隱藏",
		"zh-cn": "以后都隐藏",
		"pl-pl": "Zawsze ukrywaj"
	},
	"DOWNLOAD_VIDEO": {
		"en-us": "Download Video",
		"tr-tr": "Videoyu indir",
		"it-it": "Scarica il video",
		"fr-fr": "Télécharger la vidéo",
		"es-es": "Descargar el vídeo",
		"de-de": "Video herunterladen",
		"ja-jp": "ビデオを保存",
		"zh-tw": "下載影片",
		"zh-cn": "下载视频",
		"pl-pl": "Pobierz wideo"
	},
	"DOWNLOAD_AUDIO": {
		"en-us": "Download Audio",
		"tr-tr": "Sesi indir",
		"it-it": "Scarica l'audio",
		"fr-fr": "Télécharger l’audio",
		"es-es": "Descargar el audio",
		"de-de": "Audio herunterladen",
		"ja-jp": "オーディオを保存",
		"zh-tw": "下載音頻",
		"zh-cn": "下载音频",
		"pl-pl": "Pobierz audio"
	},
	"OPEN_IN_QUICKTIME_PLAYER": {
		"en-us": "Open in QuickTime Player",
		"tr-tr": "QuickTime Player’da aç",
		"it-it": "Apri in QuickTime Player",
		"fr-fr": "Ouvrir dans QuickTime Player",
		"es-es": "Abrir en QuickTime Player",
		"de-de": "Im QuickTime-Player öffnen",
		"ja-jp": "QuickTime プレーヤーで開く",
		"zh-tw": "於 QuickTime Player 檢視",
		"zh-cn": "在 QuickTime Player 查看",
		"pl-pl": "Odtwórz w QuickTime Player"
	},
	"SEND_VIA_AIRPLAY": {
		"en-us": "Send via AirPlay",
		"tr-tr": "AirPlay ile gönder",
		"it-it": "Invia tramite AirPlay",
		"fr-fr": "Envoyer par AirPlay",
		"es-es": "Enviar vía AirPlay",
		"de-de": "An AirPlay-Gerät senden",
		"ja-jp": "AirPlay を経由で出力",
		"zh-tw": "經由 AirPlay 輸出",
		"zh-cn": "通过 AirPlay 输出",
		"pl-pl": "Prześlij przez AirPlay"
	},
	"GET_PLUGIN_INFO": {
		"en-us": "Get Plug-in Info",
		"tr-tr": "Plug-in bilgilerini al",
		"it-it": "Ottieni informazioni plugin",
		"fr-fr": "Lire les informations",
		"es-es": "Mostrar la información del complemento",
		"de-de": "Plug-In-Informationen",
		"ja-jp": "情報を見る",
		"zh-tw": "簡介",
		"zh-cn": "简介",
		"pl-pl": "Informacje o wtyczce"
	},
	"LOAD_PLUGIN": {
		"en-us": function(plugin) {return plugin ? "Load " + plugin : "Load Plug-in";},
		"tr-tr": function(plugin) {return plugin ? plugin + "’ı yükle" : "Plug-ini yükle";},
		"it-it": function(plugin) {return plugin ? "Carica " + plugin : "Carica plugin";},
		"fr-fr": function(plugin) {return plugin ? "Charger " + plugin : "Charger le plugin";},
		"es-es": function(plugin) {return plugin ? "Cargar " + plugin : "Cargar el complemento";},
		"de-de": function(plugin) {return plugin ? plugin + " laden" : "Plug-In laden";},
		"ja-jp": function(plugin) {return plugin ? plugin + " を読み込む" : "プラグインを読み込む";},
		"zh-tw": function(plugin) {return plugin ? "載入 " + plugin : "載入外掛模組";},
		"zh-cn": function(plugin) {return plugin ? "加载 " + plugin : "加载插件";},
		"pl-pl": function(plugin) {return plugin ? "Wczytaj " + plugin : "Wczytaj wtyczkę";}
	},
	"HIDE_PLUGIN": {
		"en-us": function(plugin) {return plugin ? "Hide " + plugin : "Hide Plug-in";},
		"tr-tr": function(plugin) {return plugin ? plugin + "’ı gizle" : "Plug-ini gizle";},
		"it-it": function(plugin) {return plugin ? "Nascondi " + plugin : "Nascondi plugin";},
		"fr-fr": function(plugin) {return plugin ? "Masquer " + plugin : "Masquer le plugin";},
		"es-es": function(plugin) {return plugin ? "Ocultar " + plugin : "Ocultar el complemento";},
		"de-de": function(plugin) {return plugin ? plugin + " verstecken" : "Plug-In verstecken";},
		"ja-jp": function(plugin) {return plugin ? plugin + " を隠す" : "プラグインを隠す";},
		"zh-tw": function(plugin) {return plugin ? "隱藏 " + plugin : "隱藏外掛模組";},
		"zh-cn": function(plugin) {return plugin ? "隐藏 " + plugin : "隐藏插件";},
		"pl-pl": function(plugin) {return plugin ? "Ukryj " + plugin : "Ukryj wtyczkę";}
		
	},
	"RESTORE_PLUGIN": {
		"en-us": function(plugin) {return plugin ? "Restore " + plugin : "Restore Plug-in";},
		"tr-tr": function(plugin) {return plugin ? plugin + "’ı onar" : "Plug-ini onar";},
		"it-it": function(plugin) {return plugin ? "Ripristina " + plugin : "Ripristina plugin";},
		"fr-fr": function(plugin) {return plugin ? "Restaurer " + plugin : "Restaurer le plugin";},
		"es-es": function(plugin) {return plugin ? "Restablecer " + plugin : "Restablecer el complemento";},
		"de-de": function(plugin) {return plugin ? plugin + " wiederherstellen" : "Plug-In wiederherstellen";},
		"ja-jp": function(plugin) {return plugin ? plugin + " に戻す" : "プラグインに戻す";},
		"zh-tw": function(plugin) {return plugin ? "復原 " + plugin : "復原外掛模組";},
		"zh-cn": function(plugin) {return plugin ? "还原 " + plugin : "还原插件";},
		"pl-pl": function(plugin) {return plugin ? "Przywróć " + plugin : "Przywróć wtyczkę";}
	},
	"VIEW_ON_SITE": {
		"en-us": function(site) {return "View on " + site;},
		"tr-tr": function(site) {return site + "’da göster";},
		"it-it": function(site) {return "Visualizza su " + site;},
		"fr-fr": function(site) {return "Voir la vidéo sur " + site;},
		"es-es": function(site) {return "Ver en " + site;},
		"de-de": function(site) {return "Auf " + site + " wiedergeben";},
		"ja-jp": function(site) {return site + " で開く";},
		"zh-tw": function(site) {return "於 " + site + " 檢視";},
		"zh-cn": function(site) {return "在 " + site + " 查看";},
		"pl-pl": function(site) {return "Wyświetl na stronie " + site;}
	},
	
	// Dialogs
	"QT_CONFIRM_LAUNCH_DIALOG": {
		"en-us": function(url) {return "A QuickTime object would like to play\n\n" + url + "\n\nin QuickTime Player. Do you want to allow it?";},
		"tr-tr": function(url) {return "Bir QuickTime nesnesi\n\n" + url + "\n\n’ı QuickTime Player’da açmak ıstiyor. Onaylamak istiyor musunuz?";},
		"it-it": function(url) {return "Un oggetto QuickTime desidera riprodurre\n\n" + url + "\n\nin QuickTime Player. Vuoi consentirlo?";},
		"fr-fr": function(url) {return "Un objet QuickTime voudrait lancer le lecture de\n\n" + url + "\n\ndans QuickTime Player. Voulez-vous l’autoriser?";},
		"es-es": function(url) {return "Un objeto QuickTime quiere reproducirse\n\n" + url + "\n\nen QuickTime Player. Quieres permitirlo?";},
		"de-de": function(url) {return "Ein QuickTime-Objekt möchte\n\n" + url + "\n\nim QuickTime-Player öffnen. Möchten Sie es erlauben?";},
		"ja-jp": function(url) {return "ある QuickTime コンテンツは\n\n" + url + "\n\nを QuickTime Player に再生しようとしていますが、これを許可しますか？";},
		"zh-tw": function(url) {return "QuickTime 控制項正試圖於 QuickTime Player 播放\n\n" + url + "\n\n是否允許此項操作？";},
		"zh-cn": function(url) {return "QuickTime 控制项正尝试在 QuickTime Player 播放\n\n" + url + "\n\n是否允许此项操作？";},
		"pl-pl": function(url) {return "Obiekt QuickTime chce odtworzyć\n\n" + url + "\n\nw QuickTime Player. Czy chcesz na to zezwolić?";}
	}
};

var INJECTED_STRINGS = {
	"MISSING_PLUGIN": {
		"en-us": "Missing Plug-in",
		"tr-tr": "Eksik Yazılım Eki",
		"it-it": "Plugin mancante",
		"fr-fr": "Module manquant",
		"es-es": "Módulo no encontrado",
		"de-de": "Fehlendes Plug-In",
		"ja-jp": "プラグインが見つかりません",
		"zh-tw": "找不到外掛模組",
		"zh-cn": "缺少插件",
		"pl-pl": "Brakująca wtyczka"
	},
	"LOADING": {
		"en-us": "Loading...",
		"tr-tr": "Yükleniyor...",
		"it-it": "Carico...",
		"fr-fr": "Chargement…",
		"es-es": "Cargando...",
		"de-de": "Laden …",
		"ja-jp": "読み込み中...",
		"zh-tw": "載入中⋯",
		"zh-cn": "正在载入…",
		"pl-pl": "Wczytywanie…"
	},
	"QT_PLAYER": {
		"en-us": "QT Player",
		"tr-tr": "QT Player",
		"it-it": "QT Player",
		"fr-fr": "QT Player",
		"es-es": "QT Player",
		"de-de": "QT-Player",
		"ja-jp": "QT プレーヤー",
		"zh-tw": "QT Player",
		"zh-cn": "QT Player",
		"pl-pl": "QT Player"
	}
};

function localize(strings, language) {
	if(language === undefined) language = navigator.language;
	for(var string in strings) {
		var lang = language;
		while(strings[string][lang] === undefined) lang = fallback(lang);
		window[string] = strings[string][lang];
	}
}

function localizeAsScript(strings, language) {
	if(language === undefined) language = navigator.language;
	var script = "";
	for(var string in strings) {
		var lang = language;
		while(strings[string][lang] === undefined) lang = fallback(lang);
		script += "var " + string + "=";
		if(typeof strings[string][lang] === "function") script += strings[string][lang].toString();
		else script += JSON.stringify(strings[string][lang]);
		script += ";";
	}
	return script;
}

function fallback(lang) {
	switch(lang) {
	case "en-gb": return "en-us";
	case "en-ca":
	case "en-au": return "en-gb";
	case "fr-ca":
	case "fr-ch": return "fr-fr";
	case "es-xl": return "es-es";
	case "de-at":
	case "de-ch": return "de-de";
	case "it-ch": return "it-it";
	default: return "en-us";
	}
}
