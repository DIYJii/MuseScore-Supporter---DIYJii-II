(function() {
    var PANEL_WIDTH_VAL = 380;
    var PANEL_WIDTH = PANEL_WIDTH_VAL + 'px';
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
        sessionStorage.removeItem(TEMP_TEXT_KEY);
    }

    var initApp = function() {
        document.documentElement.style.width = "calc(100% - " + PANEL_WIDTH + ")";
        document.documentElement.style.overflowX = "hidden";
        document.documentElement.style.transition = "width 0.3s ease";

        var panel = document.createElement('div');
        panel.id = PANEL_ID;
        // 背景をMuseScore風の非常に薄いグレーに設定
        panel.style.cssText = "position:fixed; top:0; right:0; width:" + PANEL_WIDTH + "; height:100%; background:#fcfcfc; border-left:1px solid #dee2e6; box-shadow:-5px 0 15px rgba(0,0,0,0.05); z-index:2147483647; font-family:'Open Sans',Segoe UI,Helvetica,Arial,sans-serif; display:flex; flex-direction:column;";

        panel.innerHTML = `
            <div style="background:#fff; padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:700; color:#2e68c0; font-size:15px; letter-spacing:0.5px;">MuseScore Helper</span>
                <button id="close-x" style="cursor:pointer; border:none; background:none; font-size:22px; color:#ccc; line-height:1;">&times;</button>
            </div>
            <div style="padding:20px; display:flex; flex-direction:column; gap:12px; border-bottom:1px solid #eee; background:#fff;">
                <textarea id="ai-query" placeholder="How can I help you with MuseScore?" style="width:100%; height:120px; border:1px solid #ced4da; border-radius:6px; padding:12px; font-size:14px; outline:none; resize:none; box-sizing:border-box; line-height:1.5; color:#495057;"></textarea>
                <button id="ai-submit" style="width:100%; padding:12px; background:#2e68c0; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; font-size:14px; transition:background 0.2s;">Launch AI Search</button>
                <div style="display:flex; gap:10px;">
                    <!-- Clear: 暖色（オレンジ系） -->
                    <button id="ai-clear" style="flex:1; height:36px; background:#ffede5; color:#e65100; border:1px solid #ffccbc; border-radius:6px; cursor:pointer; font-size:13px; font-weight:600;">Clear</button>
                    <!-- Save: 暖色（アンバー系） -->
                    <button id="ai-save" style="flex:1; height:36px; background:#fff8e1; color:#ff8f00; border:1px solid #ffe082; border-radius:6px; cursor:pointer; font-size:13px; font-weight:600;">Save Query</button>
                </div>
            </div>
            <div style="background:#fcfcfc; flex-grow:1; display:flex; flex-direction:column; overflow:hidden; position:relative;">
                <div style="padding:10px 15px; font-size:11px; color:#6c757d; font-weight:700; text-transform:uppercase; letter-spacing:1px; background:#f1f3f5;">Saved Queries</div>
                <div id="query-list" style="flex-grow:1; overflow-y:auto; padding:5px;"></div>
                
                <div id="mini-confirm" style="display:none; position:absolute; left:50%; transform:translateX(-50%); background:#fff; border:1px solid #2e68c0; box-shadow:0 4px 15px rgba(0,0,0,0.1); padding:10px; border-radius:8px; z-index:10; text-align:center; min-width:120px;">
                    <div style="position:absolute; top:-6px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-bottom:6px solid #2e68c0;"></div>
                    <div style="font-size:12px; margin-bottom:8px; font-weight:bold; color:#333;">Delete this query?</div>
                    <div style="display:flex; gap:8px; justify-content:center;">
                        <button id="confirm-yes" style="padding:4px 12px; font-size:11px; background:#d93025; color:white; border:none; border-radius:4px; cursor:pointer;">Yes</button>
                        <button id="confirm-no" style="padding:4px 12px; font-size:11px; background:#f1f3f4; color:#5f6368; border:1px solid #dadce0; border-radius:4px; cursor:pointer;">No</button>
                    </div>
                </div>
            </div>`;

        document.body.appendChild(panel);

        const listContainer = document.getElementById('query-list');
        const textarea = document.getElementById('ai-query');
        const miniConfirm = document.getElementById('mini-confirm');
        let deleteIdx = null;

        // 一時保存テキストの復元
        const savedTemp = sessionStorage.getItem(TEMP_TEXT_KEY);
        if (savedTemp) textarea.value = savedTemp;

        // 入力中の自動保存
        textarea.addEventListener('input', function() {
            sessionStorage.setItem(TEMP_TEXT_KEY, textarea.value);
        });

        const renderList = () => {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            listContainer.innerHTML = '';
            saved.forEach((text, index) => {
                const item = document.createElement('div');
                item.draggable = true;
                item.style.cssText = "padding:10px 12px; margin:4px; background:#fff; border:1px solid #e9ecef; border-radius:6px; font-size:13px; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; transition:all 0.2s; color:#495057;";
                item.textContent = text;
                item.title = text;

                item.onmouseover = () => { item.style.borderColor = '#2e68c0'; item.style.background = '#f8f9fa'; };
                item.onmouseout = () => { item.style.borderColor = '#e9ecef'; item.style.background = '#fff'; };

                item.onclick = (e) => {
                    if (e.ctrlKey) {
                        deleteIdx = index;
                        const itemRect = item.offsetTop;
                        const scrollPos = listContainer.scrollTop;
                        miniConfirm.style.top = (itemRect - scrollPos + 35) + "px"; 
                        miniConfirm.style.display = 'block';
                    } else {
                        miniConfirm.style.display = 'none';
                        textarea.value = text;
                        sessionStorage.setItem(TEMP_TEXT_KEY, text);
                    }
                };

                // ... (ドラッグ＆ドロップ処理は以前と同じ) ...
                item.ondragstart = (e) => { e.dataTransfer.setData('text/plain', index); item.style.opacity = '0.4'; };
                item.ondragend = () => { item.style.opacity = '1'; };
                item.ondragover = (e) => e.preventDefault();
                item.ondrop = (e) => {
                    e.preventDefault();
                    const fromIndex = e.dataTransfer.getData('text/plain');
                    const updated = JSON.parse(localStorage.getItem(STORAGE_KEY));
                    const movedItem = updated.splice(fromIndex, 1);
                    updated.splice(index, 0, movedItem[0]);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                    renderList();
                };
                listContainer.appendChild(item);
            });
        };

        // 検索実行（タブ使い回し設定）
        document.getElementById('ai-submit').onclick = () => {
            const q = textarea.value.trim();
            if (q) window.open('https://www.google.com' + '/search?q=' + encodeURIComponent(q), 'ai-search-window');
        };

        document.getElementById('ai-save').onclick = () => {
            const val = textarea.value.trim();
            if (!val) return;
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            saved.push(val);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
            renderList();
        };

        document.getElementById('ai-clear').onclick = () => { 
            textarea.value = ''; 
            sessionStorage.removeItem(TEMP_TEXT_KEY);
            miniConfirm.style.display = 'none';
        };

        document.getElementById('confirm-yes').onclick = () => {
            const updated = JSON.parse(localStorage.getItem(STORAGE_KEY));
            updated.splice(deleteIdx, 1);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            miniConfirm.style.display = 'none';
            renderList();
        };

        document.getElementById('confirm-no').onclick = () => { miniConfirm.style.display = 'none'; };
        document.getElementById('close-x').onclick = closePanel;

        renderList();
    };

    initApp();

    // ページ遷移後の自動復元
    if (sessionStorage.getItem(SESSION_FLAG) === 'true') {
        window.addEventListener('load', function() {
            const target = ['musescore.com', 'musescore.org', 'musehub.com', 'audacityteam.org', 'audio.com'];
            if (target.some(p => window.location.href.includes(p))) {
                if (!document.getElementById(PANEL_ID)) initApp();
            }
        });
    }
})();
