(function() {
    var PANEL_WIDTH = '380px';
    var PANEL_ID = 'my-ai-sidebar';
    var STORAGE_KEY = 'musescore_saved_queries';
    var DOMAIN_KEY = 'musescore_selected_domains';
    var MS_DARK_BLUE = '#172b4d'; 
    var MS_LIGHT_BLUE = '#eef2f7';
    var SEARCH_BLUE = '#0d47a1'; // より濃い紺
    var CLEAR_RED = '#d32f2f';   // 以前の赤

    if (document.getElementById(PANEL_ID)) { closePanel(); return; }

    function closePanel() {
        document.documentElement.style.width = '';
        var p = document.getElementById(PANEL_ID);
        if (p) p.remove();
    }

    function getCleanContext() {
        var clone = document.body.cloneNode(true);
        var ignore = clone.querySelectorAll('script, style, noscript, iframe, nav, footer, .ads, .user-nav');
        ignore.forEach(el => el.remove());
        var mainArea = clone.querySelector('article, main, .forum-post-content, .node-content') || clone;
        return mainArea.innerText.replace(/\s+/g, ' ').trim().substring(0, 5000);
    }

    var domains = [
        { id: 'com', label: 'MuseScore.com', url: 'musescore.com' },
        { id: 'org', label: 'MuseScore.org', url: 'musescore.org' },
        { id: 'hub', label: 'MuseHub.com', url: 'musehub.com' },
        { id: 'aud', label: 'Audacityteam', url: 'audacityteam.org' },
        { id: 'audio', label: 'Audio.com', url: 'audio.com' }
    ];

    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.cssText = `position:fixed; top:0; right:0; width:${PANEL_WIDTH}; height:100%; background:#fcfcfc; border-left:1px solid #ccc; z-index:2147483647; font-family:sans-serif; display:flex; flex-direction:column; box-shadow:-5px 0 15px rgba(0,0,0,0.1);`;

    var btnBase = "display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; border-radius:4px; font-weight:bold; color:white; box-sizing:border-box;";

    panel.innerHTML = `
        <div style="background:#fff; padding:5px 15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; height:40px; flex-shrink:0;">
            <span style="font-weight:900; color:${MS_DARK_BLUE}; font-size:22px;">MuseScore Supporter</span>
            <button id="close-x" style="cursor:pointer; border:none; background:none; font-size:28px; color:#aaa;">&times;</button>
        </div>
        <div style="padding:2px 15px; background:#fff; border-bottom:1px solid #eee; flex-shrink:0;">
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:2px;" id="row-sites"></div>
        </div>
        <div style="padding:4px 15px 10px 15px; display:flex; flex-direction:column; gap:0px; flex-shrink:0; background:rgba(232, 245, 233, 0.4);">
            <textarea id="ai-query" placeholder="Type your query for AI Search.\\nUse '#context' to inject page text.\\nSite:URL to limit search." style="width:100%; height:160px; border:2px solid #bbb; border-radius:6px 6px 0 0; padding:8px; font-size:13px; color:#111; resize:none; box-sizing:border-box; outline:none; background:#fff;"></textarea>
            <div style="display:flex; gap:2px; margin-top:-1px;">
                <button id="ai-submit" style="${btnBase} background:${SEARCH_BLUE}; flex:1; height:38px; font-size:13px; border-radius:0 0 0 6px;">AI Search</button>
                <button id="web-search" style="${btnBase} background:${SEARCH_BLUE}; flex:1; height:38px; font-size:13px; border-radius:0 0 6px 0;">Key Words Search</button>
            </div>
            <div style="display:flex; gap:8px; margin-top:6px;">
                <button id="ai-save" style="${btnBase} background:#ef6c00; flex:1; height:32px; font-size:12px;">Save Query</button>
                <button id="ai-clear" style="${btnBase} background:${CLEAR_RED}; flex:1; height:32px; font-size:12px;">Clear</button>
            </div>
        </div>
        <div style="flex-grow:1; overflow-y:auto; padding:2px 15px; background:rgba(232, 245, 233, 0.2);" id="query-list"></div>
        <div style="padding:4px; text-align:center; font-size:10px; color:#888; background:#fff; border-top:1px solid #eee;">Powered by Google AI Search</div>`;

    document.body.appendChild(panel);
    document.documentElement.style.width = `calc(100% - ${PANEL_WIDTH})`;

    var tx = document.getElementById('ai-query');
    var selected = JSON.parse(localStorage.getItem(DOMAIN_KEY) || '{"all":true}');

    function renderToggles() {
        var container = document.getElementById('row-sites');
        container.innerHTML = '';
        var list = [...domains, {id:'all', label:'ALL'}];
        list.forEach(d => {
            var btn = document.createElement('button');
            btn.innerText = d.label;
            var isOn = selected[d.id];
            btn.style.cssText = btnBase + `height:28px; font-size:11px; margin:1px 0; background:${isOn ? MS_DARK_BLUE : MS_LIGHT_BLUE}; color:${isOn ? '#fff' : MS_DARK_BLUE}; border:1px solid ${MS_DARK_BLUE};`;
            btn.onclick = () => {
                if (d.id === 'all') { selected = { all: true }; } 
                else {
                    delete selected.all;
                    selected[d.id] = !selected[d.id];
                    if (!selected[d.id]) delete selected[d.id];
                    if (Object.keys(selected).length === 0) selected.all = true;
                }
                localStorage.setItem(DOMAIN_KEY, JSON.stringify(selected));
                renderToggles();
            };
            container.appendChild(btn);
        });
    }
    renderToggles();

    function getSiteFilter() {
        if (selected.all) return "site:musescore.com OR site:musescore.org OR site:musehub.com OR site:audacityteam.org OR site:audio.com";
        return domains.filter(d => selected[d.id]).map(d => "site:" + d.url).join(" OR ");
    }

    function renderSavedQueries() {
        var listCont = document.getElementById('query-list');
        listCont.innerHTML = '';
        var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        saved.forEach((q, idx) => {
            var row = document.createElement('div');
            row.draggable = true;
            row.style.cssText = "background:#fff; border-bottom:1px solid #eee; padding:3px 5px; cursor:grab; font-size:12px; color:#333; display:flex; align-items:center; height:24px; position:relative; overflow:visible;";
            
            var txt = document.createElement('span');
            txt.style.cssText = "flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer;";
            txt.innerText = q;
            txt.onclick = () => { tx.value = q; };

            var delBtn = document.createElement('button');
            delBtn.innerHTML = '&times;';
            delBtn.style.cssText = "background:none; color:#ccc; border:none; cursor:pointer; font-size:16px; padding:0 5px;";
            
            // カスタム削除確認の嘴付きポップアップ
            delBtn.onclick = (e) => {
                e.stopPropagation();
                if (document.getElementById('confirm-pop')) return;
                var pop = document.createElement('div');
                pop.id = 'confirm-pop';
                pop.style.cssText = "position:absolute; right:30px; top:-5px; background:#444; color:#fff; padding:4px 8px; border-radius:4px; font-size:11px; z-index:100; display:flex; gap:8px; align-items:center; white-space:nowrap;";
                pop.innerHTML = `Delete? <span id="del-yes" style="color:#ff5252; font-weight:bold; cursor:pointer;">YES</span> <span id="del-no" style="cursor:pointer;">NO</span><div style="position:absolute; right:-6px; top:10px; width:0; height:0; border-top:6px solid transparent; border-bottom:6px solid transparent; border-left:6px solid #444;"></div>`;
                row.appendChild(pop);
                
                document.getElementById('del-yes').onclick = () => {
                    saved.splice(idx, 1);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
                    renderSavedQueries();
                };
                document.getElementById('del-no').onclick = () => { pop.remove(); };
            };

            row.appendChild(txt);
            row.appendChild(delBtn);

            // Drag & Drop
            row.ondragstart = (e) => { e.dataTransfer.setData('text/plain', idx); row.style.opacity = '0.4'; };
            row.ondragend = () => { row.style.opacity = '1'; };
            row.ondragover = (e) => { e.preventDefault(); row.style.borderTop = "2px solid " + MS_DARK_BLUE; };
            row.ondragleave = () => { row.style.borderTop = "none"; };
            row.ondrop = (e) => {
                e.preventDefault();
                var fromIdx = e.dataTransfer.getData('text/plain');
                var item = saved.splice(fromIdx, 1);
                saved.splice(idx, 0, item[0]);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
                renderSavedQueries();
            };
            listCont.appendChild(row);
        });
    }
    renderSavedQueries();

    document.getElementById('ai-submit').onclick = function() {
        var btn = this; var rawQ = tx.value.trim(); if(!rawQ) return;
        btn.disabled = true; btn.innerText = "Thinking...";
        var q = rawQ.replace(/[#＃][Cc][Oo][Nn][Tt][Ee][Xx][Tt]/g, "#context");

        fetch('https://muse-score-supporter-diy-jii-ii.vercel.app/prompt.bin?' + Date.now()).then(r => r.text()).then(obfuscated => {
            var contextText = getCleanContext();
            var processedQuery = q.replace(/#context/gi, "\\n\\n[CONTEXT]\\n" + contextText + "\\n");
            var finalQuery = processedQuery + " " + getSiteFilter() + "\\n\\nFollow instructions:\\n" + obfuscated;
            window.open("https://www.google.com" + "/search?q=" + encodeURIComponent(finalQuery) + "&udm=50&aep=11", '_blank');
            btn.disabled = false; btn.innerText = "AI Search";
        });
    };

    document.getElementById('web-search').onclick = function() {
        var q = tx.value.trim(); if(!q) return;
        window.open("https://www.google.com" + "/search?q=" + encodeURIComponent(getSiteFilter() + " " + q), '_blank');
    };
    document.getElementById('ai-save').onclick = function() {
        var q = tx.value.trim(); if(!q) return;
        var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        saved.unshift(q);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        renderSavedQueries();
    };
    document.getElementById('ai-clear').onclick = () => { tx.value = ''; };
    document.getElementById('close-x').onclick = closePanel;
})();
