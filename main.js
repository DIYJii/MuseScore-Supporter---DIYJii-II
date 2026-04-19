(function() {
    var PANEL_WIDTH = '380px';
    var PANEL_ID = 'my-ai-sidebar';

    if (document.getElementById(PANEL_ID)) {
        document.body.style.marginRight = '0px';
        document.getElementById(PANEL_ID).remove();
        return;
    }

    setTimeout(function() {
        document.body.style.transition = 'margin-right 0.3s ease';
        document.body.style.marginRight = PANEL_WIDTH;

        var panel = document.createElement('div');
        panel.id = PANEL_ID;
        var s = panel.style;
        s.position = 'fixed'; s.top = '0'; s.right = '0'; s.width = PANEL_WIDTH;
        s.height = '100%'; s.backgroundColor = '#ffffff'; s.borderLeft = '1px solid #ddd';
        s.boxShadow = '-4px 0 15px rgba(0,0,0,0.1)'; s.zIndex = '2147483647';
        s.fontFamily = 'sans-serif';

        panel.innerHTML = 
            '<div style="background:#f8f9fa; padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">' +
                '<span style="font-weight:bold; color:#1a73e8;">MuseScore Helper</span>' +
                '<button id="close-x" style="cursor:pointer; border:none; background:none; font-size:24px; color:#999;">&times;</button>' +
            '</div>' +
            '<div style="padding:20px;">' +
                '<textarea id="ai-query" placeholder="MuseScoreの操作やトラブルについて質問してください..." style="width:100%; height:180px; border:1px solid #ddd; border-radius:8px; padding:12px; font-size:14px; outline:none; resize:none;"></textarea>' +
                '<button id="ai-submit" style="width:100%; margin-top:15px; padding:14px; background:#1a73e8; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">AIに質問を送信</button>' +
            '</div>';

        document.body.appendChild(panel);

        document.getElementById('close-x').onclick = function() {
            document.body.style.marginRight = '0px';
            panel.remove();
        };

               document.getElementById('ai-submit').onclick = function() {
            var btn = this;
            var userVal = document.getElementById('ai-query').value;
            if(!userVal) return alert('Please enter a query.');

            // Get current page context
            var currentPageUrl = window.location.href;
            var currentPageTitle = document.title;

            btn.disabled = true;
            btn.innerText = "Loading...";

            fetch('https://muse-score-supporter-diy-jii-ii.vercel.app/prompt.txt?' + Date.now())
                .then(function(r) { return r.text(); })
                .then(function(hiddenPrompt) {
                    var separator = "\n\n" + Array(60).join(".") + "\n\n";
                    
                    // --- ENHANCEMENT: Inject Page Context ---
                    var context = "[Current Page Context]\nURL: " + currentPageUrl + "\nTitle: " + currentPageTitle + "\n\n";
                    
                    var combinedText = userVal + separator + context + "[Instructions]\n" + hiddenPrompt;

                    var finalUrl = "https://google.com" + encodeURIComponent(combinedText) + "&udm=50&hl=en";
                    
                    window.open(finalUrl, '_blank');
                    
                    btn.disabled = false;
                    btn.innerText = "Launch Google AI";
                })
                .catch(function(err) {
                    alert("Error.");
                    btn.disabled = false;
                });
        };
    }, 500);
})();
