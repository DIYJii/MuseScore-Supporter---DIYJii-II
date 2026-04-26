(function() {
    const existingLoader = document.getElementById('ai-assistant-loader');
    if (existingLoader && !document.getElementById('my-ai-sidebar')) {
        existingLoader.remove(); 
    }
(function() {
    var PANEL_WIDTH = '380px';
    var PANEL_ID = 'my-ai-sidebar';
    var STORAGE_KEY = 'musescore_saved_queries';
    var SESSION_FLAG = 'ai-sidebar-active';
    var TEMP_TEXT_KEY = 'ai-sidebar-temp-text';

    if (document.getElementById(PANEL_ID)) {
        closePanel();
        return;
    }

    function closePanel() {
        document.documentElement.style.width = '';
        document.documentElement.style.overflowX = '';
        var p = document.getElementById(PANEL_ID);
        if (p) p.remove();
        sessionStorage.removeItem(SESSION_FLAG);
    }

    var initApp = function() {
        if (document.getElementById(PANEL_ID)) return;

        document.documentElement.style.width = "calc(100% - " + PANEL_WIDTH + ")";
        document.documentElement.style.overflowX = "hidden";
        document.documentElement.style.transition = "width 0.3s ease";

        var panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.style.cssText = "position:fixed; top:0; right:0; width:" + PANEL_WIDTH + "; height:100%; background:#fcfcfc; border-left:1px solid #dee2e6; box-shadow:-5px 0 15px rgba(0,0,0,0.05); z-index:2147483647; font-family:sans-serif; display:flex; flex-direction:column;";

        panel.innerHTML = `
            <div style="background:#fff; padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:700; color:#2e68c0; font-size:15px;">MuseScore Helper</span>
                <button id="close-x" style="cursor:pointer; border:none; background:none; font-size:22px; color:#ccc;">&times;</button>
            </div>
            <div style="padding:20px; display:flex; flex-direction:column; gap:12px; background:#fff; border-bottom:1px solid #eee;">
                <textarea id="ai-query" placeholder="Ask about MuseScore..." style="width:100%; height:120px; border:1px solid #ced4da; border-radius:6px; padding:12px; font-size:14px; outline:none; resize:none; box-sizing:border-box; color:#495057;"></textarea>
                <button id="ai-submit" style="width:100%; padding:12px; background:#2e68c0; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">Launch AI Search</button>
                <div style="display:flex; gap:10px;">
                    <button id="ai-clear" style="flex:1; height:36px; background:#ffede5; color:#e65100; border:1px solid #ffccbc; border-radius:6px; cursor:pointer; font-size:13px; font-weight:600;">Clear</button>
                    <button id="ai-save" style="flex:1; height:36px; background:#fff8e1; color:#ff8f00; border:1px solid #ffe082; border-radius:6px; cursor:pointer; font-size:13px; font-weight:600;">Save Query</button>
                </div>
            </div>
            <div style="background:#fcfcfc; flex-grow:1; overflow-y:auto; padding:5px;" id="query-list"></div>`;

        document.body.appendChild(panel);

        var tx = document.getElementById('ai-query');
        
        // Restore drafting text
        tx.value = sessionStorage.getItem(TEMP_TEXT_KEY) || '';
        tx.oninput = function() { sessionStorage.setItem(TEMP_TEXT_KEY, tx.value); };

        // AI Search Button Logic
        document.getElementById('ai-submit').onclick = function() {
            var q = tx.value.trim();
            if(q) {
                var url = 'https://www.google.com' + "/search?q=" + encodeURIComponent(q) + '&udm=50&aep=11';
                window.open(url, 'ai-search-window');
            }
        };

        document.getElementById('ai-clear').onclick = function() {
            tx.value = '';
            sessionStorage.removeItem(TEMP_TEXT_KEY);
        };

        document.getElementById('ai-save').onclick = function() {
            var val = tx.value.trim();
            if(!val) return;
            var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            saved.push(val);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
            renderList();
        };

        document.getElementById('close-x').onclick = closePanel;

        var renderList = function() {
            var list = document.getElementById('query-list');
            var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            list.innerHTML = '';
            saved.forEach(function(text, index) {
                var item = document.createElement('div');
                item.style.cssText = "padding:10px; margin:4px; background:#fff; border:1px solid #e9ecef; border-radius:6px; font-size:13px; cursor:pointer; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#495057;";
                item.textContent = text;
                item.onclick = function(e) {
                    if (e.ctrlKey) {
                        saved.splice(index, 1);
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
                        renderList();
                    } else {
                        tx.value = text;
                        sessionStorage.setItem(TEMP_TEXT_KEY, text);
                    }
                };
                list.appendChild(item);
            });
        };
        renderList();
    };

    // Initial Execution
    initApp();

    // Persist across navigation within domain
    setInterval(function() {
        if (sessionStorage.getItem(SESSION_FLAG) === 'true' && !document.getElementById(PANEL_ID)) {
            initApp();
        }
    }, 1500);
})();

    // --- ページ遷移（SPA/通常リロード両方）に対応するための追記 ---
(function() {
    var check = function() {
        if (sessionStorage.getItem('ai-sidebar-active') === 'true' && !document.getElementById('my-ai-sidebar')) {
            if (typeof initApp === 'function') {
                initApp();
            }
        }
    };
    // ページ内のリンククリック等によるURL変化を監視
    setInterval(check, 1000);
    // ページ読み込み完了時にも実行
    window.addEventListener('load', check);
})();
