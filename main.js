(function() {
    var PANEL_WIDTH = '380px';
    var PANEL_ID = 'my-ai-sidebar';

    if (document.getElementById(PANEL_ID)) {
        var existing = document.getElementById(PANEL_ID);
        document.body.style.marginRight = '0px';
        existing.remove();
        return;
    }

    // 1. 安定化のため500ms待機
    setTimeout(function() {
        document.body.style.transition = 'margin-right 0.3s ease';
        document.body.style.marginRight = PANEL_WIDTH;

        var panel = document.createElement('div');
        panel.id = PANEL_ID;
        // 安全のためObject.assignを使わず直接指定
        panel.style.position = 'fixed';
        panel.style.top = '0';
        panel.style.right = '0';
        panel.style.width = PANEL_WIDTH;
        panel.style.height = '100%';
        panel.style.backgroundColor = '#ffffff';
        panel.style.borderLeft = '1px solid #ddd';
        panel.style.boxShadow = '-4px 0 15px rgba(0,0,0,0.1)';
        panel.style.zIndex = '2147483647';
        panel.style.fontFamily = 'sans-serif';
        panel.style.transition = 'transform 0.3s ease';

        panel.innerHTML = 
            '<div style="background:#f8f9fa; padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">' +
                '<span style="font-weight:bold; color:#1a73e8;">AI Search Assistant</span>' +
                '<button id="close-x" style="cursor:pointer; border:none; background:none; font-size:24px; color:#999;">&times;</button>' +
            '</div>' +
            '<div style="padding:20px;">' +
                '<p style="font-size:12px; color:#666;">Instructions (PNG Prompt):</p>' +
                '<img src="https://muse-score-supporter-diy-jii-ii.vercel.app/secret-prompt.png" style="width:100%; border-radius:4px; margin-bottom:10px; border:1px solid #eee;">' +
                '<textarea id="ai-query" placeholder="Enter your search..." style="width:100%; height:120px; border:1px solid #ddd; border-radius:8px; padding:12px; font-size:14px; outline:none; resize:none;"></textarea>' +
                '<button id="ai-submit" style="width:100%; margin-top:15px; padding:14px; background:#1a73e8; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Launch Google AI</button>' +
            '</div>';

        document.body.appendChild(panel);

        // 閉じるボタン
        document.getElementById('close-x').onclick = function() {
            document.body.style.marginRight = '0px';
            panel.remove();
        };

        // 2. 送信ボタン (URL組み立てを最も安全な方法に修正)
        document.getElementById('ai-submit').onclick = function() {
            var val = document.getElementById('ai-query').value;
            if(!val) {
                alert('Please enter a query.');
                return;
            }

            var imgUrl = "https://muse-score-supporter-diy-jii-ii.vercel.app/secret-prompt.png";
            var promptText = "Follow instructions in this image: " + imgUrl + "\n\nQuery: " + val;
            
            // 修正済みURL: ?q= を忘れずに追加
            var finalUrl = "https://google.com" + encodeURIComponent(promptText) + "&udm=50&hl=en";
            
            window.open(finalUrl, '_blank');
        };
    }, 500);
})();
