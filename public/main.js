(function() {
    var PANEL_WIDTH = '380px';
    var PANEL_ID = 'my-ai-sidebar';
    var STORAGE_KEY = 'musescore_saved_queries';
    var DOMAIN_KEY = 'musescore_selected_domains';
    var MS_DARK_BLUE = '#172b4d'; // MuseScore.org Header Dark Blue
    var MS_LIGHT_BLUE = '#eef2f7';

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
        var text = mainArea.innerText;
        return text.replace(/\s+/g, ' ').trim().substring(0, 5000);
    }

    function formatQuery(q) {
        q = q.replace(/[#＃][Cc][Oo][Nn][Tt][Ee][Xx][Tt]/g, "#context");
        var siteMatch = q.match(/site:\S+/i);
        if (siteMatch) {
            var siteStr = siteMatch[0];
            q = q.replace(siteStr, "").trim() + " " + siteStr;
        }
        return q;
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
        <div style="background:#fff; padding:5px 15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; height:45px; flex-shrink:0;">
            <span style="font-weight:900; color:${MS_DARK_BLUE}; font-size:24px; line-height:1;">MuseScore Supporter</span>
            <button id="close-x" style="cursor:pointer; border:none; background:none; font-size:30px; color:#aaa;">&times;</button>
        </div>
        <div style="padding:4px 15px 8px 15px; background:#fff; border-bottom:1px solid #eee; display:flex; flex-direction:column; gap:2px; flex-shrink:0;">
            <div style="display:flex; gap:4px; flex-wrap:wrap;" id="row-sites"></div>
        </div>
        <div style="padding:10px 15px; display:flex; flex-direction:column; gap:0px; flex-shrink:0; background:rgba(232, 245, 233, 0.4);">
            <textarea id="ai-query" style="width:100%; height:180px; border:2px solid #bbb; border-radius:6px 6px 0 0; padding:10px; font-size:13px; color:#111; resize:none; box-sizing:border-box; outline:none; background:#fff;"></textarea>
            <div style="display:flex; gap:4px; margin-top:-1px;">
                <button id="ai-submit" style="${btnBase} background:#2196F3; flex:1; height:40px; font-size:14px; border-radius:0 0 0 6px;">AI Search</button>
                <button id="web-search" style="${btnBase} background:#2196F3; flex:1; height:40px; font-size:14px; border-radius:0 0 6px 0;">Key Words Search</button>
            </div>
            <div style="display:flex; gap:8px; margin-top:8px;">
                <button id="ai-save" style="${btnBase} background:#ef6c00; flex:1; height:36px; font-size:13px;">Save Query</button>
                <button id="ai-clear" style="${btnBase} background:#757575; flex:1; height:36px; font-size:13px;">Clear</button>
            </div>
        </div>
        <div style="flex-grow:1; overflow-y:auto; padding:5px 15px; background:rgba(232, 245, 233, 0.2);" id="query-list"></div>
        <div style="padding:5px; text-align:center; font-size:10px; color:#888; background:#fff; border-top:1px solid #eee;">Powered by Google AI Search</div>`;

    document.body.appendChild(panel);
    document.documentElement.style.width = `calc(100% - ${PANEL_WIDTH})`;

    var tx = document.getElementById('ai-query');
    tx.placeholder = "Type your query for AI Search.\nUse '#context' to inject page text on the left.\nUse site:domain to limit search.";

    var selected = JSON.parse(localStorage.getItem(DOMAIN_KEY) || '{"all":true}');

    function renderToggles() {
        var container = document.getElementById('row-sites');
        container.innerHTML = '';
        var list = [...domains, {id:'all', label:'ALL'}];
        list.forEach(d => {
            var btn = document.createElement('button');
            btn.innerText = d.label;
            var isOn = selected[d.id];
            btn.style.cssText = btnBase + `flex: 1 1 30%; height:32px; font-size:13px; margin:2px 0; background:${isOn ? MS_DARK_BLUE : MS_LIGHT_BLUE}; color:${isOn ? '#fff' : MS_DARK_BLUE}; border:1px solid ${MS_DARK_BLUE};`;
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
            var div = document.createElement('div');
            div.draggable = true;
            div.dataset.index = idx;
            div.style.cssText = "background:#fff; border:1px solid #ddd; padding:6px 10px; margin-bottom:4px; border-radius:4px; cursor:grab; font-size:12px; color:#333; line-height:1.2; position:relative; display:flex; align-items:center; gap:8px;";
            
            var txt = document.createElement('span');
            txt.style.flex = "1";
            txt.innerText = q.length > 60 ? q.substring(0, 60) + '...' : q;
            txt.onclick = () => { tx.value = q; };

            var del = document.createElement('button');
            del.innerHTML = '&times;';
            del.style.cssText = "background:#f5f5f5; color:#888; border:1px solid #ccc; border-radius:3px; cursor:pointer; width:20px; height:20px; font-weight:bold;";
            del.onclick = (e) => {
                e.stopPropagation();
                if(confirm("Delete this query?")) {
                    saved.splice(idx, 1);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
                    renderSavedQueries();
                }
            };

            div.appendChild(txt);
            div.appendChild(del);

            // Drag & Drop events
            div.ondragstart = (e) => { e.dataTransfer.setData('text/plain', idx); div.style.opacity = '0.5'; };
            div.ondragend = () => { div.style.opacity = '1'; };
            div.ondragover = (e) => { e.preventDefault(); div.style.borderTop = "2px solid " + MS_DARK_BLUE; };
            div.ondragleave = () => { div.style.borderTop = "1px solid #ddd"; };
            div.ondrop = (e) => {
                e.preventDefault();
                var fromIdx = e.dataTransfer.getData('text/plain');
                var toIdx = idx;
                var item = saved.splice(fromIdx, 1)[0];
                saved.splice(toIdx, 0, item);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
                renderSavedQueries();
            };

            listCont.appendChild(div);
        });
    }
    renderSavedQueries();

    document.getElementById('ai-save').onclick = function() {
        var q = tx.value.trim(); if(!q) return;
        var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        saved.unshift(q);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        renderSavedQueries();
    };

    document.getElementById('web-search').onclick = function() {
        var q = formatQuery(tx.value.trim()); if(!q) return;
        window.open("https://www.google.com" + "/search?q=" + encodeURIComponent(getSiteFilter() + " " + q), '_blank');
    };

            document.getElementById('ai-submit').onclick = function() {
        var btn = this; 
        var rawQ = tx.value.trim(); 
        if(!rawQ) return alert('Enter query');

        btn.disabled = true; 
        btn.innerText = "Processing...";

        var q = rawQ.replace(/[#＃][Cc][Oo][Nn][Tt][Ee][Xx][Tt]/g, "#context");

        fetch('https://muse-score-supporter-diy-jii-ii.vercel.app/prompt.bin?' + Date.now())
            .then(r => r.text())
            .then(obfuscated => {
                
                var contextText = getCleanContext();
                var processedQuery = q.replace(/#context/gi, "\n\n[CONTEXT]\n" + contextText + "\n");

                var siteFilter = getSiteFilter();
                var finalQuery = processedQuery + " " + siteFilter + "\n\nFollow instructions:\n" + obfuscated;

                window.open("https://www.google.com" + "/search?q=" + encodeURIComponent(finalQuery) + "&udm=50&aep=11", '_blank');
                
                btn.disabled = false; 
                btn.innerText = "AI Search";
            })
            .catch(err => {
                console.error(err);
                alert("Prompt load failed.");
                btn.disabled = false;
                btn.innerText = "AI Search";
            });
    };



    document.getElementById('ai-clear').onclick = () => { tx.value = ''; };
    document.getElementById('close-x').onclick = closePanel;
})();
