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
        s.fontFamily = 'sans-serif'; s.transition = 'transform 0.3s ease';

        panel.innerHTML = 
            '<div style="background:#f8f9fa; padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">' +
                '<span style="font-weight:bold; color:#1a73e8;">AI Search Assistant</span>' +
                '<button id="close-x" style="cursor:pointer; border:none; background:none; font-size:24px; color:#999;">&times;</button>' +
            '</div>' +
            '<div style="padding:20px;">' +
                '<p style="font-size:12px; color:#666;">Prompt Image:</p>' +
                '<img src="https://vercel.app" style="width:100%; border-radius:4px; margin-bottom:10px; border:1px solid #eee;">' +
                '<textarea id="ai-query" placeholder="Enter your search..." style="width:100%; height:120px; border:1px solid #ddd; border-radius:8px; padding:12px; font-size:14px; outline:none; resize:none;"></textarea>' +
                '<button id="ai-submit" style="width:100%; margin-top:15px; padding:14px; background:#1a73e8; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Launch Google AI</button>' +
            '</div>';

        document.body.appendChild(panel);

        document.getElementById('close-x').onclick = function() {
            document.body.style.marginRight = '0px';
            panel.remove();
        };

        document.getElementById('ai-submit').onclick = function() {
            var val = document.getElementById('ai-query').value;
            if(!val) return alert('Please enter a query.');

            var imgUrl = "https://muse-score-supporter-diy-jii-ii.vercel.app/secret-prompt.png";
            var combinedText = "Instructions: " + imgUrl + "\n\nUser Query: " + val;

            // URLの組み立てを極限までシンプルにしました
            var baseUrl = "https://google.com";
            var finalUrl = baseUrl + "?q=" + encodeURIComponent(combinedText) + "&udm=50&hl=en";
            
            console.log("Opening URL:", finalUrl); // デバッグ用
            window.open(finalUrl, '_blank');
        };
    }, 500);
})();
