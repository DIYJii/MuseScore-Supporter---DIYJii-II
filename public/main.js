(function() {
    var PANEL_WIDTH = '380px';
    var PANEL_ID = 'my-ai-sidebar';
    var STORAGE_KEY = 'musescore_saved_queries';
    var DOMAIN_KEY = 'musescore_selected_domains';
    var TEMP_TEXT_KEY = 'ai-sidebar-temp-text';

    var domains = [
        { id: 'com', label: 'MuseScore.com', url: 'musescore.com' },
        { id: 'org', label: 'MuseScore.org', url: 'musescore.org' },
        { id: 'hub', label: 'MuseHub.com', url: 'musehub.com' },
        { id: 'aud', label: 'Audacityteam.org', url: 'audacityteam.org' },
        { id: 'audio', label: 'Audio.com', url: 'audio.com' }
    ];

    if (document.getElementById(PANEL_ID)) { closePanel(); return; }

    function closePanel() {
        document.documentElement.style.width = '';
        var p = document.getElementById(PANEL_ID);
        if (p) p.remove();
    }

    function getCleanContext() {
        var clone = document.body.cloneNode(true);
        var ignore = clone.querySelectorAll('script, style, noscript, iframe, nav, footer, .ads, [class*="ad-"]');
        ignore.forEach(el => el.remove());
        
        var mainArea = clone.querySelector('article, main, .forum-post-content, .node-content') || clone;
        var text = mainArea.innerText;

        // Forum等のUser IDと日付を消去 (例: "by Username", "on April 12, 2024", "12:34")
        text = text.replace(/\bby\s+\S+/gi, '')
                   .replace(/\bon\s+\w+\s+\d{1,2},?\s+\d{4}/gi, '')
                   .replace(/\b\d{1,2}:\d{2}(:\d{2})?(\s?[APM]{2})?/gi, '');

        return text.replace(/\s+/g, ' ').trim().substring(0, 5000);
    }

    var initApp = function() {
        document.documentElement.style.width = "calc(100% - " + PANEL_WIDTH + ")";
        document.documentElement.style.transition = "width 0.3s ease";

        var panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.style.cssText = "position:fixed; top:0; right:0; width:" + PANEL_WIDTH + "; height:100%; background:#fcfcfc; border-left:1px solid #dee2e6; z-index:2147483647; font-family:sans-serif; display:flex; flex-direction:column; box-shadow:-5px 0 15px rgba(0,0,0,0.05);";

        var purpleOn = "background:#6a42c2; color:white;";
        var purpleOff = "background:#d1c4e9; color:white;";
        var btnBase = "cursor:pointer; border:none; border-radius:4px; font-weight:bold; transition:all 0.2s;";

        panel.innerHTML = `
            <div style="background:#fff; padding:8px 15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; height:45px; box-sizing:border-box;">
                <span style="font-weight:900; color:#6a42c2; font-size:20px; letter-spacing:-0.5px;">MuseScore Supporter</span>
                <button id="close-x" style="cursor:pointer; border:none; background:none; font-size:24px; color:#ccc;">&times;</button>
            </div>
            <div style="padding:10px; background:#fff; border-bottom:1px solid #eee; display:flex; flex-direction:column; gap:6px;">
                <div style="display:flex; gap:4px;" id="row1"></div>
                <div style="display:flex; gap:4px;" id="row2"></div>
            </div>
            <div style="padding:15px; display:flex; flex-direction:column; gap:10px; flex-shrink:0;">
                <textarea id="ai-query" placeholder="Type your query. Use '#context' to inject page text." style="width:100%; height:180px; border:1px solid #ced4da; border-radius:6px; padding:12px; font-size:13px; resize:none; box-sizing:border-box;"></textarea>
                <div style="display:flex; gap:10px;">
                    <button id="web-search" style="${btnBase} flex:1; height:36px; ${purpleOn}">Search</button>
                    <button id="ai-submit" style="${btnBase} flex:1; height:36px; ${purpleOn}">AI Search</button>
                </div>
                <div style="display:flex; gap:10px;">
                    <button id="ai-clear" style="${btnBase} flex:1; height:28px; background:#e64a19; color:white; font-size:11px;">Clear</button>
                    <button id="ai-save" style="${btnBase} flex:1; height:28px; background:#ffa000; color:white; font-size:11px;">Save Query</button>
                </div>
            </div>
            <div style="flex-grow:1; overflow-y:auto; padding:5px;" id="query-list"></div>`;

        document.body.appendChild(panel);

        // トグルボタン生成
        var selected = JSON.parse(localStorage.getItem(DOMAIN_KEY) || '{"all":true}');
        function renderToggles() {
            var r1 = document.getElementById('row1'), r2 = document.getElementById('row2');
            r1.innerHTML = ''; r2.innerHTML = '';
            
            var createBtn = (id, label, row) => {
                var btn = document.createElement('button');
                btn.innerText = label;
                btn.style.cssText = btnBase + "flex:1; height:30px; font-size:" + (label.length > 12 ? '10px' : '11px') + "; " + (selected[id] ? purpleOn : purpleOff);
                btn.onclick = () => toggleDomain(id);
                row.appendChild(btn);
            };

            domains.slice(0,3).forEach(d => createBtn(d.id, d.label, r1));
            domains.slice(3).forEach(d => createBtn(d.id, d.label, r2));
            createBtn('all', 'ALL', r2);
        }

        function toggleDomain(id) {
            if (id === 'all') {
                selected = { all: true };
            } else {
                delete selected.all;
                if (selected[id] && Object.keys(selected).length === 1) return; // 最後の一つは消せない
                selected[id] = !selected[id];
                if (!selected[id]) delete selected[id];
                if (Object.keys(selected).length === 0) selected.all = true;
            }
            localStorage.setItem(DOMAIN_KEY, JSON.stringify(selected));
            renderToggles();
        }

        function getSiteFilter() {
            if (selected.all) return "site:musescore.com OR site:musescore.org OR site:musehub.com OR site:audacityteam.org OR site:audio.com";
            return domains.filter(d => selected[d.id]).map(d => "site:" + d.url).join(" OR ");
        }

        renderToggles();

        // Search ボタン
        document.getElementById('web-search').onclick = function() {
            var q = tx.value.trim();
            if(!q) return alert('Enter query');
            window.open("www.https://google.com" + "/search?q=" + encodeURIComponent(getSiteFilter() + " " + q), '_blank');
        };

        // AI Search ボタン
        var tx = document.getElementById('ai-query');
        document.getElementById('ai-submit').onclick = function() {
            var btn = this;
            var q = tx.value.trim();
            if(!q) return alert('Enter query');
            
            btn.disabled = true; btn.innerText = "Processing...";
            fetch('https://muse-score-supporter-diy-jii-ii.vercel.app/prompt.bin?' + Date.now()).then(r => r.text()).then(obfuscated => {
                var processed = q.replace(/#context/gi, "\n\n[CONTEXT]\n" + getCleanContext() + "\n");
                var filter = getSiteFilter();
                var finalQuery = filter + " " + processed + "\n\n" + Array(50).join(".") + 
                                 "\n[STRICT_RULE] Search only within the domains specified in the site: filter. Do not use information from other websites.\n" + obfuscated;
                window.open("https://google.com" + "/search?q=" + encodeURIComponent(finalQuery) + "&udm=50&aep=11", '_blank');
                btn.disabled = false; btn.innerText = "AI Search";
            });
        };

        // Clear, Save, Close, RenderList などの基本機能
        document.getElementById('ai-clear').onclick = () => { tx.value = ''; sessionStorage.removeItem(TEMP_TEXT_KEY); };
        document.getElementById('ai-save').onclick = () => {
            var val = tx.value.trim(); if(!val) return;
            var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            saved.push(val); localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
            renderList();
        };
        document.getElementById('close-x').onclick = closePanel;
        var renderList = function() {
            var list = document.getElementById('query-list');
            var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            list.innerHTML = '';
            saved.forEach((text, i) => {
                var item = document.createElement('div');
                item.style.cssText = "padding:8px; margin:4px; background:#fff; border:1px solid #eee; border-radius:4px; font-size:12px; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;";
                item.textContent = text;
                item.onclick = (e) => {
                    if (e.ctrlKey) { saved.splice(i, 1); localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); renderList(); }
                    else { tx.value = text; }
                };
                list.appendChild(item);
            });
        };
        renderList();
        if (sessionStorage.getItem(TEMP_TEXT_KEY)) tx.value = sessionStorage.getItem(TEMP_TEXT_KEY);
        tx.oninput = () => sessionStorage.setItem(TEMP_TEXT_KEY, tx.value);
    };

    initApp();
})();
