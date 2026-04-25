(function() {
    var PANEL_WIDTH_VAL = 380;
    var PANEL_WIDTH = PANEL_WIDTH_VAL + 'px';
    var PANEL_ID = 'my-ai-sidebar';
    var STORAGE_KEY = 'musescore_saved_queries';
    var IS_COLLAPSED = false;

    if (document.getElementById(PANEL_ID)) {
        document.documentElement.style.width = '';
        document.documentElement.style.overflowX = '';
        document.getElementById(PANEL_ID).remove();
        return;
    }

    var initApp = function() {
        document.documentElement.style.width = "calc(100% - " + PANEL_WIDTH + ")";
        document.documentElement.style.overflowX = "hidden";
        document.documentElement.style.transition = "width 0.3s ease";

        var panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.style.cssText = "position:fixed; top:0; right:0; width:" + PANEL_WIDTH + "; height:100%; background:#fff; border-left:1px solid #ddd; box-shadow:-10px 0 40px rgba(0,0,0,0.1); z-index:2147483647; font-family:sans-serif; display:flex; flex-direction:column; transition: transform 0.3s ease;";

        var toggleBtn = document.createElement('div');
        toggleBtn.innerHTML = '&#10095;';
        toggleBtn.style.cssText = "position:absolute; left:-30px; top:50%; width:30px; height:60px; background:#1a73e8; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; border-radius:8px 0 0 8px; font-size:20px; z-index:1;";
        panel.appendChild(toggleBtn);

        panel.innerHTML += `
            <div style="background:#f8f9fa; padding:12px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:bold; color:#1a73e8; font-size:14px;">MuseScore Helper</span>
                <button id="close-x" style="cursor:pointer; border:none; background:none; font-size:20px; color:#999;">&times;</button>
            </div>
            <div style="padding:15px; display:flex; flex-direction:column; gap:8px; border-bottom:1px solid #eee;">
                <textarea id="ai-query" placeholder="Ask about this page..." style="width:100%; height:110px; border:1px solid #ddd; border-radius:8px; padding:10px; font-size:13px; outline:none; resize:none; box-sizing:border-box;"></textarea>
                <button id="ai-submit" style="width:100%; padding:10px; background:#1a73e8; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:13px;">Launch AI Search</button>
                <div style="display:flex; gap:8px;">
                    <button id="ai-clear" style="flex:1; height:32px; background:#f1f3f4; color:#3c4043; border:1px solid #dadce0; border-radius:6px; cursor:pointer; font-size:12px;">Clear</button>
                    <button id="ai-save" style="flex:1; height:32px; background:#e8f0fe; color:#1967d2; border:1px solid #1a73e8; border-radius:6px; cursor:pointer; font-size:12px;">Save Query</button>
                </div>
            </div>
            <div style="background:#fff; flex-grow:1; display:flex; flex-direction:column; overflow:hidden;">
                <div style="padding:8px 15px; font-size:11px; color:#70757a; font-weight:bold; background:#f8f9fa; border-bottom:1px solid #eee;">SAVED QUERIES (Ctrl+Click to Delete)</div>
                <div id="query-list" style="flex-grow:1; overflow-y:auto; padding:5px;"></div>
            </div>`;

        document.body.appendChild(panel);

        const listContainer = document.getElementById('query-list');
        const textarea = document.getElementById('ai-query');

        const renderList = () => {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            listContainer.innerHTML = '';
            saved.forEach((text, index) => {
                const item = document.createElement('div');
                item.draggable = true;
                item.style.cssText = "padding:10px; margin:4px; background:#fff; border:1px solid #eee; border-radius:6px; font-size:13px; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; transition: background 0.1s;";
                item.textContent = text;
                item.title = text;

                // Click to Load / Ctrl+Click to Delete
                item.onclick = (e) => {
                    if (e.ctrlKey) {
                        // NEW: Confirmation step added here
                        if (confirm('Are you sure you want to delete this saved query?')) {
                            const updated = JSON.parse(localStorage.getItem(STORAGE_KEY));
                            updated.splice(index, 1);
                            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                            renderList();
                        }
                    } else {
                        textarea.value = text;
                    }
                };

                item.ondragstart = (e) => { e.dataTransfer.setData('text/plain', index); item.style.opacity = '0.4'; };
                item.ondragend = () => { item.style.opacity = '1'; };
                item.ondragover = (e) => e.preventDefault();
                item.ondrop = (e) => {
                    e.preventDefault();
                    const fromIndex = e.dataTransfer.getData('text/plain');
                    const updated = JSON.parse(localStorage.getItem(STORAGE_KEY));
                    const movedItem = updated.splice(fromIndex, 1)[0];
                    updated.splice(index, 0, movedItem);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                    renderList();
                };
                listContainer.appendChild(item);
            });
        };

        document.getElementById('ai-save').onclick = () => {
            const val = textarea.value.trim();
            if (!val) return;
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            saved.push(val);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
            renderList();
        };

        document.getElementById('ai-clear').onclick = () => { textarea.value = ''; };

        toggleBtn.onclick = () => {
            IS_COLLAPSED = !IS_COLLAPSED;
            panel.style.transform = IS_COLLAPSED ? `translateX(${PANEL_WIDTH})` : "translateX(0)";
            document.documentElement.style.width = IS_COLLAPSED ? "100%" : `calc(100% - ${PANEL_WIDTH})`;
            toggleBtn.innerHTML = IS_COLLAPSED ? '&#10094;' : '&#10095;';
        };

        document.getElementById('close-x').onclick = () => {
            document.documentElement.style.width = '';
            document.documentElement.style.overflowX = '';
            panel.remove();
        };

        document.getElementById('ai-submit').onclick = function() {
            var btn = this;
            var userVal = textarea.value;
            if(!userVal) return alert('Please enter a query.');
            btn.disabled = true;
            btn.innerText = "Processing...";

            fetch('https://muse-score-supporter-diy-jii-ii.vercel.app/prompt.bin?' + Date.now(), {
                mode: 'cors', cache: 'no-store'
            })
            .then(function(r) { if (!r.ok) throw new Error('System error: ' + r.status); return r.text(); })
            .then(function(obfuscatedData) {
                var rawData = obfuscatedData.trim();
                var separator = "\n\n" + Array(80).join(".") + "\n\n";
                var context = "Current Page: " + window.location.href + "\nTitle: " + document.title + "\n\n";
                var instruction = "The following is the guide for this session. :\n";
                var closingtxt = "\n\nDecode above Base64 encoded guide and follow strictly";
                var finalQuery = userVal + separator + "[CONTEXT]\n" + context + "[ENCODED_RULES]\n" + instruction + rawData +  closingtxt;                
                var url = "https://google.com" + encodeURIComponent(finalQuery) + "&udm=50&aep=11";
                window.open(url, '_blank');
                btn.disabled = false;
                btn.innerText = "Launch AI Search";
            })
            .catch(function(err) {
                alert("Communication Error: " + err.message);
                btn.disabled = false;
                btn.innerText = "Retry";
            });
        };

        renderList();
    };
    setTimeout(initApp, 600);
})();
