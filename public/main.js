(function() {
    var PANEL_WIDTH = '380px';
    var PANEL_ID = 'my-ai-sidebar';

    if (document.getElementById(PANEL_ID)) {
        document.getElementById(PANEL_ID).remove();
        return;
    }

    var initApp = function() {
        var panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.style.cssText = "position:fixed; top:10px; right:10px; width:" + PANEL_WIDTH + "; height:calc(100% - 20px); background:#fff; border:1px solid #ddd; border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.2); z-index:2147483647; font-family:sans-serif; overflow:hidden; display:flex; flex-direction:column;";

        panel.innerHTML = 
            '<div style="background:#f8f9fa; padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">' +
                '<span style="font-weight:bold; color:#1a73e8;">MuseScore Helper</span>' +
                '<button id="close-x" style="cursor:pointer; border:none; background:none; font-size:24px; color:#999;">&times;</button>' +
            '</div>' +
            '<div style="padding:20px; flex-grow:1;">' +
                '<textarea id="ai-query" placeholder="Ask about this page or MuseScore..." style="width:100%; height:180px; border:1px solid #ddd; border-radius:8px; padding:12px; font-size:14px; outline:none; resize:none; box-sizing:border-box;"></textarea>' +
                '<button id="ai-submit" style="width:100%; margin-top:15px; padding:14px; background:#1a73e8; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Launch AI Search</button>' +
            '</div>';

        document.body.appendChild(panel);
        document.getElementById('close-x').onclick = function() { panel.remove(); };

        document.getElementById('ai-submit').onclick = function() {
            var btn = this;
            var userVal = document.getElementById('ai-query').value;
            if(!userVal) return alert('Please enter a query.');

            btn.disabled = true;
            btn.innerText = "Processing...";

            // Fetch the pre-obfuscated (Base64) file
            fetch('https://muse-score-supporter-diy-jii-ii.vercel.app/prompt.bin?' + Date.now(), {
                mode: 'cors',
                cache: 'no-store'
            })
            .then(function(r) { 
                if (!r.ok) throw new Error('System error: ' + r.status);
                return r.text(); 
            })
            .then(function(obfuscatedData) {
                // Decode Base64 offline
                var decodedPrompt = decodeURIComponent(escape(window.atob(obfuscatedData.trim())));
                
                var separator = "\n\n" + Array(80).join(".") + "\n\n";
                var context = "Current Page: " + window.location.href + "\nTitle: " + document.title + "\n\n";
                var finalQuery = userVal + separator + "[CONTEXT]\n" + context + "[RULES]\n" + decodedPrompt;

                var url = "https://google.com" + encodeURIComponent(finalQuery) + "&udm=14&hl=en";
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
    };

    setTimeout(initApp, 600);
})();
