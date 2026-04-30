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
        { id: 'aud', label: 'Audacityteam', url: 'audacityteam.org' },
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
        var ignore = clone.querySelectorAll('script, style, noscript, iframe, nav, footer, .ads, .user-nav');
        ignore.forEach(el => el.remove());
        var mainArea = clone.querySelector('article, main, .forum-post-content, .node-content') || clone;
        var text = mainArea.innerText;
        text = text.replace(/Subscribe|Mark\s+as\s+spam|Reply|Quote|Report/gi, '')
                   .replace(/\bby\s+\S+/gi, '').replace(/\bon\s+\w+\s+\d{1,2},?\s+\d{4}/gi, '');
        return text.replace(/\s+/g, ' ').trim().substring(0, 5000);
    }

    var initApp = function() {
        document.documentElement.style.width = "calc(100% - " + PANEL_WIDTH + ")";
        document.documentElement.style.transition = "width 0.3s ease";

        var panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.style.cssText = "position:fixed; top:0; right:0; width:" + PANEL_WIDTH + "; height:100%; background:#fcfcfc; border-left:1px solid #dee2e6; z-index:2147483647; font-family:sans-serif; display:flex; flex-direction:column; box-shadow:-5px 0 15px rgba(0,0,0,0.05);";

        var btnBase = "display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; border-radius:4px; font-weight:bold; color:white; box-sizing:border-box;";
        var blueStyle = "background:#2e68c0;";
        var orangeStyle = "background:#ffa000;";
        var redStyle = "background:#e64a19;";
        var purpleOn = "background:#4a148c;";
        var purpleOff = "background:#b39ddb;"; // より薄く

        panel.innerHTML = `
            <div style="background:#fff; padding:2px 15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; height:35px; flex-shrink:0;">
                <span style="font-weight:900; color:#1a237e; font-size:22px; line-height:1;">MuseScore Supporter</span>
                <button id="close-x" style="cursor:pointer; border:none; background:none; font-size:28px; color:#ccc;">&times;</button>
            </div>
            <div style="padding:8px 15px; background:#fff; border-bottom:1px solid #eee; display:flex; flex-direction:column; gap:4px; flex-shrink:0;">
                <div style="display:flex; gap:4px; flex-wrap:wrap;" id="row-sites"></div>
            </div>
            <div style="padding:10px 15px; display:flex; flex-direction:column; gap:5px; flex-shrink:0; background:rgba(232, 245, 233, 0.5);">
                <textarea id="ai-query" placeholder="Type your query for AI Search. Use '#context' to inject page text on the left.\\nKey words search is also available.\\nUse Site:https//... to limit the search to a specific site." style="width:100%; height:180px; border:1px solid #ced4da; border-radius:6px; padding:10px; font-size:12px; resize:none; box-sizing:border-box; outline:none; background:rgba(255,255,255,0.8);"></textarea>
                <div style="display:flex; gap:10px;">
                    <button id="ai-submit" style="${btnBase} ${blueStyle} flex:1; height:36px; font-size:14px;">AI Search</button>
                    <button id="web-search" style="${btnBase} ${blueStyle} flex:1; height:36px; font-size:14px;">Search</button>
                </div>
                <div style="display:flex; gap:10px;">
                    <button id="ai-save" style="${btnBase} ${orangeStyle} flex:1; height:36px; font-size:14px;">Save Query</button>
                    <button id="ai-clear" style="${btnBase} ${redStyle} flex:1; height:36px; font-size:14px;">Clear</button>
                </div>
            </div>
            <div style="flex-grow:1; overflow-y:auto; padding:5px 15px; background:rgba(232, 245, 233, 0.3);" id="query-list"></div>`;

        document.body.appendChild(panel);

        var tx = document.getElementById('ai-query');
        var selected = JSON.parse(localStorage.getItem(DOMAIN_KEY) || '{"all":true}');

        function renderToggles() {
            var container = document.getElementById('row-sites');
            container.innerHTML = '';
            var list = [...domains, {id:'all', label:'ALL'}];
            list.forEach(d => {
                var btn = document.createElement('button');
                btn.innerText = d.label;
                btn.style.cssText = btnBase + "flex: 1 1 30%; height:32px; font-size:11px; margin:2px 0; " + (selected[d.id] ? purpleOn : purpleOff);
                btn.onclick = () => toggleDomain(d.id);
                container.appendChild(btn);
            });
        }

        function toggleDomain(id) {
            if (id === 'all') { selected = { all: true }; } 
            else {
                delete selected.all;
                if (selected[id] && Object.keys(selected).length === 1) return;
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

        document.getElementById('web-search').onclick = function() {
            var q = tx.value.trim(); if(!q) return alert('Enter query');
            window.open("https://google.com" + "/search?q=" + encodeURIComponent(getSiteFilter() + " " + q), '_blank');
        };

        document.getElementById('ai-submit').onclick = function() {
            var btn = this; var q = tx.value.trim(); if(!q) return alert('Enter query');
            btn.disabled = true; btn.innerText = "Processing...";
            fetch('https://muse-score-supporter-diy-jii-ii.vercel.app/prompt.bin?' + Date.now()).then(r => r.text()).then(obfuscated => {
                var processed = q.replace(/#context/gi, "\n\n[CONTEXT]\n" + getCleanContext() + "\n");
                var finalQuery = getSiteFilter() + " " + processed + "\n\n指示に従え:\n" + obfuscated;
                window.open("https://www.google.com" + "/search?q=" + encodeURIComponent(finalQuery) + "&udm=50&aep=11", '_blank');
                btn.disabled = false; btn.innerText = "AI Search";
            });
        };

        var renderList = function() {
            var list = document.getElementById('query-list');
            var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            list.innerHTML = '';
            saved.forEach((text, i) => {
                var item = document.createElement('div');
                item.style.cssText = "padding:4px 8px; margin:2px 0; background:#fff; border:1px solid #eee; border-radius:4px; font-size:12px; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#444;";
                item.textContent = "- " + text;
                item.onclick = (e) => {
                    if (e.ctrlKey) { showConfirm(e, () => { saved.splice(i, 1); localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); renderList(); }); }
                    else { tx.value = text; }
                };
                list.appendChild(item);
            });
        };

        function showConfirm(e, onYes) {
            var existing = document.getElementById('confirm-pop'); if(existing) existing.remove();
            var pop = document.createElement('div');
            pop.id = 'confirm-pop';
            pop.style.cssText = "position:fixed; background:#333; color:white; padding:8px; border-radius:6px; font-size:12px; z-index:2147483647; box-shadow:0 2px 10px rgba(0,0,0,0.3);";
            pop.innerHTML = 'Delete? <button id="conf-yes" style="background:#e64a19; border:none; color:white; border-radius:3px; cursor:pointer; margin-left:5px; padding:2px 8px;">Yes</button>';
            
            // 嘴（吹き出しの角）
            var arrow = document.createElement('div');
            arrow.style.cssText = "position:absolute; bottom:-6px; left:15px; width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:6px solid #333;";
            pop.appendChild(arrow);
            
            document.body.appendChild(pop);
            pop.style.left = e.clientX + 'px';
            pop.style.top = (e.clientY - pop.offsetHeight - 15) + 'px';
            
            document.getElementById('conf-yes').onclick = () => { onYes(); pop.remove(); };
            setTimeout(() => { document.addEventListener('click', function _h(ev){ if(!pop.contains(ev.target)){ pop.remove(); document.removeEventListener('click', _h); } }); }, 100);
        }

        document.getElementById('ai-clear').onclick = () => { tx.value = ''; sessionStorage.removeItem(TEMP_TEXT_KEY); };
        document.getElementById('ai-save').onclick = () => {
            var val = tx.value.trim(); if(!val) return;
            var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            saved.push(val); localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
            renderList();
        };
        document.getElementById('close-x').onclick = closePanel;
        renderList();
    };

    initApp();
})();
