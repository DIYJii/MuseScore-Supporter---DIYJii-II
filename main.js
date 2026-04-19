(function() {
    var PANEL_WIDTH = '380px';
    var PANEL_ID = 'my-ai-sidebar';

    if (document.getElementById(PANEL_ID)) {
        document.body.style.marginRight = '0px';
        document.getElementById(PANEL_ID).remove();
        return;
    }

    // Use a safer way to wait for the page to settle
    var initApp = function() {
        if (!document.body) return setTimeout(initApp, 100);

        var panel = document.createElement('div');
        panel.id = PANEL_ID;
        
        // Use cssText to set styles all at once (less likely to trigger security scripts)
        panel.style.cssText = "position:fixed; top:0; right:0; width:" + PANEL_WIDTH + "; height:100%; background:#fff; border-left:1px solid #ddd; box-shadow:-4px 0 15px rgba(0,0,0,0.1); z-index:2147483647; font-family:sans-serif; transition:transform 0.3s ease;";

        panel.innerHTML = 
            '<div style="background:#f8f9fa; padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">' +
                '<span style="font-weight:bold; color:#1a73e8;">MuseScore Helper</span>' +
                '<button id="close-x" style="cursor:pointer; border:none; background:none; font-size:24px; color:#999;">&times;</button>' +
            '</div>' +
            '<div style="padding:20px;">' +
                '<textarea id="ai-query" placeholder="Ask about this page or MuseScore..." style="width:100%; height:180px; border:1px solid #ddd; border-radius:8px; padding:12px; font-size:14px; outline:none; resize:none;"></textarea>' +
                '<button id="ai-submit" style="width:100%; margin-top:15px; padding:14px; background:#1a73e8; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Launch AI Search</button>' +
            '</div>';

        document.body.appendChild(panel);

        // Adjust body margin after a small delay to prevent security script crashes
        setTimeout(function(){
            document.body.style.transition = 'margin-right 0.3s ease';
            document.body.style.marginRight = PANEL_WIDTH;
        }, 100);

        document.getElementById('close-x').onclick = function() {
            document.body.style.marginRight = '0px';
            panel.remove();
        };

        document.getElementById('ai-submit').onclick = function() {
            var btn = this;
            var userVal = document.getElementById('ai-query').value;
            if(!userVal) return alert('Please enter a query.');

            var pageContext = "Context: This is about the page '" + document.title + "' (" + window.location.href + ")\n\n";

            btn.disabled = true;
            btn.innerText = "Syncing...";

            // Fetch from GitHub/Vercel
            fetch('https://muse-score-supporter-diy-jii-ii.vercel.app/prompt.txt?' + Date.now())
                .then(function(r) { return r.text(); })
                .then(function(promptText) {
                    var separator = "\n\n" + Array(50).join(".") + "\n\n";
                    // Query first, context/instructions hidden behind dots
                    var finalQuery = userVal + separator + pageContext + promptText;

                    var url = "https://google.com" + encodeURIComponent(finalQuery) + "&udm=50&hl=en";
                    window.open(url, '_blank');
                    
                    btn.disabled = false;
                    btn.innerText = "Launch AI Search";
                })
                .catch(function() {
                    alert("Connection error.");
                    btn.disabled = false;
                });
        };
    };

    initApp();
})();
