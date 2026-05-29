(function() {
    var PANEL_WIDTH = '380px';
    var PANEL_ID = 'my-ai-sidebar';
    // 6つの独立した保存ファイル用キーのベース
    var STORAGE_KEY_BASE = 'musescore_saved_queries_'; 
    var CURRENT_PROMPT_KEY = 'musescore_active_prompt';
    var MS_DARK_BLUE = '#172b4d'; 
    var MS_LIGHT_BLUE = '#eef2f7';
    var SEARCH_BLUE = '#0d47a1'; 
    var CLEAR_RED = '#d32f2f';  

    // 9. main load時に検出・保存する環境情報
    var detectedLanguage = navigator.language || 'en';
    var detectedSite = location.hostname || 'unknown';

    if (document.getElementById(PANEL_ID)) { closePanel(); return; }

    function closePanel() {
        document.documentElement.style.width = '';
        var p = document.getElementById(PANEL_ID);
        if (p) p.remove();
    }

    function getCleanContext() {
        var clone = document.body.cloneNode(true);
        // 1. 不要な要素（ボタンやメニュー等）を物理的に削除
        var ignore = clone.querySelectorAll('script, style, noscript, iframe, nav, footer, .ads, .user-nav, button, .post-actions, .moderation-menu, .flag-button');
        ignore.forEach(el => el.remove());
        
        var mainArea = clone.querySelector('article, main, .forum-post-content, .node-content') || clone;
        
        // 2. aタグ（リンク）の処理：画面に見えているテキストだけを救出する
        var links = mainArea.querySelectorAll('a');
        links.forEach(link => {
            // offsetParentがnull、またはdisplayがnoneの隠し要素は無視して削除
            if (link.offsetWidth > 0 || link.offsetHeight > 0) {
                var textNode = document.createTextNode(link.innerText);
                link.parentNode.replaceChild(textNode, link);
            } else {
                link.remove(); // 隠れている「mark as spam」等はここで消える
            }
        });

        return mainArea.innerText.replace(/\s+/g, ' ').trim().substring(0, 5000);
    }

    // 2. 新しいPROMPTリスト（6つの固定カテゴリ）
    var newPrompts = [
        'General', 'Subscriptions', 'Web Operations', 'Notations', 'Scores', 'TbD'
    ];

    // 初期起動時、または過去に保存されたアクティブなドメインを取得（デフォルトはGeneral）
    var activePrompt = localStorage.getItem(CURRENT_PROMPT_KEY) || 'General';

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
        <div id="prompt-area" style="padding:2px 15px; background:#fff; border-bottom:1px solid #eee; flex-shrink:0;">
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:2px;" id="row-sites"></div>
        </div>
        <div id="top-area" style="padding:5px 15px; display:flex; flex-direction:column; gap:6px; flex:1; min-height:0; background:rgba(232, 245, 233, 0.4);">
            <textarea id="ai-query" placeholder="-Type your query for AI Search.
-Use '#context' to refer to the text on the left.
-To search within a specific site: Site:https://
-Enter keywords for a standard search." style="width:100%; flex:1; border:2px solid #bbb; border-radius:6px; padding:8px; font-size:13px; color:#000; resize:none; box-sizing:border-box; outline:none; background:#fff; overflow-y:auto;"></textarea>
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

    // 5 & 8. Vercel上の.binファイルを模したPrompt存在チェック関数 (非同期想定)
    // 実環境のAPI仕様に合わせて適宜fetch等の通信に書き換えてください。
    async function checkVercelPromptExists(promptName) {
        try {
            // 仮として、常に存在する（true）と仮定。検証する場合は実際のURLへfetch等を行う
            let res = await fetch('https://muse-score-supporter-diy-jii-ii.vercel.app/${promptName}.bin`, { method: 'HEAD' });
            return res.ok;
            return true; 
        } catch(e) {
            return false;
        }
    }

    // 3 & 7. ボタンのトグル描画と保存内容の連動ロード
    async function renderToggles() {
        var container = document.getElementById('row-sites');
        container.innerHTML = '';
        
        for (let prompt of newPrompts) {
            var btn = document.createElement('button');
            btn.innerText = prompt;
            var isOn = (activePrompt === prompt);
            
            btn.style.cssText = btnBase + `height:28px; font-size:11px; margin:1px 0; background:${isOn ? MS_DARK_BLUE : MS_LIGHT_BLUE}; color:${isOn ? '#fff' : MS_DARK_BLUE}; border:1px solid ${MS_DARK_BLUE};`;
            
            // クリック時の排他トグル処理
            btn.onclick = async (e) => {
                var targetPrompt = e.target.innerText;
                if (activePrompt === targetPrompt) return; // 既にONなら何もしない

                // 8. PromptがVercelにアップされているかチェック
                var exists = await checkVercelPromptExists(targetPrompt);
                if (!exists) {
                    alert("Prompt to be defined");
                    return; // ボタンは切り替わらない
                }

                // チェック通過時のみONを切り替え
                activePrompt = targetPrompt;
                localStorage.setItem(CURRENT_PROMPT_KEY, activePrompt);
                
                renderToggles();
                loadQueriesForActivePrompt(); // 7. オンになったボタンに合わせてロード
            };
            container.appendChild(btn);
        }
    }
    // 7. オンになっているボタン（Prompt）の保存キーを取得するヘルパー
    function getActiveStorageKey() {
        return STORAGE_KEY_BASE + activePrompt;
    }

    // 6 & 7. 連動したクエリ履歴のロードと描画処理
    function loadQueriesForActivePrompt() {
        var listCont = document.getElementById('query-list');
        listCont.innerHTML = '';
        
        // 6. 選択されているドメイン名に応じた個別の保存ファイルから読み込み
        var saved = JSON.parse(localStorage.getItem(getActiveStorageKey()) || '[]');
        
        saved.forEach((q, idx) => {
            var row = document.createElement('div');
            row.draggable = true;
            row.style.cssText = "background:#fff; border-bottom:1px solid #eee; padding:2px 8px; font-size:11px; color:#000; display:flex; align-items:center; height:22px; box-sizing:border-box; position:relative; cursor:grab;";
            
            var txt = document.createElement('span');
            txt.style.cssText = "flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer;";
            txt.innerText = "- " + q.replace(/\n/g, ' ');
            txt.onclick = () => { tx.value = q; };
            
            var delBtn = document.createElement('button');
            delBtn.innerHTML = '&times;';
            delBtn.style.cssText = "background:none; color:#aaa; border:none; cursor:pointer; font-size:16px; padding:0 3px; line-height:1;";
            delBtn.onclick = (e) => {
                e.stopPropagation();
                if (document.getElementById('confirm-pop')) return;
                var pop = document.createElement('div');
                pop.id = 'confirm-pop';
                pop.style.cssText = `position:absolute; right:30px; background:#455a64; color:#fff; padding:2px 8px; border-radius:4px; font-size:10px; display:flex; gap:6px; align-items:center; z-index:10;`;
                pop.innerHTML = `<span>Delete?</span><b id="del-yes" style="cursor:pointer; color:#ff8a65;">YES</b><b id="del-no" style="cursor:pointer;">NO</b><div style="position:absolute; right:-6px; top:6px; border-top:5px solid transparent; border-bottom:5px solid transparent; border-left:6px solid #455a64;"></div>`;
                
                pop.querySelector('#del-yes').onclick = () => { 
                    saved.splice(idx, 1); 
                    localStorage.setItem(getActiveStorageKey(), JSON.stringify(saved)); 
                    loadQueriesForActivePrompt(); 
                };
                pop.querySelector('#del-no').onclick = () => pop.remove();
                row.appendChild(pop);
            };
            
            row.ondragstart = (e) => { e.dataTransfer.setData('text/plain', idx); row.style.opacity = '0.5'; };
            row.ondragend = () => { row.style.opacity = '1'; };
            row.ondragover = (e) => { e.preventDefault(); };
            row.ondrop = (e) => {
               e.preventDefault();
               var fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
               var toIdx = idx;
               if (fromIdx === toIdx) return;
               var item = saved.splice(fromIdx, 1)[0]; 
               saved.splice(toIdx, 0, item);
               localStorage.setItem(getActiveStorageKey(), JSON.stringify(saved));
               loadQueriesForActivePrompt();
            };

            row.appendChild(txt);
            row.appendChild(delBtn);
            listCont.appendChild(row);
        });
    }

    // 初期起動時のロード実行
    renderToggles();
    loadQueriesForActivePrompt();
    
    // 6. 各ドメインに紐づいた保存ボタンの処理
    document.getElementById('ai-save').onclick = () => {
        var q = tx.value.trim();
        if (!q) return;
        var currentKey = getActiveStorageKey();
        var saved = JSON.parse(localStorage.getItem(currentKey) || '[]');
        if (!saved.includes(q)) { 
            saved.unshift(q); 
            localStorage.setItem(currentKey, JSON.stringify(saved)); 
            loadQueriesForActivePrompt(); 
        }
    };
    
    document.getElementById('ai-clear').onclick = () => { tx.value = ''; };
    document.getElementById('close-x').onclick = closePanel;

    // 5. 新しいPrompt仕様に合わせたVercelからの.binファイル取得
    async function getPromptBin() {
        try {
            // 現在アクティブなドメイン名（General等）と同名の.binファイルを取得
            const response = await fetch(`https://vercel.app{activePrompt}.bin`);
            if (!response.ok) throw new Error('Network response was not ok');
            const text = await response.text();
            return text.trim();
        } catch (error) {
            console.error(`Failed to fetch ${activePrompt}.bin:`, error);
            return ""; 
        }
    }

    // AI Search送信ボタンのメイン処理
    document.getElementById('ai-submit').onclick = async () => {
        var raw = tx.value.trim();
        if (!raw) return;
        
        var hasContext = /[#＃][Cc][Oo][Nn][Tt][Ee][Xx][Tt]/.test(raw);
        var cleanBody = raw.replace(/[#＃][Cc][Oo][Nn][Tt][Ee][Xx][Tt]/gi, "").trim();

        // ユーザー入力内のsite指定行のみを抽出処理
        var siteFilter = "";
        var remainingLines = [];
        cleanBody.split('\n').forEach(line => {
            if (line.toLowerCase().startsWith('site:https://')) {
                var url = line.substring(13).trim();
                if (url) siteFilter += "site:" + url + " ";
            } else { remainingLines.push(line); }
        });

        var finalBody = remainingLines.join(' ').trim();
        var promptBin = await getPromptBin();
        
        // 9 & 10. ロード時に保存した言語とサイト情報を指定形式でPromptの頭に添付
        var envHeader = `\\Language = ${detectedLanguage}; \\CurrentSite = ${detectedSite}; `;
        
        var finalQ = "[QUERY:]" + finalBody;
        if (hasContext) { finalQ += " [CONTEXT:] " + getCleanContext(); }
        // 4 & 10. 以前のPrompt処理は排除し、環境ヘッダーを先頭に付与してPromptを結合
        finalQ += " [INSTRUCTIONS TO BE FOLLOWED:] " + envHeader + promptBin;

        // 4. 今迄のPromptに関するsiteフィルター（getSiteFilter）の結合処理は削除
        var full = (siteFilter ? siteFilter + " " : "") + finalQ;

        // 文字数制限チェック（エンコード後の長さで判定）
        var encodedFull = encodeURIComponent(full);
        var urlLimit = 7500; 

        if (encodedFull.length > urlLimit) {
            var msg = "The query is too long for automatic submission.\n\n" +
                      "Would you like to:\n" +
                      "• [OK] -> Copy everything and Paste manually (Ctrl+V) into Google.\n" +
                      "• [Cancel] -> Stay here and shorten your query or context.";
            
            if (confirm(msg)) {
                navigator.clipboard.writeText(full).then(() => {
                    const f = document.createElement('form');
                    f.method = 'GET';
                    f.action = 'https://www.google.com/search';
                    f.target = '_blank';
                    const p = { q: 'AI Search', udm: '50', aep: '11', sourceid: 'chrome', source: 'chrome.crn.rb' };
                    for (let k in p) {
                        let i = document.createElement('input');
                        i.type = 'hidden'; i.name = k; i.value = p[k];
                        f.appendChild(i);
                    }
                    document.body.appendChild(f);
                    f.submit();
                    f.remove();
                });
            }
        } else {
            const f = document.createElement('form');
            f.method = 'GET';
            f.action = 'https://www.google.com/search';
            f.target = '_blank';
            const p = { q: full, udm: '50', aep: '11', sourceid: 'chrome', source: 'chrome.crn.rb' };
            for (let k in p) {
                let i = document.createElement('input');
                i.type = 'hidden'; i.name = k; i.value = p[k];
                f.appendChild(i);
            }
            document.body.appendChild(f);
            f.submit();
            f.remove();
        }
    };

    // キーワード検索ボタンの処理
    document.getElementById('web-search').onclick = () => {
        var raw = tx.value.trim().replace(/[#＃][Cc][Oo][Nn][Tt][Ee][Xx][Tt]/gi, "");
        if (!raw) return;
        // 4. こちらのPromptフィルター（getSiteFilter）も同様に完全削除
        window.open("https://www.google.com" + "/search?q=" + encodeURIComponent(raw), '_blank');
    };
})();
