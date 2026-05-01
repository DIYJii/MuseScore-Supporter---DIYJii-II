(function() {
    var PANEL_WIDTH = '380px';
    var PANEL_ID = 'my-ai-sidebar';
    var STORAGE_KEY = 'musescore_saved_queries';
    var DOMAIN_KEY = 'musescore_selected_domains';
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
    // タスクバー被り防止のため高さを調整
    panel.style.cssText = `position:fixed; top:0; right:0; width:${PANEL_WIDTH}; height:calc(100% - 40px); background:#fcfcfc; border-left:1px solid #ccc; z-index:2147483647; font-family:sans-serif; display:flex; flex-direction:column; box-shadow:-5px 0 15px rgba(0,0,0,0.1);`;

    var btnBase = "display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; border-radius:4px; font-weight:bold; color:white; box-sizing:border-box;";

    panel.innerHTML = `
        <div style="background:#fff; padding:5px 15px; border-top:2px solid #ccc; display:flex; justify-content:center; align-items:center; height:40px; flex-shrink:0; position:relative;">
            <span style="font-weight:900; color:${MS_DARK_BLUE}; font-size:22px;">MuseScore Supporter</span>
            <button id="close-x" style="cursor:pointer; border:none; background:none; font-size:28px; color:#aaa; position:absolute; right:15px;">&times;</button>
        </div>
        <div id="domain-area" style="padding:2px 15px; background:#fff; border-bottom:1px solid #eee; flex-shrink:0;">
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:2px;" id="row-sites"></div>
        </div>
        <div style="padding:2px 15px 5px 15px; display:flex; flex-direction:column; gap:6px; flex:1; background:rgba(232, 245, 233, 0.4);">
            <textarea id="ai-query" placeholder="Type your query for AI Search.\nUse '#context' to inject page text.\nSite:https://" style="width:100%; height:160px; border:2px solid #bbb; border-radius:6px; padding:8px; font-size:13px; color:#111; resize:none; box-sizing:border-box; outline:none; background:#fff; flex:1;"></textarea>
            <div style="display:flex; gap:8px;">
                <button id="ai-submit" style="${btnBase} background:${SEARCH_BLUE}; flex:1; height:32px; font-size:12px;">AI Search</button>
                <button id="web-search" style="${btnBase} background:${SEARCH_BLUE}; flex:1; height:32px; font-size:12px;">Key Words Search</button>
            </div>
            <div style="display:flex; gap:8px; margin-top:0px;">
                <button id="ai-save" style="${btnBase} background:#ef6c00; flex:1; height:32px; font-size:12px;">Save Query</button>
                <button id="ai-clear" style="${btnBase} background:${CLEAR_RED}; flex:1; height:32px; font-size:12px;">Clear Query</button>
            </div>
        </div>
        <div id="history-container" style="margin:5px 15px; display:flex; flex-direction:column; flex:1; background:rgba(232, 245, 233, 0.4); border:2px solid #bbb; border-radius:6px; overflow:hidden;">
            <div style="flex-grow:1; overflow-y:auto; padding:3px;" id="query-list"></div>
        </div>
        <div style="padding:10px 8px 15px 8px; text-align:center; font-size:11px; font-weight:bold; color:${MS_DARK_BLUE}; background:#fff; border-top:1px solid #eee;">Powered by Google AI Search</div>`;

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
        if (selected.all) return ""; 
        var sites = domains.filter(d => selected[d.id]).map(d => "site:" + d.url).join(" OR ");
        return sites ? sites : "";
    }

    function renderSavedQueries() {
        var listCont = document.getElementById('query-list');
        listCont.innerHTML = '';
        var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        saved.forEach((q, idx) => {
            var row = document.createElement('div');
            row.draggable = true;
            // 行間を2/3（約22px）に縮小
            row.style.cssText = "background:#fff; border-bottom:1px solid #eee; padding:2px 8px; font-size:11px; color:#333; display:flex; align-items:center; height:22px; box-sizing:border-box; position:relative; cursor:grab;";
            
            var txt = document.createElement('span');
            txt.style.cssText = "flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer;";
            // 文頭に"-"を付けて表示
            txt.innerText = "- " + q.replace(/\n/g, ' ');
            txt.onclick = () => { 
                // 貼り付け時は"-"を外す（元のqを使用）
                tx.value = q; 
            };

            var delBtn = document.createElement('button');
            delBtn.innerHTML = '&times;';
            delBtn.style.cssText = "background:none; color:#aaa; border:none; cursor:pointer; font-size:16px; padding:0 3px; line-height:1;";
            
            delBtn.onclick = (e) => {
                e.stopPropagation();
                if (document.getElementById('confirm-pop')) return;
                var pop = document.createElement('div');
                pop.id = 'confirm-pop';
                pop.style.cssText = `position:absolute; right:30px; background:#455a64; color:#fff; padding:2px 8px; border-radius:4px; font-size:10px; display:flex; gap:6px; align-items:center; z-index:10;`;
                pop.innerHTML = `<span>Delete?</span><b id="del-yes" style="cursor:pointer; color:#ff8a65;">YES</b><b id="del-no" style="cursor:pointer;">NO</b>
                <div style="position:absolute; right:-6px; top:6px; border-top:5px solid transparent; border-bottom:5px solid transparent; border-left:6px solid #455a64;"></div>`;
                pop.querySelector('#del-yes').onclick = () => {
                    saved.splice(idx, 1);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
                    renderSavedQueries();
                };
                pop.querySelector('#del-no').onclick = () => pop.remove();
                row.appendChild(pop);
            };

            row.ondragstart = (e) => { e.dataTransfer.setData('text/plain', idx); row.style.opacity = '0.5'; };
            row.ondragend = () => { row.style.opacity = '1'; };
            row.ondragover = (e) => { e.preventDefault(); };
            row.ondrop = (e) => {
                e.preventDefault();
                var fromIdx = e.dataTransfer.getData('text/plain');
                var toIdx = idx;
                var item = saved.splice(fromIdx, 1)[0];
                saved.splice(toIdx, 0, item);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
                renderSavedQueries();
            };

            row.appendChild(txt);
            row.appendChild(delBtn);
            listCont.appendChild(row);
        });
    }
    renderSavedQueries();

    document.getElementById('ai-save').onclick = () => {
        var q = tx.value.trim();
        if (!q) return;
        var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (!saved.includes(q)) {
            saved.unshift(q);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
            renderSavedQueries();
        }
    };

    document.getElementById('ai-clear').onclick = () => { tx.value = ''; };
    document.getElementById('close-x').onclick = closePanel;

    async function getPromptBin() {
        try {
            const response = await fetch('https://muse-score-supporter-diy-jii-ii.vercel.app/prompt.bin');
            return response.ok ? await response.text() : "";
        } catch (e) { return ""; }
    }

    document.getElementById('ai-submit').onclick = async () => {
        var raw = tx.value.trim();
        if (!raw) return;
        var hasContext = /[#＃][Cc][Oo][Nn][Tt][Ee][Xx][Tt]/.test(raw);
        var cleanBody = raw.replace(/[#＃][Cc][Oo][Nn][Tt][Ee][Xx][Tt]/gi, "").trim();
        var siteFilter = "";
        var remainingLines = [];
        cleanBody.split('\n').forEach(line => {
            if (line.toLowerCase().startsWith('site:https://')) {
                var url = line.substring(13).trim();
                if (url) siteFilter += "site:" + url + " ";
            } else {
                remainingLines.push(line);
            }
        });
        var finalBody = remainingLines.join(' ').trim();
        var promptBin = await getPromptBin();
        var finalQ = "[QUERY:]" + finalBody;
        if (hasContext) finalQ += " [CONTEXT:] " + getCleanContext();
        finalQ += " [INSTRUCTIONS TO BE FOLLOWED:] " + promptBin;
        var domainFilter = getSiteFilter();
        var full = (domainFilter ? domainFilter + " " : "") + (siteFilter ? siteFilter + " " : "") + finalQ;
        window.open("https://www.google.com" + "/search?q=" + encodeURIComponent(full) + "&udm=50&aep=11", '_blank');
    };

    document.getElementById('web-search').onclick = () => {
        var raw = tx.value.trim().replace(/[#＃][Cc][Oo][Nn][Tt][Ee][Xx][Tt]/gi, "");
        if (!raw) return;
        var domainFilter = getSiteFilter();
        var full = (domainFilter ? domainFilter + " " : "") + raw;
        window.open("https://www.google.com" + "/search?q=" + encodeURIComponent(full), '_blank');
    };
})();
