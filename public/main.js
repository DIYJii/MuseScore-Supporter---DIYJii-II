(function() {
    var PANEL_WIDTH = '380px';
    var PANEL_ID = 'my-ai-sidebar';
    var MS_DARK_BLUE = '#172b4d'; 
    var MS_LIGHT_BLUE = '#eef2f7';
    var SEARCH_BLUE = '#0d47a1'; 
    var CLEAR_RED = '#d32f2f';  

    if (document.getElementById(PANEL_ID)) { closePanel(); return; }

    function closePanel() {
        document.documentElement.style.width = '';
        var p = document.getElementById(PANEL_ID);
        if (p) p.remove();
    }

    function getCleanContext() {
        var clone = document.body.cloneNode(true);
        var ignore = clone.querySelectorAll('script, style, noscript, iframe, nav, footer, .ads, .user-nav, button, .post-actions, .moderation-menu, .flag-button');
        ignore.forEach(el => el.remove());
        
        var mainArea = clone.querySelector('article, main, .forum-post-content, .node-content') || clone;
        
        var links = mainArea.querySelectorAll('a');
        links.forEach(link => {
            if (link.offsetWidth > 0 || link.offsetHeight > 0) {
                var textNode = document.createTextNode(link.innerText);
                link.parentNode.replaceChild(textNode, link);
            } else {
                link.remove();
            }
        });

        return mainArea.innerText.replace(/\s+/g, ' ').trim().substring(0, 5000);
    }

    // 2. 新しいDomain（ボタン名）の定義
    var domains = ["General", "Subscriptions", "Web Operations", "Notations", "Scores", "TbD"];
    
    // 6. 各ドメインに対応する個別のローカルストレージ用キー定義
    var STORAGE_KEYS = {
        "General": "musescore_saved_queries_General",
        "Subscriptions": "musescore_saved_queries_Subscriptions",
        "Web Operations": "musescore_saved_queries_Web_Operations",
        "Notations": "musescore_saved_queries_Notations",
        "Scores": "musescore_saved_queries_Scores",
        "TbD": "musescore_saved_queries_TbD"
    };
    
    // トグル状態管理用（初期値は"General"）
    var activeDomain = "General";

    // 10. メインロード時の初期情報検出（Domainとブラウザ言語）
    var initialDomain = window.location.hostname || "musescore.com";
    var initialLanguage = (navigator.language || navigator.userLanguage || "en").split('-')[0];
    
    // 11. 送信用ヘッダーテキストの自動生成
    var aiHeaderPrompt = `\\Language = ${initialLanguage}; \\CurrentSite = ${initialDomain};\n`;

    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.cssText = `
        position:fixed;
        top:0px;
        bottom:0;
        right:0;
        width:${PANEL_WIDTH};
        background:#fcfcfc;
        border-left:1px solid #ccc;
        z-index:2147483647;
        font-family:sans-serif;
        display:flex;
        flex-direction:column;
        box-shadow:-5px 0 15px rgba(0,0,0,0.1);
        box-sizing:border-box;
    `;

    var btnBase = "display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; border-radius:4px; font-weight:bold; color:white; box-sizing:border-box; height:32px; font-size:12px;";

    panel.innerHTML = `
        <div style="background:#fff; padding:5px 15px; border-top:2px solid #ccc; display:flex; justify-content:center; align-items:center; height:40px; flex-shrink:0; position:relative;">
            <span style="font-weight:900; color:${MS_DARK_BLUE}; font-size:22px;">MuseScore Supporter</span>
            <button id="close-x" style="cursor:pointer; border:none; background:none; font-size:28px; color:#aaa; position:absolute; right:15px;">&times;</button>
        </div>
        <div id="domain-area" style="padding:2px 15px; background:#fff; border-bottom:1px solid #eee; flex-shrink:0;">
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:2px;" id="row-sites"></div>
        </div>
        <div id="top-area" style="padding:5px 15px; display:flex; flex-direction:column; gap:6px; flex:1; min-height:0; background:rgba(232, 245, 233, 0.4);">
            <textarea id="ai-query" placeholder="-Type your query for AI Search.\n-Use '#context' to refer to the text on the left.\n-To search within a specific site: Site:https://\n-Enter keywords for a standard search." style="width:100%; flex:1; border:2px solid #bbb; border-radius:6px; padding:8px; font-size:13px; color:#000; resize:none; box-sizing:border-box; outline:none; background:#fff; overflow-y:auto;"></textarea>
            <div style="display:flex; gap:8px; flex-shrink:0;">
                <button id="ai-submit" style="${btnBase} background:${SEARCH_BLUE}; flex:1;">AI Search</button>
                <button id="web-search" style="${btnBase} background:${SEARCH_BLUE}; flex:1;">Key Words Search</button>
            </div>
            <div style="display:flex; gap:8px; flex-shrink:0;">
                <button id="ai-save" style="${btnBase} background:#ef6c00; flex:1;">Save Query</button>
                <button id="ai-clear" style="${btnBase} background:${CLEAR_RED}; flex:1;">Clear Query</button>
            </div>
        </div>
        <!-- Lower Window (History) -->
        <div id="history-container" style="margin:5px 15px 0px 15px; display:flex; flex-direction:column; flex:1; min-height:0; background:rgba(232, 245, 233, 0.4); border:2px solid #bbb; border-radius:6px; overflow:hidden;">
            <div style="flex-grow:1; overflow-y:auto; padding:3px;" id="query-list"></div>
        </div>
        <div style="padding:4px 8px 10px 8px; text-align:center; height:40px; font-size:11px; font-weight:bold; color:${MS_DARK_BLUE}; background:#fff; border-top:1px solid #eee; flex-shrink:0;">Powered by Google AI Search</div>`;

    document.body.appendChild(panel);
    document.documentElement.style.width = `calc(100% - ${PANEL_WIDTH})`;

    var tx = document.getElementById('ai-query');

    // 5 & 9. Vercelの.binファイル存在チェック用（ダミー関数：実環境に合わせてFetch等に変更可能）
    function checkVercelPromptDeployed(domainName) {
        // 例: Web Operations などのスペースをエンコードして検証URLを作成
        // 擬似的に、特定条件（例: 'TbD' など）を未アップロードエラーテスト用としてfalseにできます。
        // ここでは仕様通り、検証結果をBooleanで返します。
        if (domainName === "TbD") {
            return false; // テスト用にTbDのみ未デプロイ状態を再現
        }
        return true; 
    }

    // 3 & 7. ボタン切り替え処理（トグル・ロード連携）
    function renderToggles() {
        var container = document.getElementById('row-sites');
        container.innerHTML = '';
        
        domains.forEach(dName => {
            var btn = document.createElement('button');
            btn.innerText = dName;
            var isOn = (activeDomain === dName);
            btn.style.cssText = btnBase + `height:28px; font-size:11px; margin:1px 0; background:${isOn ? MS_DARK_BLUE : MS_LIGHT_BLUE}; color:${isOn ? '#fff' : MS_DARK_BLUE}; border:1px solid ${MS_DARK_BLUE};`;
            
            btn.onclick = () => {
                // 9. Vercelに登録されていない場合は切り替えない
                if (!checkVercelPromptDeployed(dName)) {
                    alert("Prompt to be defined");
                    return;
                }
                activeDomain = dName;
                renderToggles();
                renderSavedQueries(); // 7. オンになったボタンに合わせてロード
            };
            container.appendChild(btn);
        });
    }

    // 7. 下のウィンドウへのデータロード
    function renderSavedQueries() {
        var listCont = document.getElementById('query-list');
        listCont.innerHTML = '';
        
        var currentKey = STORAGE_KEYS[activeDomain];
        var savedText = localStorage.getItem(currentKey) || "";
        
        if (savedText) {
            var row = document.createElement('div');
            row.style.cssText = "background:#fff; border-bottom:1px solid #eee; padding:5px 8px; font-size:11px; color:#000; display:flex; align-items:center; min-height:22px; box-sizing:border-box; cursor:pointer;";
            
            var txt = document.createElement('span');
            txt.style.cssText = "flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;";
            txt.innerText = savedText;
            
            row.onclick = function() {
                tx.value = savedText;
            };
            
            row.appendChild(txt);
            listCont.appendChild(row);
        }
    }

    // 8. テキストエリアの内容変更の度にローカルファイルを即時アップデート
    tx.oninput = function() {
        var currentKey = STORAGE_KEYS[activeDomain];
        localStorage.setItem(currentKey, tx.value);
        renderSavedQueries();
    };

    // クエリ保存ボタンのイベント
    document.getElementById('ai-save').onclick = function() {
        var currentKey = STORAGE_KEYS[activeDomain];
        localStorage.setItem(currentKey, tx.value);
        renderSavedQueries();
    };

    // クエリクリアボタンのイベント
    document.getElementById('ai-clear').onclick = function() {
        tx.value = '';
        var currentKey = STORAGE_KEYS[activeDomain];
        localStorage.setItem(currentKey, '');
        renderSavedQueries();
    };

    // 閉じるボタンのイベント
    document.getElementById('close-x').onclick = closePanel;

    // AI Search送信ボタンのダミーイベント（11のプロンプト結合例）
    document.getElementById('ai-submit').onclick = function() {
        // 11. 送信用ヘッダーテキストを検索窓の文章の先頭に付与して送信文を構成
        var finalPromptToSend = aiHeaderPrompt + tx.value;
        console.log("Google AI Searchに送信するデータ:\n", finalPromptToSend);
        alert("AI Searchを起動します（コンソールを確認してください）");
    };

    document.getElementById('web-search').onclick = function() {
        if (!tx.value.trim()) return;
        window.open("https://google.com" + encodeURIComponent(tx.value));
    };

    // 初期起動処理
    renderToggles();
    renderSavedQueries();

})();
