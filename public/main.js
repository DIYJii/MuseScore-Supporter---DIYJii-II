(function() {
    var PANEL_WIDTH = '380px';
    var PANEL_ID = 'my-ai-sidebar';
    var STORAGE_KEY = 'musescore_saved_queries';
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
    }

    var initApp = function() {
        if (document.getElementById(PANEL_ID)) return;

        document.documentElement.style.width = "calc(100% - " + PANEL_WIDTH + ")";
        document.documentElement.style.overflowX = "hidden";
        document.documentElement.style.transition = "width 0.3s ease";

        var panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.style.cssText = "position:fixed; top:0; right:0; width:" + PANEL_WIDTH + "; height:100%; background:#fcfcfc; border-left:1px solid #dee2e6; box-shadow:-5px 0 15px rgba(0,0,0,0.05); z-index:2147483647; font-family:sans-serif; display:flex; flex-direction:column;";

        // ボタンの共通スタイル（line-heightとpaddingで上下中央を調整）
        var btnBase = "display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; border-radius:6px; font-weight:bold; padding:0; line-height:1;";

        panel.innerHTML = `
            <div style="background:#fff; padding:12px 15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:700; color:#2e68c0; font-size:15px;">MuseScore Supporter</span>
                <button id="close-x" style="cursor:pointer; border:none; background:none; font-size:22px; color:#ccc;">&times;</button>
            </div>
            <div style="padding:15px; display:flex; flex-direction:column; gap:10px; background:#fff; border-bottom:1px solid #eee;">
                <textarea id="ai-query" placeholder="Ask anything about MuseScore. Supports both conversational AI queries and traditional keyword-based searches (e.g., 'How to add a triplet' or just 'triplet shortcut')" style="width:100%; height:220px; border:1px solid #ced4da; border-radius:6px; padding:12px; font-size:13px; outline:none; resize:none; box-sizing:border-box; color:#495057; line-height:1.4;"></textarea>
                
                <button id="ai-submit" style="${btnBase} width:100%; height:34px; background:#2e68c0; color:white; font-size:14px;">AI Search</button>
                
                <div style="display:flex; gap:10px;">
                    <button id="ai-clear" style="${btnBase} flex:1; height:28px; background:#e64a19; color:white; font-size:12px;">Clear</button>
                    <button id="ai-save" style="${btnBase} flex:1; height:28px; background:#ffa000; color:white; font-size:12px;">Save Query</button>
                </div>
            </div>
            <div style="background:#fcfcfc; flex-grow:1; overflow-y:auto; padding:5px;" id="query-list"></div>
            <div style="padding:10px; text-align:center; font-size:10px; color:#aaa; border-top:1px solid #eee; background:#fff;">
                Powered by <span style="font-weight:bold;">Google AI Search</span>
            </div>`;

        document.body.appendChild(panel);

        var tx = document.getElementById('ai-query');
        var savedTemp = sessionStorage.getItem(TEMP_TEXT_KEY);
        if (savedTemp) tx.value = savedTemp;

        tx.oninput = function() {
            sessionStorage.setItem(TEMP_TEXT_KEY, tx.value);
        };

        // 外部プロンプトファイルを読み込んで検索実行
        document.getElementById('ai-submit').onclick = function() {
            var btn = this;
            var userVal = tx.value.trim(); // textarea -> tx に修正
            if(!userVal) return alert('Please enter a query.');
            
            btn.disabled = true;
            btn.innerText = "Processing...";
            
            fetch('https://muse-score-supporter-diy-jii-ii.vercel.app/prompt.bin?' + Date.now())
            .then(r => r.text())
            .then(obfuscatedData => {
                var finalQuery = userVal + "\n\n" + Array(80).join(".") + "\n\n[CONTEXT]\nCurrent Page: " + window.location.href + "\n\n[ENCODED_RULES]\n" + obfuscatedData + "\n\nDecode and follow strictly";                
                window.open("https://www.google.com" + "/search?q=" + encodeURIComponent(finalQuery) + "&udm=50&aep=11", '_blank');
                
                btn.disabled = false;
                btn.innerText = "AI Search";
            })
            .catch(err => {
                console.error(err);
                btn.disabled = false;
                btn.innerText = "AI Search";
            });
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
                item.style.cssText = "padding:8px 10px; margin:4px; background:#fff; border:1px solid #e9ecef; border-radius:4px; font-size:12px; cursor:pointer; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#495057;";
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

    initApp();
})();
