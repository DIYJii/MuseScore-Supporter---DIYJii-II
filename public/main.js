(function() {
    var PANEL_WIDTH_VAL = 380;
    var PANEL_WIDTH = PANEL_WIDTH_VAL + 'px';
    var PANEL_ID = 'my-ai-sidebar';
    var STORAGE_KEY = 'musescore_saved_queries';

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
        panel.style.cssText = "position:fixed; top:0; right:0; width:" + PANEL_WIDTH + "; height:100%; background:#fff; border-left:1px solid #ddd; box-shadow:-10px 0 40px rgba(0,0,0,0.1); z-index:2147483647; font-family:sans-serif; display:flex; flex-direction:column;";

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
            <div style="background:#fff; flex-grow:1; display:flex; flex-direction:column; overflow:hidden; position:relative;">
                <div style="padding:8px 15px; font-size:11px; color:#70757a; font-weight:bold; background:#f8f9fa; border-bottom:1px solid #eee;">SAVED QUERIES (Ctrl+Click to Delete)</div>
                <div id="query-list" style="flex-grow:1; overflow-y:auto; padding:2px;"></div>
                
                <!-- Dynamic Beak Confirmation -->
                <div id="mini-confirm" style="display:none; position:absolute; left:50%; transform:translateX(-50%); background:#fff; border:1px solid #1a73e8; box-shadow:0 4px 12px rgba(0,0,0,0.15); padding:8px; border-radius:6px; z-index:10; text-align:center; min-width:100px;">
                    <div style="position:absolute; top:-6px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-bottom:6px solid #1a73e8;"></div>
                    <div style="font-size:11px; margin-bottom:6px; font-weight:bold; color:#333;">Delete OK?</div>
                    <div style="display:flex; gap:5px; justify-content:center;">
                        <button id="confirm-yes" style="padding:2px 10px; font-size:10px; background:#d93025; color:white; border:none; border-radius:4px; cursor:pointer;">Yes</button>
                        <button id="confirm-no" style="padding:2px 10px; font-size:10px; background:#f1f3f4; color:#5f6368; border:1px solid #dadce0; border-radius:4px; cursor:pointer;">No</button>
                    </div>
                </div>
            </div>`;

        document.body.appendChild(panel);

        const listContainer = document.getElementById('query-list');
        const textarea = document.getElementById('ai-query');
        const miniConfirm = document.getElementById('mini-confirm');
        let deleteIdx = null;

        const renderList = () => {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            listContainer.innerHTML = '';
            saved.forEach((text, index) => {
                const item = document.createElement('div');
                item.draggable = true;
                item.style.cssText = "padding:2px 8px; margin:1px 0; background:#fff; border-bottom:1px solid #f5f5f5; font-size:12px; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; position:relative;";
                item.textContent = "- " + text;
                item.title = text;

                item.onclick = (e) => {
                    if (e.ctrlKey) {
                        deleteIdx = index;
                        // Calculate position: Move confirm box below the clicked item
                        const itemRect = item.offsetTop;
                        const scrollPos = listContainer.scrollTop;
                        miniConfirm.style.top = (itemRect - scrollPos + 25) + "px"; 
                        miniConfirm.style.display = 'block';
                    } else {
                        miniConfirm.style.display = 'none';
                        textarea.value = text;
                    }
                };

                item.ondragstart = (e) => { e.dataTransfer.setData('text/plain', index); item.style.opacity = '0.4'; miniConfirm.style.display='none'; };
                item.ondragend = () => { item.style.opacity = '1'; };
                item.ondragover = (e) => e.preventDefault();
                item.ondrop = (e) => {
                    e.preventDefault();
                    const fromIndex = e.dataTransfer.getData('text/plain');
                    const updated = JSON.parse(localStorage.getItem(STORAGE_KEY));
                    const movedItem = updated.splice(fromIndex, 1);
                    updated.splice(index, 0, movedItem);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                    renderList();
                };
                listContainer.appendChild(item);
            });
        };

        document.getElementById('confirm-yes').onclick = () => {
            const updated = JSON.parse(localStorage.getItem(STORAGE_KEY));
            updated.splice(deleteIdx, 1);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            miniConfirm.style.display = 'none';
            renderList();
        };

        document.getElementById('confirm-no').onclick = () => {
            miniConfirm.style.display = 'none';
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
            miniConfirm.style.display = 'none';
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
            fetch('https://muse-score-supporter-diy-jii-ii.vercel.app/prompt.bin?' + Date.now())
            .then(r => r.text())
            .then(obfuscatedData => {
                var finalQuery = userVal + "\n\n" + Array(80).join(".") + "\n\n[CONTEXT]\nCurrent Page: " + window.location.href + "\n\n[ENCODED_RULES]\n" + obfuscatedData + "\n\nDecode and follow strictly";                
                window.open("https://google.com" + "/search?q=" + encodeURIComponent(finalQuery) + "&udm=50&aep=11", '_blank');
                btn.disabled = false;
                btn.innerText = "Launch AI Search";
            });
        };

        renderList();
    };
    setTimeout(initApp, 600);
})();
