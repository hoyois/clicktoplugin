// ClickToFlash localization file
// Save with encoding: UTF-8

function localize(strings, language) {
	if(language === undefined) language = navigator.language;
	for(var string in strings) {
		var lang = language;
		do {
			window[string] = strings[string][lang];
			lang = fallback(lang);
		} while(window[string] === undefined);
	}
}

function fallback(lang) {
	switch(lang) {
		case "en-gb": return "en-us";
		case "en-ca":
		case "en-au": return "en-gb";
		case "fr-ca":
		case "fr-ch": return "fr-fr";
		case "es-xl": return "es-es";
		default: return "en-us";
	}
}

const PREFERENCES_STRINGS = {
	PREFERENCES_LAYOUT: {
		"en-us": [],
		"fr-fr": ["nav{padding-right:1px;}", "#media_player li > span:first-child{max-width:220px;}"],
		"es-es": ["#media_player li > span:first-child{max-width:240px;}", "#media_player .hfil{width:360px;}"],
		"ja-jp": ["#general li > span:first-child{max-width:250px;}"],
		"zh-tw": ["nav{padding-right:1px;}"],
		"zh-cn": []
	},
	PREFERENCES_TITLE: {
		"en-us": "ClickToFlash Preferences",
		"fr-fr": "Préférences ClickToFlash",
		"es-es": "Preferencias de ClickToFlash",
		"ja-jp": "ClickToFlash 設定",
		"zh-tw": "ClickToFlash 偏好設定",
		"zh-cn": "ClickToFlash 設定"
	},
	
	// Tabs
	GENERAL_TAB: {
		"en-us": "General",
		"fr-fr": "Général",
		"es-es": "General",
		"ja-jp": "一般",
		"zh-tw": "一般",
		"zh-cn": "通用"
	},
	WHITELISTS_TAB: {
		"en-us": "Control lists",
		"fr-fr": "Listes de contrôle",
		"es-es": "Listas de control",
		"ja-jp": "制御リスト",
		"zh-tw": "控制表",
		"zh-cn": "控制表"
	},
	MEDIA_TAB: {
		"en-us": "Media player",
		"fr-fr": "Lecteur multimédia",
		"es-es": "Reproductor multimedia",
		"ja-jp": "プレーヤー",
		"zh-tw": "影片播放器",
		"zh-cn": "视频播放器"
	},
	CONTEXT_MENU_TAB: {
		"en-us": "Shortcut menu",
		"fr-fr": "Menu contextuel",
		"es-es": "Menú contextual",
		"ja-jp": "コンテキストメニュー",
		"zh-tw": "快顯功能表",
		"zh-cn": "快显菜单"
	},
	SHORTCUTS_TAB: {
		"en-us": "Keyboard shortcuts",
		"fr-fr": "Raccourcis clavier",
		"es-es": "Accesos por teclado",
		"ja-jp": "ショートカット",
		"zh-tw": "鍵盤快速鍵",
		"zh-cn": "快捷键"
	},
	
	// General tab
	PLACEHOLDER_OPACITY: {
		"en-us": "Placeholder opacity:",
		"fr-fr": "Transparence des boîtes de remplacement :",
		"es-es": "Opacidad:",
		"ja-jp": "プレイスホールダーの不透明度",
		"zh-tw": "佔位符不透明度",
		"zh-cn": "占位符不透明度"
	},
	SHOW_TOOLTIP: {
		"en-us": "Show Flash source as tooltip",
		"fr-fr": "Afficher la source du Flash en infobulle",
		"es-es": "Mostrar la procedencia del objeto Flash como mensaje de ayuda contextual",
		"ja-jp": "ツールチップとして Flash コンテンツのソースを表示する",
		"zh-tw": "以快顯視窗顯示 Flash 外掛模組來源",
		"zh-cn": "在工具提示控件显示 Flash 插件来源"
	},
	ALLOW_INVISIBLE_PLUGINS: {
		"en-us": "Allow invisible Flash",
		"fr-fr": "Autoriser le Flash invisible",
		"es-es": "Permitir el contenido Flash invisible",
		"ja-jp": "不可視 Flash コンテンツを有効にする",
		"zh-tw": "載入不可見的 Flash 外掛模組",
		"zh-cn": "加载不可見的 Flash 插件"
	},
	DEBUG_MODE: {
		"en-us": "Block Flash manually",
		"fr-fr": "Bloquer Flash manuellement",
		"es-es": "Bloquear el contenido Flash manualmente",
		"ja-jp": "手動的に Flash コンテンツ を抑止する",
		"zh-tw": "手動阻擋 Flash 外掛模組",
		"zh-cn": "手动屏蔽 Flash 插件"
	},
	SIFR_POLICY: {
		"en-us": "sIFR text policy:",
		"fr-fr": "Texte sIFR :",
		"es-es": "Texto sIFR:",
		"ja-jp": "sIFR テキスト設定：",
		"zh-tw": "sIFR 文字設定：",
		"zh-cn": "sIFR 文字："
	},
	SIFR_TEXT_ONLY: {
		"en-us": "Show text only",
		"fr-fr": "N’afficher que le texte",
		"es-es": "Únicamente mostrar el texto",
		"ja-jp": "テキストのみを表示",
		"zh-tw": "只顯示文字",
		"zh-cn": "只显示文本"
	},
	SIFR_NORMAL: {
		"en-us": "Treat as regular Flash",
		"fr-fr": "Considérer comme Flash",
		"es-es": "Tratar como un complemento Flash",
		"ja-jp": "Flash として扱う",
		"zh-tw": "當作一般 Flash",
		"zh-cn": "当作一般 Flash"
	},
	SIFR_AUTOLOAD: {
		"en-us": "Load automatically",
		"fr-fr": "Autoriser",
		"es-es": "Cargar automáticamente",
		"ja-jp": "自動的に読み込む",
		"zh-tw": "自動載入",
		"zh-cn": "自动加载"
	},
	KILLER_SCRIPTS: {
		"en-us": "Flash to HTML5 converters:",
		"fr-fr": "Scripts de conversion en HTML5 :",
		"es-es": "Scripts para conversiones en HTML5:",
		"ja-jp": "これらのスクリプトを使用してHTML5の置き換えを実行する：",
		"zh-tw": "使用這些腳本進行HTML5取代：",
		"zh-cn": "使用这些脚本进行HTML5替代："
	},
	DEFAULT_KILLERS_BUTTON: {
		"en-us": "Use default",
		"fr-fr": "Défaut",
		"es-es": "Predeterminado",
		"ja-jp": "デフォルトに戻す",
		"zh-tw": "使用預設值",
		"zh-cn": "还原默认值"
	},
	USE_FALLBACK_MEDIA: {
		"en-us": "Use HTML5 media fallbacks",
		"fr-fr": "Utiliser les replis HTML5",
		"es-es": "Utilizar “fallbacks” en HTML5",
		"ja-jp": "HTML5 のフォールバックセクションを有効にする",
		"zh-tw": "使用 HTML5 的後備（Fallback）機制",
		"zh-cn": "使用 HTML5 的应变（Fallback）计划"
	},
	DOWNLOADING: {
		"en-us": "Downloading:",
		"fr-fr": "Téléchargements :",
		"es-es": "Descargas:",
		"ja-jp": "ダウンロード：",
		"zh-tw": "下載：",
		"zh-cn": "下载："
	},
	USE_DOWNLOAD_MANAGER: {
		"en-us": "Use a download manager",
		"fr-fr": "Utiliser un gestionnaire de téléchargement",
		"es-es": "Utilizar un gestor de descargas",
		"ja-jp": "ダウンロードマネージャーを使う",
		"zh-tw": "啟用下載管理程式",
		"zh-cn": "启用下载管理工具"
	},
	
	// Control lists tab
	ALLOW_LOCATIONS: {
		"en-us": "Allow Flash on these sites:",
		"fr-fr": "Autoriser le Flash sur ces sites :",
		"es-es": "Permitir el contenido Flash en estos sitios:",
		"ja-jp": "これらのサイトなら Flash コンテンツの読込みを許可：",
		"zh-tw": "永遠載入包含這些網址的 Flash 外掛模組：",
		"zh-cn": "永远加载这些地址的 Flash 插件："
	},
	ALLOW_SOURCES: {
		"en-us": "Allow Flash from these sources:",
		"fr-fr": "Autoriser le Flash provenant de :",
		"es-es": "Permitir el contenido Flash en los archivos:",
		"ja-jp": "これらのソースなら Flash コンテンツの読込みを許可：",
		"zh-tw": "永遠載入包含這些來源的 Flash 外掛模組：",
		"zh-cn": "永远加载这些来源的 Flash 插件："
	},
	BLOCK_LOCATIONS: {
		"en-us": "Block Flash on these sites:",
		"fr-fr": "Bloquer le Flash sur ces sites :",
		"es-es": "Bloquear el contenido Flash en estos sitios:",
		"ja-jp": "これらのサイトなら Flash コンテンツ 読み込むことを抑止：",
		"zh-tw": "阻擋包含這些網址的 Flash 外掛模組：",
		"zh-cn": "永远屏蔽这些地址的 Flash 插件："
	},
	BLOCK_SOURCES: {
		"en-us": "Block Flash from these sources:",
		"fr-fr": "Bloquer le Flash provenant de :",
		"es-es": "Bloquear el contenido Flash en los archivos:",
		"ja-jp": "これらのソースなら Flash コンテンツ 読み込むことを抑止：",
		"zh-tw": "阻擋這些來源的 Flash 外掛模組：",
		"zh-cn": "永远屏蔽这些来源的 Flash 插件："
	},
	INVERT_WHITELISTS: {
		"en-us": "Invert lists",
		"fr-fr": "Inverser",
		"es-es": "Invertir las listas",
		"ja-jp": "逆にする",
		"zh-tw": "逆向操作",
		"zh-cn": "反转清单"
	},
	HIDE_LOCATIONS: {
		"en-us": "Hide Flash on these sites:",
		"fr-fr": "Masquer le Flash sur ces sites :",
		"es-es": "Ocultar el contenido Flash en estos sitios:",
		"ja-jp": "これらのサイトなら Flash コンテンツを隠す：",
		"zh-tw": "隱藏包含這些網址的 Flash 外掛模組：",
		"zh-cn": "隐藏这些地址的 Flash 插件："
	},
	HIDE_SOURCES: {
		"en-us": "Hide Flash from these sources:",
		"fr-fr": "Masquer le Flash provenant de :",
		"es-es": "Ocultar el contenido Flash en los archivos:",
		"ja-jp": "これらのソースなら Flash コンテンツを隠す：",
		"zh-tw": "隱藏這些來源的 Flash 外掛模組：",
		"zh-cn": "隐藏这些来源的 Flash 插件："
	},
	SHOW_LOCATIONS: {
		"en-us": "Show Flash on these sites:",
		"fr-fr": "Afficher le Flash sur ces sites :",
		"es-es": "Mostrar el contenido Flash en estos sitios:",
		"ja-jp": "これらのサイトなら Flash コンテンツを表示する：",
		"zh-tw": "顯示包含這些網址的 Flash 外掛模組：",
		"zh-cn": "显示这些地址的 Flash 插件："
	},
	SHOW_SOURCES: {
		"en-us": "Show Flash from these sources:",
		"fr-fr": "Afficher le Flash provenant de :",
		"es-es": "Mostrar el contenido Flash en los archivos:",
		"ja-jp": "これらのソースなら Flash コンテンツを表示する：",
		"zh-tw": "顯示這些來源的 Flash 外掛模組：",
		"zh-cn": "永远显示这些来源的 Flash 插件："
	},
	INVERT_BLACKLISTS: {
		"en-us": "Invert lists",
		"fr-fr": "Inverser",
		"es-es": "Invertir las listas",
		"ja-jp": "逆にする",
		"zh-tw": "逆向操作",
		"zh-cn": "反转清单"
	},
	
	// Media player tab
	SHOW_SOURCE_SELECTOR: {
		"en-us": "Show list of available sources",
		"fr-fr": "Afficher la liste des formats disponibles",
		"es-es": "Mostrar una lista de los formatos disponibles",
		"ja-jp": "複数のソースがある場合はリストを表示する",
		"zh-tw": "顯示可用來源列表",
		"zh-cn": "显示可用的来源菜单"
	},
	SHOW_PLUGIN_SOURCE: {
		"en-us": "Include Flash",
		"fr-fr": "Inclure Flash",
		"es-es": "Incluir Flash",
		"ja-jp": "Flash コンテンツを含む",
		"zh-tw": "包括 Flash 外掛模組",
		"zh-cn": "包含 Flash 插件"
	},
	SHOW_QTP_SOURCE: {
		"en-us": "Include QuickTime Player",
		"fr-fr": "Inclure QuickTime Player",
		"es-es": "Incluir QuickTime Player",
		"ja-jp": "QuickTime プレーヤーを含む",
		"zh-tw": "包括 QuickTime Player",
		"zh-cn": "包含 QuickTime Player"
	},
	SHOW_POSTER: {
		"en-us": "Show preview image",
		"fr-fr": "Afficher un aperçu de la vidéo",
		"es-es": "Mostrar la imagen de previsualización",
		"ja-jp": "プレビューを有効にする",
		"zh-tw": "啟用預覽",
		"zh-cn": "显示缩图"
	},
	SHOW_MEDIA_TOOLTIP: {
		"en-us": "Show video title as tooltip",
		"fr-fr": "Afficher le titre de la vidéo en infobulle",
		"es-es": "Mostrar el título del vídeo como mensaje de ayuda contextual",
		"ja-jp": "ツールチップとしてビデオのタイトルを示す",
		"zh-tw": "以快顯視窗顯示影片標題",
		"zh-cn": "视频题目在工具提示控件显示"
	},
	HIDE_REWIND_BUTTON: {
		"en-us": "Hide “Rewind” button",
		"fr-fr": "Supprimer le bouton « Rembobiner 30 secondes »",
		"es-es": "Ocultar el botón Rebobinar",
		"ja-jp": "「巻き戻し」ボタンを隠す",
		"zh-tw": "隱藏「迴轉」按鈕",
		"zh-cn": "隐藏「倒带」按钮"
	},
	AUTOLOAD_MEDIA_PLAYER: {
		"en-us": "Load media player automatically",
		"fr-fr": "Charger le lecteur automatiquement",
		"es-es": "Cargar el reproductor automáticamente",
		"ja-jp": "プレーヤーを自動的に読み込む",
		"zh-tw": "自動載入播放器",
		"zh-cn": "自动加载播放器"
	},
	AUTOPLAY_LOCATIONS: {
		"en-us": "Autoplay on these sites:",
		"fr-fr": "Lancer la lecture automatiquement sur ces sites :",
		"es-es": "Reproducir automáticamente en estos sitios:",
		"ja-jp": "これらのサイトならプレーヤーを自動的に起動する：",
		"zh-tw": "在這些網址自動播放：",
		"zh-cn": "在这些地址启用自动播放："
	},
	INITIAL_BEHAVIOR: {
		"en-us": "Initial behavior:",
		"en-gb": "Initial behaviour:",
		"fr-fr": "Action initiale :",
		"es-es": "Acción inicial:",
		"ja-jp": "一旦プレーヤーが読み込んだ場合は、まず：",
		"zh-tw": "初始動作：",
		"zh-cn": "初始動作："
	},
	INITIAL_NO_BUFFER: {
		"en-us": "Do not buffer",
		"fr-fr": "Aucune",
		"es-es": "No precargar",
		"ja-jp": "何もしません",
		"zh-tw": "不緩衝",
		"zh-cn": "不缓冲"
	},
	INITIAL_BUFFER: {
		"en-us": "Start buffering",
		"fr-fr": "Commencer le téléchargement",
		"es-es": "Emprezar la precarga",
		"ja-jp": "バッファリングを始めます",
		"zh-tw": "只開始緩衝",
		"zh-cn": "开始缓冲"
	},
	INITIAL_AUTOPLAY: {
		"en-us": "Start buffering and play automatically",
		"fr-fr": "Commencer la lecture automatiquement",
		"es-es": "Emprezar la precarga y reproducir automáticamente",
		"ja-jp": "バッファリングを始めると共に再生します",
		"zh-tw": "開始緩衝並且自動播放",
		"zh-cn": "开始缓冲并且自动播放"
	},
	MAX_RESOLUTION: {
		"en-us": "Default resolution:",
		"fr-fr": "Résolution par défaut :",
		"es-es": "Resolución por defecto:",
		"ja-jp": "デフォルト解像度：",
		"zh-tw": "預設解像度：",
		"zh-cn": "默认解像度："
	},
	DEFAULT_PLAYER: {
		"en-us": "Default media player:",
		"fr-fr": "Lecteur par défaut :",
		"es-es": "Reproductor multimedia por defecto:",
		"ja-jp": "デフォルトプレーヤー：",
		"zh-tw": "預設播放器：",
		"zh-cn": "默认播放器："
	},
	HTML5_PLAYER: {
		"en-us": "HTML5",
		"fr-fr": "HTML5",
		"es-es": "HTML5",
		"ja-jp": "HTML5",
		"zh-tw": "HTML5",
		"zh-cn": "HTML5"
	},
	QUICKTIME_PLAYER: {
		"en-us": "QuickTime Player",
		"fr-fr": "QuickTime Player",
		"es-es": "QuickTime Player",
		"ja-jp": "QuickTime プレーヤー",
		"zh-tw": "QuickTime Player",
		"zh-cn": "QuickTime Player"
	},
	PLUGIN_PLAYER: {
		"en-us": "Flash",
		"fr-fr": "Flash",
		"es-es": "Flash",
		"ja-jp": "Flash コンテンツ",
		"zh-tw": "Flash 外掛模組",
		"zh-cn": "Flash 插件"
	},
	NONNATIVE_FORMATS_POLICY: {
		"en-us": "Nonnative formats policy:",
		"fr-fr": "Formats non natifs :",
		"es-es": "Formatos no nativos:",
		"ja-jp": "非ネイティブなコーデック：",
		"zh-tw": "非原生解碼器：",
		"zh-cn": "非原生解码器："
	},
	NONNATIVE_IGNORE: {
		"en-us": "Never use as default",
		"fr-fr": "Ne jamais utiliser comme défaut",
		"es-es": "Nunca usar por defecto",
		"ja-jp": "使用せず",
		"zh-tw": "不使用",
		"zh-cn": "不使用"
	},
	NONNATIVE_LAST_RESORT: {
		"en-us": "Use only as a last resort",
		"fr-fr": "N’utiliser qu'en dernier recours",
		"es-es": "Usar como última opción",
		"ja-jp": "候補にする",
		"zh-tw": "作為最後選擇",
		"zh-cn": "作为最后选择"
	},
	NONNATIVE_USE_FREELY: {
		"en-us": "Use freely",
		"fr-fr": "Utiliser sans restrictions",
		"es-es": "Usar libremente",
		"ja-jp": "自由に使う",
		"zh-tw": "任意使用",
		"zh-cn": "自由使用"
	},
	SOUND_VOLUME: {
		"en-us": "Sound volume:",
		"fr-fr": "Volume sonore :",
		"es-es": "Volumen del sonido:",
		"ja-jp": "音量：",
		"zh-tw": "音量：",
		"zh-cn": "音量："
	},
	
	// Shortcut menu tab
	SHOW_IN_CONTEXT_MENU: {
		"en-us": "Show these commands in the shortcut menu:",
		"fr-fr": "Afficher ces options dans le menu contextuel :",
		"es-es": "Mostrar estas opciones en el menú contextual:",
		"ja-jp": "これらのコマンドをコンテキストメニューで表示：",
		"zh-tw": "在快顯功能表顯示這些指令：",
		"zh-cn": "在快显菜单显示这些命令："
	},
	SETTINGS_CONTEXT: {
		"en-us": "ClickToFlash Preferences",
		"fr-fr": "Préférences ClickToFlash",
		"es-es": "Preferencias de ClickToFlash",
		"ja-jp": "ClickToFlash 設定",
		"zh-tw": "ClickToFlash 偏好設定",
		"zh-cn": "ClickToFlash 設定"
	},
	DISABLE_ENABLE_CONTEXT: {
		"en-us": "Disable/Enable ClickToFlash",
		"fr-fr": "Désactiver/Activer ClickToFlash",
		"es-es": "Desactivar/Activar ClickToFlash",
		"ja-jp": "ClickToFlash を有効／無効にする",
		"zh-tw": "啟用或停用 ClickToFlash",
		"zh-cn": "启用/停用 ClickToFlash"
	},
	ALWAYS_ALLOW_CONTEXT: {
		"en-us": "Always Allow",
		"fr-fr": "Toujours autoriser",
		"es-es": "Permitir siempre",
		"ja-jp": "あらゆる許可",
		"zh-tw": "永遠允許",
		"zh-cn": "以后都准许"
	},
	ALWAYS_HIDE_CONTEXT: {
		"en-us": "Always Hide",
		"fr-fr": "Toujours masquer",
		"es-es": "Ocultar siempre",
		"ja-jp": "あらゆる隠す",
		"zh-tw": "永遠隱藏",
		"zh-cn": "以后都隐藏"
	},
	LOAD_ALL_CONTEXT: {
		"en-us": "Load All Flash",
		"fr-fr": "Débloquer tout le Flash",
		"es-es": "Cargar todo el contenido Flash",
		"ja-jp": "Flash コンテンツをすべて読み込む",
		"zh-tw": "載入所有 Flash 外掛模組",
		"zh-cn": "加载所有 Flash 插件"
	},
	LOAD_INVISIBLE_CONTEXT: {
		"en-us": "Load Invisible Flash",
		"fr-fr": "Débloquer le Flash invisible",
		"es-es": "Cargar el contenido Flash invisible",
		"ja-jp": "不可視 Flash コンテンツを読み込む",
		"zh-tw": "載入所有不可見的 Flash 外掛模組",
		"zh-cn": "加载所有不可見的 Flash 插件"
	},
	HIDE_ALL_CONTEXT: {
		"en-us": "Hide All Flash",
		"fr-fr": "Masquer tout le Flash",
		"es-es": "Ocultar todo el contenido Flash",
		"ja-jp": "Flash コンテンツをすべて隠す",
		"zh-tw": "隱藏所有 Flash 外掛模組",
		"zh-cn": "隐藏所有 Flash 插件"
	},
	DOWNLOAD_CONTEXT: {
		"en-us": "Download Video",
		"fr-fr": "Télécharger la vidéo",
		"es-es": "Descargar el vídeo",
		"ja-jp": "ビデオを保存",
		"zh-tw": "下載影片",
		"zh-cn": "下载视频"
	},
	VIEW_ON_SITE_CONTEXT: {
		"en-us": "View on Site",
		"fr-fr": "Voir la vidéo sur le site",
		"es-es": "Ver en la página web",
		"ja-jp": "サイトで開く",
		"zh-tw": "於網站上檢視",
		"zh-cn": "在网站上查看"
	},
	VIEW_IN_QTP_CONTEXT: {
		"en-us": "View in QuickTime Player",
		"fr-fr": "Ouvrir avec QuickTime Player",
		"es-es": "Ver con QuickTime Player",
		"ja-jp": "QuickTime プレーヤーで開く",
		"zh-tw": "於 QuickTime Player 檢視",
		"zh-cn": "在 QuickTime Player 查看"
	},
	
	// Keyboard shortcuts tab
	CLEAR_BUTTON: {
		"en-us": "Clear",
		"fr-fr": "Effacer",
		"es-es": "Limpiar",
		"ja-jp": "クリア",
		"zh-tw": "清除",
		"zh-cn": "清除"
	},
	SETTINGS_SHORTCUT: {
		"en-us": "Open preferences:",
		"fr-fr": "Ouvrir les préférences :",
		"es-es": "Mostrar las preferencias:",
		"ja-jp": "設定を開く：",
		"zh-tw": "開啟偏好設定面板：",
		"zh-cn": "开启设定面板："
	},
	WHITELIST_SHORTCUT: {
		"en-us": "Allow Flash on domain:",
		"fr-fr": "Autoriser le Flash sur ce domaine :",
		"es-es": "Permitir el contenido Flash en el dominio:",
		"ja-jp": "このドメインなら Flash コンテンツ自動的に読み込む：",
		"zh-tw": "載入包含這個域名的 Flash 外掛模組：",
		"zh-cn": "加载包含这个域名的 Flash 插件："
	},
	LOAD_ALL_SHORTCUT: {
		"en-us": "Load all Flash in frontmost tab:",
		"fr-fr": "Débloquer tout le Flash :",
		"es-es": "Cargar todo el contenido Flash en la pestaña actual:",
		"ja-jp": "一番手前のタブでの Flash コンテンツをすべて読み込む：",
		"zh-tw": "載入所有最前方標籤頁中的 Flash 外掛模組：",
		"zh-cn": "加载最前方标签中的所有 Flash 插件："
	},
	HIDE_ALL_SHORTCUT: {
		"en-us": "Hide all Flash in frontmost tab:",
		"fr-fr": "Masquer tout le Flash :",
		"es-es": "Ocultar todo el contenido Flash en la pestaña actual:",
		"ja-jp": "一番手前のタブでの Flash コンテンツをすべて隠す：",
		"zh-tw": "隱藏所有最前方標籤頁中的 Flash 外掛模組：",
		"zh-cn": "隐藏最前方标签中的所有 Flash 插件："
	},
	HIDE_PLUGIN_SHORTCUT: {
		"en-us": "Hide targeted Flash object:",
		"fr-fr": "Masquer l'élément Flash ciblé :",
		"es-es": "Ocultar el objeto Flash seleccionado:",
		"ja-jp": "指定された Flash コンテンツを隠す：",
		"zh-tw": "隱藏指定 Flash 外掛模組：",
		"zh-cn": "隐藏指定的 Flash 插件："
	},
	PLAY_PAUSE_SHORTCUT: {
		"en-us": "Play/pause:",
		"fr-fr": "Lecture/pause :",
		"es-es": "Reproducir/Pausar:",
		"ja-jp": "再生／一時停止：",
		"zh-tw": "播放/暫停：",
		"zh-cn": "播放/暂停："
	},
	TOGGLE_FULLSCREEN_SHORTCUT: {
		"en-us": "Enter fullscreen:",
		"fr-fr": "Mode plein écran :",
		"es-es": "Ver en pantalla completa:",
		"ja-jp": "フルスクリーンにする：",
		"zh-tw": "全螢幕：",
		"zh-cn": "全屏幕："
	},
	VOLUME_UP_SHORTCUT: {
		"en-us": "Volume up:",
		"fr-fr": "Augmenter le volume :",
		"es-es": "Subir el volumen:",
		"ja-jp": "音量を上げる：",
		"zh-tw": "調高音量：",
		"zh-cn": "上升音量："
	},
	VOLUME_DOWN_SHORTCUT: {
		"en-us": "Volume down:",
		"fr-fr": "Diminuer le volume :",
		"es-es": "Bajar el volumen:",
		"ja-jp": "音量を下げる：",
		"zh-tw": "調低音量：",
		"zh-cn": "下降音量："
	},
	TOGGLE_LOOPING_SHORTCUT: {
		"en-us": "Toggle repeat:",
		"fr-fr": "Activer/désactiver la répétition :",
		"es-es": "Activar/Desactivar la repetición:",
		"ja-jp": "繰り返す：",
		"zh-tw": "重播：",
		"zh-cn": "重播："
	},
	PREV_TRACK_SHORTCUT: {
		"en-us": "Previous track:",
		"fr-fr": "Piste précédente :",
		"es-es": "Pista anterior:",
		"ja-jp": "前のトラック：",
		"zh-tw": "上一個音軌：",
		"zh-cn": "上一个曲目："
	},
	NEXT_TRACK_SHORTCUT: {
		"en-us": "Next track:",
		"fr-fr": "Piste suivante :",
		"es-es": "Pista siguiente:",
		"ja-jp": "次のトラック：",
		"zh-tw": "下一個音軌：",
		"zh-cn": "下一个曲目："
	},
	SHOW_TITLE_SHORTCUT: {
		"en-us": "Show/hide track title:",
		"fr-fr": "Afficher/masquer le titre :",
		"es-es": "Mostrar/Ocultar el título de la pista:",
		"ja-jp": "タイトルの表示／非表示：",
		"zh-tw": "顯示/隱藏標題：",
		"zh-cn": "显示/隐藏题目："
	}
};

const GLOBAL_STRINGS = {
	// Context menu items
	PREFERENCES: {
		"en-us": "ClickToFlash Preferences",
		"fr-fr": "Préférences ClickToFlash",
		"es-es": "Preferencias de ClickToFlash",
		"ja-jp": "ClickToFlash 設定",
		"zh-tw": "ClickToFlash 偏好設定",
		"zh-cn": "ClickToFlash 設定"
	},
	SWITCH_ON: {
		"en-us": "Enable ClickToFlash",
		"fr-fr": "Activer ClickToFlash",
		"es-es": "Activar ClickToFlash",
		"ja-jp": "ClickToFlash を有効",
		"zh-tw": "啟用 ClickToFlash",
		"zh-cn": "启用 ClickToFlash"
	},
	SWITCH_OFF: {
		"en-us": "Disable ClickToFlash",
		"fr-fr": "Désactiver ClickToFlash",
		"es-es": "Desactivar ClickToFlash",
		"ja-jp": "ClickToFlash を無効",
		"zh-tw": "停用 ClickToFlash",
		"zh-cn": "停用 ClickToFlash"
	},
	LOAD_ALL_PLUGINS: {
		"en-us": "Load All Flash",
		"fr-fr": "Débloquer Flash sur cette page",
		"es-es": "Cargar todo el contenido Flash",
		"ja-jp": "Flash コンテンツを全部読み込む",
		"zh-tw": "載入所有 Flash 外掛模組",
		"zh-cn": "加载所有 Flash 插件"
	},
	LOAD_INVISIBLE_PLUGINS: {
		"en-us": "Load Invisible Flash",
		"fr-fr": "Débloquer le Flash invisible",
		"es-es": "Cargar el contenido Flash invisible",
		"ja-jp": "不可視の Flash コンテンツを全部読み込む",
		"zh-tw": "載入所有不可見的 Flash 外掛模組",
		"zh-cn": "加载所有不可見的 Flash 插件"
	},
	HIDE_ALL_PLUGINS: {
		"en-us": "Hide All Flash",
		"fr-fr": "Masquer Flash sur cette page",
		"es-es": "Ocultar todo el contenido Flash",
		"ja-jp": "Flash コンテンツを全部隠す",
		"zh-tw": "隱藏所有 Flash 外掛模組",
		"zh-cn": "隐藏所有 Flash 插件"
	},
	ALWAYS_ALLOW_ON_DOMAIN: {
		"en-us": "Allow Flash on Domain",
		"fr-fr": "Autoriser Flash sur ce domaine",
		"es-es": "Permitir el contenido Flash en del dominio",
		"ja-jp": "このドメインなら Flash コンテンツを有効",
		"zh-tw": "載入包含這個域名的 Flash 外掛模組",
		"zh-cn": "加载包含这个域名的 Flash 插件"
	},
	ALWAYS_BLOCK_ON_DOMAIN: {
		"en-us": "Block Flash on Domain",
		"fr-fr": "Bloquer Flash sur ce domaine",
		"es-es": "Bloquear el contenido Flash en del dominio",
		"ja-jp": "このドメインなら Flash コンテンツ 読み込むを抑止",
		"zh-tw": "阻擋包含這個域名的 Flash 外掛模組",
		"zh-cn": "屏蔽这个域名的 Flash 插件"
	},
	ALWAYS_ALLOW_SOURCE: {
		"en-us": "Always Allow",
		"fr-fr": "Toujours autoriser",
		"es-es": "Permitir siempre",
		"ja-jp": "あらゆる許可",
		"zh-tw": "永遠允許",
		"zh-cn": "以后都准许"
	},
	ALWAYS_HIDE_ON_DOMAIN: {
		"en-us": "Hide Flash on Domain",
		"fr-fr": "Masquer Flash sur ce domaine",
		"es-es": "Ocultar el contenido Flash en del dominio",
		"ja-jp": "このドメインなら Flash コンテンツを隠す",
		"zh-tw": "隱藏包含這個域名的 Flash 外掛模組",
		"zh-cn": "隐藏包含这个些域名的 Flash 插件"
	},
	ALWAYS_SHOW_ON_DOMAIN: {
		"en-us": "Show Flash on Domain",
		"fr-fr": "Afficher Flash sur ce domaine",
		"es-es": "Mostrar el contenido Flash en del dominio",
		"ja-jp": "このドメインなら Flash コンテンツを表示",
		"zh-tw": "顯示包含這個域名的 Flash 外掛模組",
		"zh-cn": "显示包含这个些域名的 Flash 插件"
	},
	ALWAYS_HIDE_SOURCE: {
		"en-us": "Always Hide",
		"fr-fr": "Toujours masquer",
		"es-es": "Ocultar siempre",
		"ja-jp": "あらゆる隠す",
		"zh-tw": "永遠隱藏",
		"zh-cn": "以后都隐藏"
	},
	DOWNLOAD_VIDEO: {
		"en-us": "Download Video",
		"fr-fr": "Télécharger la vidéo",
		"es-es": "Descargar el vídeo",
		"ja-jp": "ビデオを保存",
		"zh-tw": "下載影片",
		"zh-cn": "下载视频"
	},
	DOWNLOAD_AUDIO: {
		"en-us": "Download Audio",
		"fr-fr": "Télécharger l'audio",
		"es-es": "Descargar el audio",
		"ja-jp": "オーディオを保存",
		"zh-tw": "下載音頻",
		"zh-cn": "下载音频"
	},
	VIEW_IN_QUICKTIME_PLAYER: {
		"en-us": "View in QuickTime Player",
		"fr-fr": "Ouvrir avec QuickTime Player",
		"es-es": "Ver con QuickTime Player",
		"ja-jp": "QuickTime プレーヤーで開く",
		"zh-tw": "於 QuickTime Player 檢視",
		"zh-cn": "在 QuickTime Player 查看"
	},
	GET_PLUGIN_INFO: {
		"en-us": "Get Plug-in Info",
		"fr-fr": "Lire les informations",
		"es-es": "Mostrar la información del complemento",
		"ja-jp": "情報を見る",
		"zh-tw": "簡介",
		"zh-cn": "简介"
	},
	LOAD_PLUGIN: {
		"en-us": function(plugin) {return "Load " + plugin;},
		"fr-fr": function(plugin) {return "Charger " + plugin;},
		"es-es": function(plugin) {return "Cargar " + plugin;},
		"ja-jp": function(plugin) {return plugin + " を読み込む";},
		"zh-tw": function(plugin) {return "載入 " + plugin;},
		"zh-cn": function(plugin) {return "加载 " + plugin;}
	},
	HIDE_PLUGIN: {
		"en-us": function(plugin) {return "Hide " + plugin;},
		"fr-fr": function(plugin) {return "Masquer " + plugin;},
		"es-es": function(plugin) {return "Ocultar " + plugin;},
		"ja-jp": function(plugin) {return plugin + " を隠す";},
		"zh-tw": function(plugin) {return "隱藏 " + plugin;},
		"zh-cn": function(plugin) {return "隐藏 " + plugin;}
	},
	RESTORE_PLUGIN: {
		"en-us": function(plugin) {return "Restore " + plugin;},
		"fr-fr": function(plugin) {return "Restaurer " + plugin;},
		"es-es": function(plugin) {return "Restablecer " + plugin;},
		"ja-jp": function(plugin) {return plugin + " に戻す";},
		"zh-tw": function(plugin) {return "復原 " + plugin;},
		"zh-cn": function(plugin) {return "还原 " + plugin;}
	},
	VIEW_ON_SITE: {
		"en-us": function(site) {return "View on " + site;},
		"fr-fr": function(site) {return "Voir la vidéo sur " + site;},
		"es-es": function(site) {return "Ver en " + site;},
		"ja-jp": function(plugin) {return site + " で開く";},
		"zh-tw": function(plugin) {return "於 " + site + " 檢視";},
		"zh-cn": function(plugin) {return "在 " + site + " 查看";}
	}
};

