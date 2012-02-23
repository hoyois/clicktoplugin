"use strict";
// ClickToFlash localization file
// Save with encoding: UTF-8

var PREFERENCES_STRINGS = {
	"PREFERENCES_LAYOUT": {
		"en-us": ["nav{padding-right:1px;}", "#general li > span:first-child{max-width:160px;}"],
		"tr-tr": [],
		"fr-fr": ["#media_player li > span:first-child{max-width:220px;}"],
		"es-es": ["nav{padding-right:1px;}", "#media_player li > span.textarea_label > label{width:200px;}"],
		"de-de": ["#general li > span:first-child{max-width:170px;}", "#media_player li > span.textarea_label > label{width:180px;}"],
		"ja-jp": ["nav{padding-right:1px;}", "#general li > span:first-child{max-width:250px;}"],
		"zh-tw": [],
		"zh-cn": ["nav{padding-right:1px;}"]
	},
	"PREFERENCES_TITLE": {
		"en-us": "ClickToFlash Preferences",
		"tr-tr": "ClickToFlash Ayarları",
		"fr-fr": "Préférences ClickToFlash",
		"es-es": "Preferencias de ClickToFlash",
		"de-de": "ClickToFlash-Einstellungen",
		"ja-jp": "ClickToFlash 設定",
		"zh-tw": "ClickToFlash 偏好設定",
		"zh-cn": "ClickToFlash 設定"
	},
	
	// Tabs
	"GENERAL_TAB": {
		"en-us": "General",
		"tr-tr": "Genel",
		"fr-fr": "Général",
		"es-es": "General",
		"de-de": "Allgemein",
		"ja-jp": "一般",
		"zh-tw": "一般",
		"zh-cn": "通用"
	},
	"CONTROL_LISTS_TAB": {
		"en-us": "Control lists",
		"tr-tr": "Kontrol listeleri",
		"fr-fr": "Listes de contrôle",
		"es-es": "Listas de control",
		"de-de": "Filterregeln",
		"ja-jp": "制御リスト",
		"zh-tw": "控制表",
		"zh-cn": "控制表"
	},
	"MEDIA_TAB": {
		"en-us": "Media player",
		"tr-tr": "Ortam oynatıcısı",
		"fr-fr": "Lecteur multimédia",
		"es-es": "Reproductor multimedia",
		"de-de": "Media-Player",
		"ja-jp": "プレーヤー",
		"zh-tw": "影片播放器",
		"zh-cn": "视频播放器"
	},
	"CONTEXT_MENU_TAB": {
		"en-us": "Shortcut menu",
		"tr-tr": "Kısayol menüsü",
		"fr-fr": "Menu contextuel",
		"es-es": "Menú contextual",
		"de-de": "Kontextmenü",
		"ja-jp": "コンテキストメニュー",
		"zh-tw": "快顯功能表",
		"zh-cn": "快显菜单"
	},
	"SHORTCUTS_TAB": {
		"en-us": "Keyboard shortcuts",
		"tr-tr": "Klavye kısayolları",
		"fr-fr": "Raccourcis clavier",
		"es-es": "Accesos por teclado",
		"de-de": "Keyboard-Shortcuts",
		"ja-jp": "ショートカット",
		"zh-tw": "鍵盤快速鍵",
		"zh-cn": "快捷键"
	},
	
	// General tab
	"PLACEHOLDER_OPACITY": {
		"en-us": "Placeholder opacity:",
		"tr-tr": "Yer tutucu saydamlığı",
		"fr-fr": "Transparence des boîtes de remplacement :",
		"es-es": "Opacidad:",
		"de-de": "Platzhalter-Transparenz",
		"ja-jp": "プレイスホールダーの不透明度",
		"zh-tw": "佔位符不透明度",
		"zh-cn": "占位符不透明度"
	},
	"SHOW_TOOLTIP": {
		"en-us": "Show Flash source as tooltip",
		"tr-tr": "Plug-in kaynağını tiyo olarak göster",
		"fr-fr": "Afficher la source du Flash en infobulle",
		"es-es": "Mostrar la procedencia del objeto Flash como mensaje de ayuda contextual",
		"de-de": "Flash-Quelle im Tooltip anzeigen",
		"ja-jp": "ツールチップとして Flash コンテンツのソースを表示する",
		"zh-tw": "以快顯視窗顯示 Flash 外掛模組來源",
		"zh-cn": "在工具提示控件显示 Flash 插件来源"
	},
	"ALLOW_INVISIBLE_PLUGINS": {
		"en-us": "Allow invisible Flash",
		"tr-tr": "Görünmez Flash’e izin ver",
		"fr-fr": "Autoriser le Flash invisible",
		"es-es": "Permitir el contenido Flash invisible",
		"de-de": "Unsichtbare Flash-Objekte erlauben",
		"ja-jp": "不可視 Flash コンテンツを有効にする",
		"zh-tw": "載入不可見的 Flash 外掛模組",
		"zh-cn": "加载不可見的 Flash 插件"
	},
	"DEBUG_MODE": {
		"en-us": "Block Flash manually",
		"tr-tr": "Flash’i el ile engelle",
		"fr-fr": "Bloquer Flash manuellement",
		"es-es": "Bloquear el contenido Flash manualmente",
		"de-de": "Flash manuell blockieren",
		"ja-jp": "手動的に Flash コンテンツ を抑止する",
		"zh-tw": "手動阻擋 Flash 外掛模組",
		"zh-cn": "手动屏蔽 Flash 插件"
	},
	"SIFR_POLICY": {
		"en-us": "sIFR text policy:",
		"tr-tr": "sIFR metin politikası",
		"fr-fr": "Texte sIFR :",
		"es-es": "Texto sIFR:",
		"de-de": "sIFR-Richtlinie:",
		"ja-jp": "sIFR テキスト設定：",
		"zh-tw": "sIFR 文字設定：",
		"zh-cn": "sIFR 文字:"
	},
	"SIFR_TEXT_ONLY": {
		"en-us": "Show text only",
		"tr-tr": "Sadece metin olarak göster",
		"fr-fr": "N’afficher que le texte",
		"es-es": "Únicamente mostrar el texto",
		"de-de": "Nur Text anzeigen",
		"ja-jp": "テキストのみを表示",
		"zh-tw": "只顯示文字",
		"zh-cn": "只显示文本"
	},
	"SIFR_NORMAL": {
		"en-us": "Treat as regular Flash",
		"tr-tr": "Olağan flash olarak muamele et",
		"fr-fr": "Considérer comme Flash",
		"es-es": "Tratar como un complemento Flash",
		"de-de": "Als normales Flash behandeln",
		"ja-jp": "Flash として扱う",
		"zh-tw": "當作一般 Flash",
		"zh-cn": "当作一般 Flash"
	},
	"SIFR_AUTOLOAD": {
		"en-us": "Load automatically",
		"tr-tr": "Otomatik yükle",
		"fr-fr": "Autoriser",
		"es-es": "Cargar automáticamente",
		"de-de": "Automatisch laden",
		"ja-jp": "自動的に読み込む",
		"zh-tw": "自動載入",
		"zh-cn": "自动加载"
	},
	"KILLER_SCRIPTS": {
		"en-us": "Flash to HTML5 conversion scripts:",
		"tr-tr": "Flash’i HTML5’e çevirme komutları:",
		"fr-fr": "Scripts de conversion en HTML5 :",
		"es-es": "Scripts para conversiones en HTML5:",
		"de-de": "Scripte zum umwandeln von Flash zu HTML5:",
		"ja-jp": "これらのスクリプトを使用してHTML5の置き換えを実行する：",
		"zh-tw": "使用這些腳本進行HTML5取代：",
		"zh-cn": "使用这些脚本进行HTML5替代:"
	},
	"DEFAULT_KILLERS_BUTTON": {
		"en-us": "Use default",
		"tr-tr": "Varsayılana dön",
		"fr-fr": "Défaut",
		"es-es": "Predeterminado",
		"de-de": "Zurücksetzen",
		"ja-jp": "デフォルトに戻す",
		"zh-tw": "使用預設值",
		"zh-cn": "还原默认值"
	},
	"LOAD_PLUGIN_IF_NOT_KILLED": {
		"en-us": "Load Flash if HTML5 conversion fails",
		"tr-tr": "Flash’i, eğer HTML5 çevrimi başarısız olursa yükle",
		"fr-fr": "Charger Flash si la conversion en HTML5 échoue",
		"es-es": "Cargar Flash si la conversión a HTML5 falla",
		"de-de": "Lade Flash wenn HTML5-Umwandlung fehlschlägt",
		"ja-jp": "HTML5の置き換えに問題が発生する場合は Flash に戻す",
		"zh-tw": "當外掛模組不能被轉換成 HTML5 時重新載入 Flash 外掛模組",
		"zh-cn": "当HTML5替代失败时重新加载 Flash 插件"
	},
	"USE_FALLBACK_MEDIA": {
		"en-us": "Use HTML5 media fallbacks",
		"tr-tr": "HTML5 medya yedeklerini kullan",
		"fr-fr": "Utiliser les replis HTML5",
		"es-es": "Utilizar “fallbacks” en HTML5",
		"de-de": "HTML5-Media-Fallbacks benutzen",
		"ja-jp": "HTML5 のフォールバックセクションを有効にする",
		"zh-tw": "使用 HTML5 的後備（Fallback）機制",
		"zh-cn": "使用 HTML5 的应变（Fallback）计划"
	},
	"DOWNLOADING": {
		"en-us": "Downloading:",
		"tr-tr": "İndiriyor:",
		"fr-fr": "Téléchargements :",
		"es-es": "Descargas:",
		"de-de": "Download:",
		"ja-jp": "ダウンロード：",
		"zh-tw": "下載：",
		"zh-cn": "下载:"
	},
	"USE_DOWNLOAD_MANAGER": {
		"en-us": "Use a download manager",
		"tr-tr": "İndirme yöneticisi kullan",
		"fr-fr": "Utiliser un gestionnaire de téléchargement",
		"es-es": "Utilizar un gestor de descargas",
		"de-de": "Downloadmanager benutzen",
		"ja-jp": "ダウンロードマネージャーを使う",
		"zh-tw": "啟用下載管理程式",
		"zh-cn": "启用下载管理工具"
	},
	"AIRPLAY_HOSTNAME": {
		"en-us": "AirPlay device hostname:",
		"tr-tr": "AirPlay aygıt ismi:",
		"fr-fr": "Périphérique AirPlay :",
		"es-es": "Nombre del dispositivo AirPlay:",
		"de-de": "AirPlay-Geräte-Hostname:",
		"ja-jp": "AirPlay ホスト名：",
		"zh-tw": "AirPlay 主機名稱：",
		"zh-cn": "AirPlay 主机名称:"
	},
	"AIRPLAY_PASSWORD": {
		"en-us": "AirPlay password:",
		"tr-tr": "AirPlay parolası:",
		"fr-fr": "Mot de passe AirPlay :",
		"es-es": "Contraseña para AirPlay:",
		"de-de": "AirPlay-Passwort:",
		"ja-jp": "AirPlay パスワード：",
		"zh-tw": "AirPlay 密碼：",
		"zh-cn": "AirPlay 密码:"
	},
	
	// Control lists tab
	"ALLOW_LOCATIONS": {
		"en-us": "Allow Flash on these sites:",
		"tr-tr": "Bu sayfalardaki Flash’lere izin ver:",
		"fr-fr": "Autoriser le Flash sur ces sites :",
		"es-es": "Permitir el contenido Flash en estos sitios:",
		"de-de": "Flash auf folgenden Seiten erlauben:",
		"ja-jp": "これらのサイトなら Flash コンテンツの読込みを許可：",
		"zh-tw": "永遠載入包含這些網址的 Flash 外掛模組：",
		"zh-cn": "永远加载这些地址的 Flash 插件:"
	},
	"ALLOW_SOURCES": {
		"en-us": "Allow Flash from these sources:",
		"tr-tr": "Bu kaynaklardaki Flash’lere izin ver:",
		"fr-fr": "Autoriser le Flash provenant de :",
		"es-es": "Permitir el contenido Flash en los archivos:",
		"de-de": "Flash von folgenden Quellen erlauben:",
		"ja-jp": "これらのソースなら Flash コンテンツの読込みを許可：",
		"zh-tw": "永遠載入包含這些來源的 Flash 外掛模組：",
		"zh-cn": "永远加载这些来源的 Flash 插件:"
	},
	"BLOCK_LOCATIONS": {
		"en-us": "Block Flash on these sites:",
		"tr-tr": "Bu sayfalardaki Flash’leri engelle:",
		"fr-fr": "Bloquer le Flash sur ces sites :",
		"es-es": "Bloquear el contenido Flash en estos sitios:",
		"de-de": "Flash auf folgenden Seiten blockieren:",
		"ja-jp": "これらのサイトなら Flash コンテンツ 読み込むことを抑止：",
		"zh-tw": "阻擋包含這些網址的 Flash 外掛模組：",
		"zh-cn": "永远屏蔽这些地址的 Flash 插件:"
	},
	"BLOCK_SOURCES": {
		"en-us": "Block Flash from these sources:",
		"tr-tr": "Bu kaynaklardaki Flash’leri engelle:",
		"fr-fr": "Bloquer le Flash provenant de :",
		"es-es": "Bloquear el contenido Flash en los archivos:",
		"de-de": "Flash von folgenden Quellen blockieren:",
		"ja-jp": "これらのソースなら Flash コンテンツ 読み込むことを抑止：",
		"zh-tw": "阻擋這些來源的 Flash 外掛模組：",
		"zh-cn": "永远屏蔽这些来源的 Flash 插件:"
	},
	"INVERT_WHITELISTS": {
		"en-us": "Invert lists",
		"tr-tr": "Listeleri çevir",
		"fr-fr": "Inverser",
		"es-es": "Invertir las listas",
		"de-de": "Listen invertieren",
		"ja-jp": "逆にする",
		"zh-tw": "逆向操作",
		"zh-cn": "反转清单"
	},
	"HIDE_LOCATIONS": {
		"en-us": "Hide Flash on these sites:",
		"tr-tr": "Bu sayfalardaki Flash’leri gizle:",
		"fr-fr": "Masquer le Flash sur ces sites :",
		"es-es": "Ocultar el contenido Flash en estos sitios:",
		"de-de": "Flash auf folgenden Seiten verstecken:",
		"ja-jp": "これらのサイトなら Flash コンテンツを隠す：",
		"zh-tw": "隱藏包含這些網址的 Flash 外掛模組：",
		"zh-cn": "隐藏这些地址的 Flash 插件:"
	},
	"HIDE_SOURCES": {
		"en-us": "Hide Flash from these sources:",
		"tr-tr": "Bu kaynaklardaki Flash’leri gizle:",
		"fr-fr": "Masquer le Flash provenant de :",
		"es-es": "Ocultar el contenido Flash en los archivos:",
		"de-de": "Flash von folgenden Quellen verstecken:",
		"ja-jp": "これらのソースなら Flash コンテンツを隠す：",
		"zh-tw": "隱藏這些來源的 Flash 外掛模組：",
		"zh-cn": "隐藏这些来源的 Flash 插件:"
	},
	"SHOW_LOCATIONS": {
		"en-us": "Show Flash on these sites:",
		"tr-tr": "Bu sayfalardaki Flash’leri göster:",
		"fr-fr": "Afficher le Flash sur ces sites :",
		"es-es": "Mostrar el contenido Flash en estos sitios:",
		"de-de": "Flash auf folgenden Seiten anzeigen:",
		"ja-jp": "これらのサイトなら Flash コンテンツを表示する：",
		"zh-tw": "顯示包含這些網址的 Flash 外掛模組：",
		"zh-cn": "显示这些地址的 Flash 插件:"
	},
	"SHOW_SOURCES": {
		"en-us": "Show Flash from these sources:",
		"tr-tr": "Bu kaynaklardaki Flash’leri göster:",
		"fr-fr": "Afficher le Flash provenant de :",
		"es-es": "Mostrar el contenido Flash en los archivos:",
		"de-de": "Flash von folgenden Quellen anzeigen:",
		"ja-jp": "これらのソースなら Flash コンテンツを表示する：",
		"zh-tw": "顯示這些來源的 Flash 外掛模組：",
		"zh-cn": "永远显示这些来源的 Flash 插件:"
	},
	"INVERT_BLACKLISTS": {
		"en-us": "Invert lists",
		"tr-tr": "Listeleri çevir",
		"fr-fr": "Inverser",
		"es-es": "Invertir las listas",
		"de-de": "Listen invertieren",
		"ja-jp": "逆にする",
		"zh-tw": "逆向操作",
		"zh-cn": "反转清单"
	},
	
	// Media player tab
	"DEFAULT_PLAYER": {
		"en-us": "Default media player:",
		"tr-tr": "Varsayılan ortam oynatıcı:",
		"fr-fr": "Lecteur par défaut :",
		"es-es": "Reproductor multimedia por defecto:",
		"de-de": "Standard Media-Player:",
		"ja-jp": "デフォルトプレーヤー：",
		"zh-tw": "預設播放器：",
		"zh-cn": "默认播放器:"
	},
	// "HTML5_PLAYER": {} // "HTML5"
	"PLUGIN_PLAYER": {
		"en-us": "Flash",
		"tr-tr": "Flash",
		"fr-fr": "Flash",
		"es-es": "Flash",
		"de-de": "Flash",
		"ja-jp": "Flash コンテンツ",
		"zh-tw": "Flash 外掛模組",
		"zh-cn": "Flash 插件"
	},
	"QUICKTIME_PLAYER": {
		"en-us": "QuickTime Player",
		"tr-tr": "QuickTime Player",
		"fr-fr": "QuickTime Player",
		"es-es": "QuickTime Player",
		"de-de": "QuickTime-Player",
		"ja-jp": "QuickTime プレーヤー",
		"zh-tw": "QuickTime Player",
		"zh-cn": "QuickTime Player"
	},
	// "AIRPLAY_PLAYER": {} // "AirPlay"
	"AUTOLOAD_MEDIA_PLAYER": {
		"en-us": "Load media player automatically",
		"tr-tr": "Ortam oynatıcısını otomatik yükle",
		"fr-fr": "Charger le lecteur automatiquement",
		"es-es": "Cargar el reproductor automáticamente",
		"de-de": "Media-Player automatisch laden",
		"ja-jp": "プレーヤーを自動的に読み込む",
		"zh-tw": "自動載入播放器",
		"zh-cn": "自动加载播放器"
	},
	"AUTOPLAY_LOCATIONS": {
		"en-us": "Autoplay on these sites:",
		"tr-tr": "Bu sayfalarda otomatik oynat:",
		"fr-fr": "Lancer la lecture automatiquement sur ces sites :",
		"es-es": "Reproducir automáticamente en estos sitios:",
		"de-de": "Automatische Wiedergabe auf folgenden Seiten:",
		"ja-jp": "これらのサイトならプレーヤーを自動的に起動する：",
		"zh-tw": "在這些網址自動播放：",
		"zh-cn": "在这些地址启用自动播放:"
	},
	"INITIAL_BEHAVIOR": {
		"en-us": "Initial behavior:",
		"tr-tr": "İlk davranış:",
		"en-gb": "Initial behaviour:",
		"fr-fr": "Action initiale :",
		"es-es": "Acción inicial:",
		"de-de": "Standardverhalten:",
		"ja-jp": "初期挙動：",
		"zh-tw": "初始動作：",
		"zh-cn": "初始動作:"
	},
	"INITIAL_NO_BUFFER": {
		"en-us": "Do not preload",
		"tr-tr": "Ön yükleme yapma",
		"fr-fr": "Aucune",
		"es-es": "No precargar",
		"de-de": "Nicht puffern",
		"ja-jp": "何もしません",
		"zh-tw": "不緩衝",
		"zh-cn": "不缓冲"
	},
	"INITIAL_BUFFER": {
		"en-us": "Preload",
		"tr-tr": "Önyükleme",
		"fr-fr": "Préchargement",
		"es-es": "Emprezar la precarga",
		"de-de": "Puffern",
		"ja-jp": "バッファリングを始めます",
		"zh-tw": "只開始緩衝",
		"zh-cn": "开始缓冲"
	},
	"INITIAL_AUTOPLAY": {
		"en-us": "Autoplay",
		"tr-tr": "Otomatik oynat",
		"fr-fr": "Lecture automatique",
		"es-es": "Reproducir automáticamente",
		"de-de": "Automatisch wiedergeben",
		"ja-jp": "バッファリングを始めると共に再生します",
		"zh-tw": "開始緩衝並且自動播放",
		"zh-cn": "开始缓冲并且自动播放"
	},
	"INSTANT_AUTOPLAY": {
		"en-us": "Instant autoplay",
		"tr-tr": "Anında oynat",
		"fr-fr": "Lecture instantanée",
		"es-es": "Reproducción sin esperas",
		"de-de": "Sofortige Wiedergabe",
		"ja-jp": "直接に再生",
		"zh-tw": "即時播放",
		"zh-cn": "立即播放"
	},
	"DEFAULT_RESOLUTION": {
		"en-us": "Default resolution:",
		"tr-tr": "Varsayılan çözünürlük:",
		"fr-fr": "Résolution par défaut :",
		"es-es": "Resolución por defecto:",
		"de-de": "Standardauflösung:",
		"ja-jp": "デフォルト解像度：",
		"zh-tw": "預設解像度：",
		"zh-cn": "默认解像度:"
	},
	"NONNATIVE_FORMATS_POLICY": {
		"en-us": "Nonnative formats policy:",
		"tr-tr": "Yerel olmayan biçimler için kurallar:",
		"fr-fr": "Formats non natifs :",
		"es-es": "Formatos no nativos:",
		"de-de": "Regel für proprietäre Formate:",
		"ja-jp": "非ネイティブなコーデック：",
		"zh-tw": "非原生解碼器：",
		"zh-cn": "非原生解码器:"
	},
	"NONNATIVE_IGNORE": {
		"en-us": "Never use as default",
		"tr-tr": "Asla varsayılan olarak kullanma",
		"fr-fr": "Ne jamais utiliser comme défaut",
		"es-es": "Nunca usar por defecto",
		"de-de": "Niemals als Standard verwenden",
		"ja-jp": "使用せず",
		"zh-tw": "不使用",
		"zh-cn": "不使用"
	},
	"NONNATIVE_LAST_RESORT": {
		"en-us": "Use only as a last resort",
		"tr-tr": "Son çare olarak kullan",
		"fr-fr": "N’utiliser qu’en dernier recours",
		"es-es": "Usar como última opción",
		"de-de": "Nur als letzten Versuch verwenden",
		"ja-jp": "候補にする",
		"zh-tw": "作為最後選擇",
		"zh-cn": "作为最后选择"
	},
	"NONNATIVE_USE_FREELY": {
		"en-us": "Use freely",
		"tr-tr": "Serbestçe kullan",
		"fr-fr": "Utiliser sans restrictions",
		"es-es": "Usar libremente",
		"de-de": "Frei verwenden",
		"ja-jp": "自由に使う",
		"zh-tw": "任意使用",
		"zh-cn": "自由使用"
	},
	"SOURCE_SELECTOR": {
		"en-us": "Source selector:",
		"tr-tr": "Kaynak seçimi:",
		"fr-fr": "Sélecteur de médias :",
		"es-es": "Selector de fuentes:",
		"de-de": "Quellenauswahl:",
		"ja-jp": "ソースセレクタ：",
		"zh-tw": "來源選取器：",
		"zh-cn": "来源选择器:"
	},
	"SHOW_MEDIA_SOURCES": {
		"en-us": "Include media sources",
		"tr-tr": "Ortam kaynaklarını göster",
		"fr-fr": "Inclure les formats disponibles",
		"es-es": "Incluir fuentes multimedia",
		"de-de": "Medienquellen anzeigen",
		"ja-jp": "メディアのソースを含む",
		"zh-tw": "包括媒體來源",
		"zh-cn": "包含媒体的来源"
	},
	"SHOW_PLUGIN_SOURCE": {
		"en-us": "Include Flash",
		"tr-tr": "Flash’i göster",
		"fr-fr": "Inclure Flash",
		"es-es": "Incluir Flash",
		"de-de": "Flash anzeigen",
		"ja-jp": "Flash コンテンツを含む",
		"zh-tw": "包括 Flash 外掛模組",
		"zh-cn": "包含 Flash 插件"
	},
	"SHOW_QTP_SOURCE": {
		"en-us": "Include QuickTime Player",
		"tr-tr": "QuickTime Player’ı göster",
		"fr-fr": "Inclure QuickTime Player",
		"es-es": "Incluir QuickTime Player",
		"de-de": "QuickTime-Player anzeigen",
		"ja-jp": "QuickTime プレーヤーを含む",
		"zh-tw": "包括 QuickTime Player",
		"zh-cn": "包含 QuickTime Player"
	},
	"SHOW_AIRPLAY_SOURCE": {
		"en-us": "Include AirPlay",
		"tr-tr": "AirPlay'i göster",
		"fr-fr": "Inclure AirPlay",
		"es-es": "Incluir AirPlay",
		"de-de": "AirPlay anzeigen",
		"ja-jp": "AirPlay を含む",
		"zh-tw": "包括 AirPlay",
		"zh-cn": "包含 AirPlay"
	},
	"SHOW_SITE_SOURCE": {
		"en-us": "Include the video’s web page",
		"tr-tr": "Videonun sayfasını göster",
		"fr-fr": "Inclure la page web de la vidéo",
		"es-es": "Incluir la página web del video",
		"de-de": "Video-Seite anzeigen",
		"ja-jp": "ビデオの参照元URLを含む",
		"zh-tw": "包括影片的來源頁",
		"zh-cn": "包含视频原先的页面"
	},
	"SHOW_POSTER": {
		"en-us": "Show preview image",
		"tr-tr": "Önizleme resmini göster",
		"fr-fr": "Afficher un aperçu de la vidéo",
		"es-es": "Mostrar la imagen de previsualización",
		"de-de": "Vorschau anzeigen",
		"ja-jp": "プレビューを有効にする",
		"zh-tw": "啟用預覽",
		"zh-cn": "显示缩图"
	},
	"HIDE_REWIND_BUTTON": {
		"en-us": "Hide “Rewind” button",
		"tr-tr": "“Sarma” tuşunu gizle",
		"fr-fr": "Supprimer le bouton « Rembobiner »",
		"es-es": "Ocultar el botón Rebobinar",
		"de-de": "„Zurückspul“-Knopf ausblenden",
		"ja-jp": "「巻き戻し」ボタンを隠す",
		"zh-tw": "隱藏「迴轉」按鈕",
		"zh-cn": "隐藏「倒带」按钮"
	},
	"SOUND_VOLUME": {
		"en-us": "Sound volume:",
		"tr-tr": "Ses seviyesi:",
		"fr-fr": "Volume sonore :",
		"es-es": "Volumen del sonido:",
		"de-de": "Lautstärke:",
		"ja-jp": "音量：",
		"zh-tw": "音量：",
		"zh-cn": "音量:"
	},
	
	// Shortcut menu tab
	"SHOW_IN_CONTEXT_MENU": {
		"en-us": "Show these commands in the shortcut menu:",
		"tr-tr": "Bu komutları kısayol menüsünde göster:",
		"fr-fr": "Afficher ces options dans le menu contextuel :",
		"es-es": "Mostrar estas opciones en el menú contextual:",
		"de-de": "Folgende Befehle im Kontextmenü anzeigen:",
		"ja-jp": "これらのコマンドをコンテキストメニューで表示：",
		"zh-tw": "在快顯功能表顯示這些指令：",
		"zh-cn": "在快显菜单显示这些命令:"
	},
	"SETTINGS_CONTEXT": {
		"en-us": "ClickToFlash Preferences",
		"tr-tr": "ClickToFlash ayarları",
		"fr-fr": "Préférences ClickToFlash",
		"es-es": "Preferencias de ClickToFlash",
		"de-de": "ClickToFlash-Einstellungen",
		"ja-jp": "ClickToFlash 設定",
		"zh-tw": "ClickToFlash 偏好設定",
		"zh-cn": "ClickToFlash 設定"
	},
	"DISABLE_ENABLE_CONTEXT": {
		"en-us": "Disable/Enable ClickToFlash",
		"tr-tr": "ClickToFlash’i aç/kapa",
		"fr-fr": "Désactiver/Activer ClickToFlash",
		"es-es": "Desactivar/Activar ClickToFlash",
		"de-de": "ClickToFlash deaktivieren/aktivieren",
		"ja-jp": "ClickToFlash を有効／無効にする",
		"zh-tw": "啟用或停用 ClickToFlash",
		"zh-cn": "启用/停用 ClickToFlash"
	},
	"ALWAYS_ALLOW_CONTEXT": {
		"en-us": "Always Allow",
		"tr-tr": "Herzaman izin ver",
		"fr-fr": "Toujours autoriser",
		"es-es": "Permitir siempre",
		"de-de": "Immer erlauben",
		"ja-jp": "あらゆる許可",
		"zh-tw": "永遠允許",
		"zh-cn": "以后都准许"
	},
	"ALWAYS_HIDE_CONTEXT": {
		"en-us": "Always Hide",
		"tr-tr": "Herzaman gizle",
		"fr-fr": "Toujours masquer",
		"es-es": "Ocultar siempre",
		"de-de": "Immer verstecken",
		"ja-jp": "あらゆる隠す",
		"zh-tw": "永遠隱藏",
		"zh-cn": "以后都隐藏"
	},
	"LOAD_ALL_CONTEXT": {
		"en-us": "Load All Flash",
		"tr-tr": "Bütün Flash’leri yükle",
		"fr-fr": "Débloquer tout le Flash",
		"es-es": "Cargar todo el contenido Flash",
		"de-de": "Alle Flash-Objekte laden",
		"ja-jp": "Flash コンテンツをすべて読み込む",
		"zh-tw": "載入所有 Flash 外掛模組",
		"zh-cn": "加载所有 Flash 插件"
	},
	"LOAD_INVISIBLE_CONTEXT": {
		"en-us": "Load Invisible Flash",
		"tr-tr": "Bütün görünmez Flash’leri göster",
		"fr-fr": "Débloquer le Flash invisible",
		"es-es": "Cargar el contenido Flash invisible",
		"de-de": "Unsichtbare Flash-Objekte laden",
		"ja-jp": "不可視 Flash コンテンツを読み込む",
		"zh-tw": "載入所有不可見的 Flash 外掛模組",
		"zh-cn": "加载所有不可見的 Flash 插件"
	},
	"HIDE_ALL_CONTEXT": { // UNUSED
		"en-us": "Hide All Flash",
		"tr-tr": "Bütün Flash’leri gizle",
		"fr-fr": "Masquer tout le Flash",
		"es-es": "Ocultar todo el contenido Flash",
		"de-de": "Alle Flash-Objekte verstecken",
		"ja-jp": "Flash コンテンツをすべて隠す",
		"zh-tw": "隱藏所有 Flash 外掛模組",
		"zh-cn": "隐藏所有 Flash 插件"
	},
	"DOWNLOAD_CONTEXT": {
		"en-us": "Download Video",
		"tr-tr": "Videoyu indir",
		"fr-fr": "Télécharger la vidéo",
		"es-es": "Descargar el vídeo",
		"de-de": "Video herunterladen",
		"ja-jp": "ビデオを保存",
		"zh-tw": "下載影片",
		"zh-cn": "下载视频"
	},
	"VIEW_ON_SITE_CONTEXT": {
		"en-us": "View on Site",
		"tr-tr": "Sayfada göster",
		"fr-fr": "Voir la vidéo sur le site",
		"es-es": "Ver en la página web",
		"de-de": "Auf Seite wiedergeben",
		"ja-jp": "サイトで開く",
		"zh-tw": "於網站上檢視",
		"zh-cn": "在网站上查看"
	},
	"OPEN_IN_QTP_CONTEXT": {
		"en-us": "Open in QuickTime Player",
		"tr-tr": "QuickTime Player’da aç",
		"fr-fr": "Ouvrir dans QuickTime Player",
		"es-es": "Abrir en QuickTime Player",
		"de-de": "Im QuickTime-Player öffnen",
		"ja-jp": "QuickTime プレーヤーで開く",
		"zh-tw": "於 QuickTime Player 檢視",
		"zh-cn": "在 QuickTime Player 查看"
	},
	"SEND_VIA_AIRPLAY_CONTEXT": {
		"en-us": "Send via AirPlay",
		"tr-tr": "AirPlay ile gönder",
		"fr-fr": "Envoyer par AirPlay",
		"es-es": "Enviar vía AirPlay",
		"de-de": "An AirPlay-Gerät senden",
		"ja-jp": "AirPlay を経由で出力",
		"zh-tw": "經由 AirPlay 輸出",
		"zh-cn": "通过 AirPlay 输出"
	},
	
	// Keyboard shortcuts tab
	"CLEAR_BUTTON": {
		"en-us": "Clear",
		"tr-tr": "Temizle",
		"fr-fr": "Effacer",
		"es-es": "Limpiar",
		"de-de": "Leeren",
		"ja-jp": "クリア",
		"zh-tw": "清除",
		"zh-cn": "清除"
	},
	"SETTINGS_SHORTCUT": {
		"en-us": "Open preferences:",
		"tr-tr": "Ayarları aç:",
		"fr-fr": "Ouvrir les préférences :",
		"es-es": "Mostrar las preferencias:",
		"de-de": "Einstellungen öffnen",
		"ja-jp": "設定を開く：",
		"zh-tw": "開啟偏好設定面板：",
		"zh-cn": "开启设定面板:"
	},
	"WHITELIST_SHORTCUT": {
		"en-us": "Allow Flash on domain:",
		"tr-tr": "Bu alandaki Flash’lere izin ver:",
		"fr-fr": "Autoriser le Flash sur ce domaine :",
		"es-es": "Permitir el contenido Flash en el dominio:",
		"de-de": "Flash auf dieser Domäne erlauben:",
		"ja-jp": "このドメインなら Flash コンテンツ自動的に読み込む：",
		"zh-tw": "載入包含這個域名的 Flash 外掛模組：",
		"zh-cn": "加载包含这个域名的 Flash 插件:"
	},
	"LOAD_ALL_SHORTCUT": {
		"en-us": "Load all Flash in frontmost tab:",
		"tr-tr": "En öndeki sekmede bütün Flash’leri yükle:",
		"fr-fr": "Débloquer tout le Flash :",
		"es-es": "Cargar todo el contenido Flash en la pestaña actual:",
		"de-de": "Alle Flash-Objekte im vordersten Tab laden:",
		"ja-jp": "一番手前のタブでの Flash コンテンツをすべて読み込む：",
		"zh-tw": "載入所有最前方標籤頁中的 Flash 外掛模組：",
		"zh-cn": "加载最前方标签中的所有 Flash 插件:"
	},
	"HIDE_ALL_SHORTCUT": {
		"en-us": "Hide all Flash in frontmost tab:",
		"tr-tr": "En öndeki sekmede bütün Flash’leri gizle:",
		"fr-fr": "Masquer tout le Flash :",
		"es-es": "Ocultar todo el contenido Flash en la pestaña actual:",
		"de-de": "Alle Flash-Objekte im vordersten Tab verstecken:",
		"ja-jp": "一番手前のタブでの Flash コンテンツをすべて隠す：",
		"zh-tw": "隱藏所有最前方標籤頁中的 Flash 外掛模組：",
		"zh-cn": "隐藏最前方标签中的所有 Flash 插件:"
	},
	"HIDE_PLUGIN_SHORTCUT": {
		"en-us": "Hide targeted Flash object:",
		"tr-tr": "Seçilmiş Flash’i gizle:",
		"fr-fr": "Masquer l’élément Flash ciblé :",
		"es-es": "Ocultar el objeto Flash seleccionado:",
		"de-de": "Flash-Objekt verstecken:",
		"ja-jp": "指定された Flash コンテンツを隠す：",
		"zh-tw": "隱藏指定 Flash 外掛模組：",
		"zh-cn": "隐藏指定的 Flash 插件:"
	},
	"PLAY_PAUSE_SHORTCUT": {
		"en-us": "Play/pause:",
		"tr-tr": "Oynat/durdur:",
		"fr-fr": "Lecture/pause :",
		"es-es": "Reproducir/Pausar:",
		"de-de": "Wiedergabe/Pause:",
		"ja-jp": "再生／一時停止：",
		"zh-tw": "播放/暫停：",
		"zh-cn": "播放/暂停:"
	},
	"TOGGLE_FULLSCREEN_SHORTCUT": {
		"en-us": "Enter fullscreen:",
		"tr-tr": "Tam ekran yap:",
		"fr-fr": "Mode plein écran :",
		"es-es": "Ver en pantalla completa:",
		"de-de": "Vollbild:",
		"ja-jp": "フルスクリーンにする：",
		"zh-tw": "全螢幕：",
		"zh-cn": "全屏幕:"
	},
	"VOLUME_UP_SHORTCUT": {
		"en-us": "Volume up:",
		"tr-tr": "Sesi aç:",
		"fr-fr": "Augmenter le volume :",
		"es-es": "Subir el volumen:",
		"de-de": "Lautstärke erhöhen:",
		"ja-jp": "音量を上げる：",
		"zh-tw": "調高音量：",
		"zh-cn": "上升音量:"
	},
	"VOLUME_DOWN_SHORTCUT": {
		"en-us": "Volume down:",
		"tr-tr": "Sesi kıs:",
		"fr-fr": "Diminuer le volume :",
		"es-es": "Bajar el volumen:",
		"de-de": "Lautstärke senken:",
		"ja-jp": "音量を下げる：",
		"zh-tw": "調低音量：",
		"zh-cn": "下降音量:"
	},
	"TOGGLE_LOOPING_SHORTCUT": {
		"en-us": "Toggle repeat:",
		"tr-tr": "Tekrarı değiştir:",
		"fr-fr": "Activer/désactiver la répétition :",
		"es-es": "Activar/Desactivar la repetición:",
		"de-de": "Wiederholen umschalten:",
		"ja-jp": "繰り返す：",
		"zh-tw": "重播：",
		"zh-cn": "重播:"
	},
	"PREV_TRACK_SHORTCUT": {
		"en-us": "Previous track:",
		"tr-tr": "Önceki iz:",
		"fr-fr": "Piste précédente :",
		"es-es": "Pista anterior:",
		"de-de": "Vorheriger Spur:",
		"ja-jp": "前のトラック：",
		"zh-tw": "上一個音軌：",
		"zh-cn": "上一个曲目:"
	},
	"NEXT_TRACK_SHORTCUT": {
		"en-us": "Next track:",
		"tr-tr": "Sonraki iz:",
		"fr-fr": "Piste suivante :",
		"es-es": "Pista siguiente:",
		"de-de": "Nächster Spur:",
		"ja-jp": "次のトラック：",
		"zh-tw": "下一個音軌：",
		"zh-cn": "下一个曲目:"
	},
	"TRACK_SELECTOR_SHORTCUT": {
		"en-us": "Show/hide track selector:",
		"tr-tr": "İz seçimini göster/gizle:",
		"fr-fr": "Afficher/masquer le selecteur de pistes :",
		"es-es": "Mostrar/Ocultar el selector de pistas:",
		"de-de": "Spurauswahl ein-/ausblenden:",
		"ja-jp": "トラックセレクタの表示／非表示：",
		"zh-tw": "顯示/隱藏曲目選擇器：",
		"zh-cn": "显示/隐藏曲目选择器:"
	}
};

var GLOBAL_STRINGS = {
	// Context menu items
	"PREFERENCES": {
		"en-us": "ClickToFlash Preferences…",
		"tr-tr": "ClickToFlash ayarları...",
		"fr-fr": "Préférences ClickToFlash…",
		"es-es": "Preferencias de ClickToFlash…",
		"de-de": "ClickToFlash-Einstellungen …",
		"ja-jp": "ClickToFlash 設定...",
		"zh-tw": "ClickToFlash 偏好設定⋯",
		"zh-cn": "ClickToFlash 設定…"
	},
	"SWITCH_ON": {
		"en-us": "Enable ClickToFlash",
		"tr-tr": "ClickToFlash’i aç",
		"fr-fr": "Activer ClickToFlash",
		"es-es": "Activar ClickToFlash",
		"de-de": "ClickToFlash aktivieren",
		"ja-jp": "ClickToFlash を有効",
		"zh-tw": "啟用 ClickToFlash",
		"zh-cn": "启用 ClickToFlash"
	},
	"SWITCH_OFF": {
		"en-us": "Disable ClickToFlash",
		"tr-tr": "ClickToFlash’i kapat",
		"fr-fr": "Désactiver ClickToFlash",
		"es-es": "Desactivar ClickToFlash",
		"de-de": "ClickToFlash deaktivieren",
		"ja-jp": "ClickToFlash を無効",
		"zh-tw": "停用 ClickToFlash",
		"zh-cn": "停用 ClickToFlash"
	},
	"LOAD_ALL_PLUGINS": {
		"en-us": "Load All Flash",
		"tr-tr": "Bütün Flash’leri yükle",
		"fr-fr": "Débloquer Flash sur cette page",
		"es-es": "Cargar todo el contenido Flash",
		"de-de": "Alle Flash-Objekte laden",
		"ja-jp": "Flash コンテンツを全部読み込む",
		"zh-tw": "載入所有 Flash 外掛模組",
		"zh-cn": "加载所有 Flash 插件"
	},
	"LOAD_INVISIBLE_PLUGINS": {
		"en-us": "Load Invisible Flash",
		"tr-tr": "Bütün gizli Flash’leri yükle",
		"fr-fr": "Débloquer le Flash invisible",
		"es-es": "Cargar el contenido Flash invisible",
		"de-de": "Unsichtbare Flash-Objekte laden",
		"ja-jp": "不可視の Flash コンテンツを全部読み込む",
		"zh-tw": "載入所有不可見的 Flash 外掛模組",
		"zh-cn": "加载所有不可見的 Flash 插件"
	},
	"HIDE_ALL_PLUGINS": { // UNUSED
		"en-us": "Hide All Flash",
		"tr-tr": "Bütün Flash’leri gizle",
		"fr-fr": "Masquer Flash sur cette page",
		"es-es": "Ocultar todo el contenido Flash",
		"de-de": "Alle Flash-Objekte verstecken",
		"ja-jp": "Flash コンテンツを全部隠す",
		"zh-tw": "隱藏所有 Flash 外掛模組",
		"zh-cn": "隐藏所有 Flash 插件"
	},
	"ALWAYS_ALLOW_ON_DOMAIN": {
		"en-us": "Allow Flash on Domain",
		"tr-tr": "Bu alandaki Flash’lere izin ver",
		"fr-fr": "Autoriser Flash sur ce domaine",
		"es-es": "Permitir el contenido Flash en del dominio",
		"de-de": "Flash auf dieser Domäne erlauben",
		"ja-jp": "このドメインなら Flash コンテンツを有効",
		"zh-tw": "載入包含這個域名的 Flash 外掛模組",
		"zh-cn": "加载包含这个域名的 Flash 插件"
	},
	"ALWAYS_BLOCK_ON_DOMAIN": {
		"en-us": "Block Flash on Domain",
		"tr-tr": "Bu alandaki Flash’leri engelle",
		"fr-fr": "Bloquer Flash sur ce domaine",
		"es-es": "Bloquear el contenido Flash en del dominio",
		"de-de": "Flash auf dieser Domäne blockieren",
		"ja-jp": "このドメインなら Flash コンテンツ 読み込むを抑止",
		"zh-tw": "阻擋包含這個域名的 Flash 外掛模組",
		"zh-cn": "屏蔽这个域名的 Flash 插件"
	},
	"ALWAYS_ALLOW_SOURCE": {
		"en-us": "Always Allow",
		"tr-tr": "Hep izin ver",
		"fr-fr": "Toujours autoriser",
		"es-es": "Permitir siempre",
		"de-de": "Immer erlauben",
		"ja-jp": "あらゆる許可",
		"zh-tw": "永遠允許",
		"zh-cn": "以后都准许"
	},
	"ALWAYS_HIDE_ON_DOMAIN": {
		"en-us": "Hide Flash on Domain",
		"tr-tr": "Bu alandaki Flash’leri gizle",
		"fr-fr": "Masquer Flash sur ce domaine",
		"es-es": "Ocultar el contenido Flash en del dominio",
		"de-de": "Flash auf dieser Domäne verstecken",
		"ja-jp": "このドメインなら Flash コンテンツを隠す",
		"zh-tw": "隱藏包含這個域名的 Flash 外掛模組",
		"zh-cn": "隐藏包含这个些域名的 Flash 插件"
	},
	"ALWAYS_SHOW_ON_DOMAIN": {
		"en-us": "Show Flash on Domain",
		"tr-tr": "Bu alandaki Flash’leri göster",
		"fr-fr": "Afficher Flash sur ce domaine",
		"es-es": "Mostrar el contenido Flash en del dominio",
		"de-de": "Flash auf dieser Domäne anzeigen",
		"ja-jp": "このドメインなら Flash コンテンツを表示",
		"zh-tw": "顯示包含這個域名的 Flash 外掛模組",
		"zh-cn": "显示包含这个些域名的 Flash 插件"
	},
	"ALWAYS_HIDE_SOURCE": {
		"en-us": "Always Hide",
		"tr-tr": "Hep gizle",
		"fr-fr": "Toujours masquer",
		"es-es": "Ocultar siempre",
		"de-de": "Immer verstecken",
		"ja-jp": "あらゆる隠す",
		"zh-tw": "永遠隱藏",
		"zh-cn": "以后都隐藏"
	},
	"DOWNLOAD_VIDEO": {
		"en-us": "Download Video",
		"tr-tr": "Videoyu indir",
		"fr-fr": "Télécharger la vidéo",
		"es-es": "Descargar el vídeo",
		"de-de": "Video herunterladen",
		"ja-jp": "ビデオを保存",
		"zh-tw": "下載影片",
		"zh-cn": "下载视频"
	},
	"DOWNLOAD_AUDIO": {
		"en-us": "Download Audio",
		"tr-tr": "Sesi indir",
		"fr-fr": "Télécharger l’audio",
		"es-es": "Descargar el audio",
		"de-de": "Audio herunterladen",
		"ja-jp": "オーディオを保存",
		"zh-tw": "下載音頻",
		"zh-cn": "下载音频"
	},
	"OPEN_IN_QUICKTIME_PLAYER": {
		"en-us": "Open in QuickTime Player",
		"tr-tr": "QuickTime Player’da aç",
		"fr-fr": "Ouvrir dans QuickTime Player",
		"es-es": "Abrir en QuickTime Player",
		"de-de": "Im QuickTime-Player öffnen",
		"ja-jp": "QuickTime プレーヤーで開く",
		"zh-tw": "於 QuickTime Player 檢視",
		"zh-cn": "在 QuickTime Player 查看"
	},
	"SEND_VIA_AIRPLAY": {
		"en-us": "Send via AirPlay",
		"tr-tr": "AirPlay ile gönder",
		"fr-fr": "Envoyer par AirPlay",
		"es-es": "Enviar vía AirPlay",
		"de-de": "An AirPlay-Gerät senden",
		"ja-jp": "AirPlay を経由で出力",
		"zh-tw": "經由 AirPlay 輸出",
		"zh-cn": "通过 AirPlay 输出"
	},
	"GET_PLUGIN_INFO": {
		"en-us": "Get Plug-in Info",
		"tr-tr": "Plug-in bilgilerini al",
		"fr-fr": "Lire les informations",
		"es-es": "Mostrar la información del complemento",
		"de-de": "Plug-In-Informationen",
		"ja-jp": "情報を見る",
		"zh-tw": "簡介",
		"zh-cn": "简介"
	},
	"LOAD_PLUGIN": {
		"en-us": function(plugin) {return plugin ? "Load " + plugin : "Load Plug-in";},
		"tr-tr": function(plugin) {return plugin ? plugin + "’ı yükle" : "Plug-ini yükle";},
		"fr-fr": function(plugin) {return plugin ? "Charger " + plugin : "Charger le plugin";},
		"es-es": function(plugin) {return plugin ? "Cargar " + plugin : "Cargar el complemento";},
		"de-de": function(plugin) {return plugin ? plugin + " laden" : "Plug-In laden";},
		"ja-jp": function(plugin) {return plugin ? plugin + " を読み込む" : "プラグインを読み込む";},
		"zh-tw": function(plugin) {return plugin ? "載入 " + plugin : "載入外掛模組";},
		"zh-cn": function(plugin) {return plugin ? "加载 " + plugin : "加载插件";}
	},
	"HIDE_PLUGIN": {
		"en-us": function(plugin) {return plugin ? "Hide " + plugin : "Hide Plug-in";},
		"tr-tr": function(plugin) {return plugin ? plugin + "’ı gizle" : "Plug-ini gizle";},
		"fr-fr": function(plugin) {return plugin ? "Masquer " + plugin : "Masquer le plugin";},
		"es-es": function(plugin) {return plugin ? "Ocultar " + plugin : "Ocultar el complemento";},
		"de-de": function(plugin) {return plugin ? plugin + " verstecken" : "Plug-In verstecken";},
		"ja-jp": function(plugin) {return plugin ? plugin + " を隠す" : "プラグインを隠す";},
		"zh-tw": function(plugin) {return plugin ? "隱藏 " + plugin : "隱藏外掛模組";},
		"zh-cn": function(plugin) {return plugin ? "隐藏 " + plugin : "隐藏插件";}
	},
	"RESTORE_PLUGIN": {
		"en-us": function(plugin) {return plugin ? "Restore " + plugin : "Restore Plug-in";},
		"tr-tr": function(plugin) {return plugin ? plugin + "’ı onar" : "Plug-ini onar";},
		"fr-fr": function(plugin) {return plugin ? "Restaurer " + plugin : "";},
		"es-es": function(plugin) {return plugin ? "Restablecer " + plugin : "";},
		"de-de": function(plugin) {return plugin ? plugin + " wiederherstellen" : "Plug-In wiederherstellen";},
		"ja-jp": function(plugin) {return plugin ? plugin + " に戻す" : "プラグインに戻す";},
		"zh-tw": function(plugin) {return plugin ? "復原 " + plugin : "復原外掛模組";},
		"zh-cn": function(plugin) {return plugin ? "还原 " + plugin : "还原插件";}
	},
	"VIEW_ON_SITE": {
		"en-us": function(site) {return "View on " + site;},
		"tr-tr": function(site) {return site + "’da göster";},
		"fr-fr": function(site) {return "Voir la vidéo sur " + site;},
		"es-es": function(site) {return "Ver en " + site;},
		"de-de": function(site) {return "Auf " + site + " wiedergeben";},
		"ja-jp": function(site) {return site + " で開く";},
		"zh-tw": function(site) {return "於 " + site + " 檢視";},
		"zh-cn": function(site) {return "在 " + site + " 查看";}
	}
};

var INJECTED_STRINGS = {
	"LOADING": {
		"en-us": "Loading...",
		"tr-tr": "Yükleniyor...",
		"fr-fr": "Chargement…",
		"es-es": "Cargando...",
		"de-de": "Laden …",
		"ja-jp": "読み込み中...",
		"zh-tw": "載入中⋯",
		"zh-cn": "正在载入…"
	},
	"QT_PLAYER": {
		"en-us": "QT Player",
		"tr-tr": "QT Player",
		"fr-fr": "QT Player",
		"es-es": "QT Player",
		"de-de": "QT-Player",
		"ja-jp": "QT プレーヤー",
		"zh-tw": "QT Player",
		"zh-cn": "QT Player"
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
	default: return "en-us";
	}
}
