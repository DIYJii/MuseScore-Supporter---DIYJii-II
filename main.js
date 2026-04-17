(function() {
    const PANEL_WIDTH = '380px';
    const PANEL_ID = 'my-ai-sidebar';

    if (document.getElementById(PANEL_ID)) {
        closePanel();
        return;
    }

    function closePanel() {
        const p = document.getElementById(PANEL_ID);
        if (p) {
            document.body.style.marginRight = '0px';
            p.style.transform = 'translateX(100%)';
            setTimeout(() => p.remove(), 300);
        }
    }

    // 安定化のため、少し余裕を持って描画を開始
    setTimeout(() => {
        document.body.style.transition = 'margin-right 0.3s ease';
        document.body.style.marginRight = PANEL_WIDTH;

        const panel = document.createElement('div');
        panel.id = PANEL_ID;
        Object.assign(panel.style, {
            position: 'fixed', top: '0', right: '0', width: PANEL_WIDTH, height: '100%',
            backgroundColor: '#ffffff', borderLeft: '1px solid #ddd',
            boxShadow: '-4px 0 15px rgba(0,0,0,0.1)', zIndex: '2147483647',
            padding: '0', boxSizing: 'border-box', fontFamily: 'sans-serif',
            transition: 'transform 0.3s ease', transform: 'translateX(0)'
        });

        panel.innerHTML = `
            <div style="background:#f8f9fa; padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:bold; color:#1a73e8;">AI Search Assistant</span>
                <button id="close-x" style="cursor:pointer; border:none; background:none; font-size:24px; color:#999;">&times;</button>
            </div>
            <div style="padding:20px;">
                <p style="font-size:12px; color:#666;">Instructions (PNG Prompt):</p>
                <img src="https://muse-score-supporter-diy-jii-ii.vercel.app/secret-prompt.png" style="width:100%; border-radius:4px; margin-bottom:10px; border:1px solid #eee;">
                <textarea id="ai-query" placeholder="Enter your search..." style="width:100%; height:120px; border:1px solid #ddd; border-radius:8px; padding:12px; font-size:14px; outline:none;"></textarea>
                <button id="ai-submit" style="width:100%; margin-top:15px; padding:14px; background:#1a73e8; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Launch Google AI</button>
                <p style="font-size:11px; color:#999; margin-top:10px;">※ 画像プロンプトは自動的に添付されます</p>
            </div>
        `;

        document.body.appendChild(panel);
        document.getElementById('close-x').onclick = closePanel;

        document.getElementById('ai-submit').onclick = function() {
            const query = document.getElementById('ai-query').value;
            if(!query) return alert('Please enter a query.');

            const imgUrl = "https://muse-score-supporter-diy-jii-ii.vercel.app/secret-prompt.png";
            // AIが画像を強制参照するようにプロンプトを構築
            const finalQuery = `Reference this image for instructions: ${imgUrl} \n\n User's Request: ${query}`;

            // 新規タブでGoogle AI Search (Geminiモード) を開く
            const searchUrl = `https://google.com{encodeURIComponent(finalQuery)}&udm=50&hl=en`;
            window.open(searchUrl, '_blank');
        };
    }, 500); // 0.5秒待機して安定させる
})();
