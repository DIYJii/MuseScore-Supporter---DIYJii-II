(function() {
  // --- 設定値 ---
  // あなたのVercelリポジトリのベースURL（末尾にスラッシュは不要）
  var VERCEL_BASE_URL = 'https://muse-score-supporter-diy-jii-ii.vercel.app';
  var PANEL_WIDTH = '380px';
  var PANEL_ID = 'my-ai-sidebar';
  
  // 6カテゴリを廃止し、すべての検索文を1つの固定キーで保存
  var STORAGE_KEY = 'musescore_saved_queries_all'; 
  
  var MS_DARK_BLUE = '#172b4d'; 
  var SEARCH_BLUE = '#0d47a1'; 
  var CLEAR_RED = '#d32f2f'; 
  
  var detectedLanguage = navigator.language || 'en';
  var detectedSite = location.hostname || 'unknown';

  // --- 2. 起動時のGoogle AI Search判定・自動送り込み ---
  var isGoogleSearch = location.hostname.indexOf('google.com') !== -1;
  var isAISearch = location.search.indexOf('udm=50') !== -1;

  // 外部サイトから起動、または通常のGoogleから起動された場合（AI Searchが未起動）
  if (!isGoogleSearch || !isAISearch) {
    // VercelからSysInstruction.pdf（テキストデータ）を取得して、クエリとしてGoogleに投げる
    fetch(VERCEL_BASE_URL + '/SysInstruction.pdf')
      .then(function(res) { 
        if(!res.ok) throw new Error(); 
        return res.text(); 
      })
      .then(function(instructionText) {
        // SysInstruction.pdfのテキストをそのまま検索クエリとしてGoogle AI Searchを起動
        var fullQuery = instructionText.trim();
        var searchUrl = 'https://www.google.com/search?q=' + encodeURIComponent(fullQuery) + '&udm=50&aep=11&sourceid=chrome';
        location.href = searchUrl;
      })
      .catch(function(err) {
        // 万が一取得に失敗した場合は通常のAI Search画面を開く
        location.href = 'https://google.com';
      });
    return; // リダイレクトするためここで処理を終了
  }

  // すでにGoogle AI Search画面にいる場合は、いつものようにサイドパネルを構築
  if (document.getElementById(PANEL_ID)) { closePanel(); return; }

  function closePanel() {
    document.documentElement.style.width = '';
    var p = document.getElementById(PANEL_ID);
    if (p) p.remove();
  }

  function getCleanContext() {
    var clone = document.body.cloneNode(true);
    var ignore = clone.querySelectorAll('script, style, noscript, iframe, nav, footer, .ads, .user-nav, button, .post-actions, .moderation-menu, .flag-button');
    ignore.forEach(el => el.remove());
    
    var mainArea = clone.querySelector('article, main, .forum-post-content, .node-content') || clone;
    var links = mainArea.querySelectorAll('a');
    links.forEach(link => {
      if (link.offsetWidth > 0 || link.offsetHeight > 0) {
        var textNode = document.createTextNode(link.innerText);
        link.parentNode.replaceChild(textNode, link);
      } else {
        link.remove();
      }
    });
    return mainArea.innerText.replace(/\s+/g, ' ').trim().substring(0, 5000);
  }

  // --- 1 & 2. VercelからSysInstruction.pdfを取得する関数 ---
  async function getSysInstruction() {
    try {
      const response = await fetch(VERCEL_BASE_URL + '/SysInstruction.pdf');
      if (!response.ok) throw new Error('Network response was not ok');
      const text = await response.text();
      return text.trim();
    } catch (error) {
      console.error("Failed to fetch SysInstruction.pdf:", error);
      return ""; 
    }
  }

  // --- UI構築 ---
  var panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.style.cssText = `
    position:fixed; top:0px; bottom:0; right:0; width:${PANEL_WIDTH};
    background:#fcfcfc; border-left:1px solid #ccc; z-index:2147483647;
    font-family:sans-serif; display:flex; flex-direction:column;
    box-shadow:-5px 0 15px rgba(0,0,0,0.1); box-sizing:border-box;
  `;
  
  var btnBase = "display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; border-radius:4px; font-weight:bold; color:white; box-sizing:border-box; height:32px; font-size:12px;";

  // 3. Subscriptions等の上部6つボタン（prompt-area）をHTML構造から完全に削除
  panel.innerHTML = `
    <div style="background:#fff; padding:5px 15px; border-top:2px solid #ccc; display:flex; justify-content:center; align-items:center; height:40px; flex-shrink:0; position:relative;">
      <span style="font-weight:900; color:${MS_DARK_BLUE}; font-size:22px;">MuseScore Supporter</span>
      <button id="close-x" style="cursor:pointer; border:none; background:none; font-size:28px; color:#aaa; position:absolute; right:15px;">&times;</button>
    </div>
    <div id="top-area" style="padding:5px 15px; display:flex; flex-direction:column; gap:6px; flex:1; min-height:0; background:rgba(232, 245, 233, 0.4);">
      <textarea id="ai-query" placeholder="-Type your query for AI Search.\\n-Use '#context' to refer to the text on the left.\\n-To search within a specific site: Site:https://\\n-Enter keywords for a standard search." style="width:100%; flex:1; border:2px solid #bbb; border-radius:6px; padding:8px; font-size:13px; color:#000; resize:none; box-sizing:border-box; outline:none; background:#fff; overflow-y:auto;"></textarea>
      <div style="display:flex; gap:8px; flex-shrink:0;">
        <button id="ai-submit" style="${btnBase} background:${SEARCH_BLUE}; flex:1;">AI Search</button>
        <button id="web-search" style="${btnBase} background:${SEARCH_BLUE}; flex:1;">Key Words Search</button>
      </div>
      <div style="display:flex; gap:8px; flex-shrink:0;">
        <button id="ai-save" style="${btnBase} background:#ef6c00; flex:1;">Save Query</button>
        <button id="ai-clear" style="${btnBase} background:${CLEAR_RED}; flex:1;">Clear Query</button>
      </div>
    </div>
    <!-- Lower Window (History) -->
    <div id="history-container" style="margin:5px 15px 0px 15px; display:flex; flex-direction:column; flex:1; min-height:0; background:rgba(232, 245, 233, 0.4); border:2px solid #bbb; border-radius:6px; overflow:hidden;">
      <div style="flex-grow:1; overflow-y:auto; padding:3px;" id="query-list"></div>
    </div>
    <div style="padding:4px 8px 10px 8px; text-align:center; height:40px; font-size:11px; font-weight:bold; color:${MS_DARK_BLUE}; background:#fff; border-top:1px solid #eee; flex-shrink:0;">Powered by Google AI Search</div>
  `;
  
  document.body.appendChild(panel);
  document.documentElement.style.width = `calc(100% - ${PANEL_WIDTH})`;
  
  var tx = document.getElementById('ai-query');

  // --- 3. 単一フォルダ（分類なしの一元保存）としての履歴描画処理 ---
  function loadQueries() {
    var listCont = document.getElementById('query-list');
    listCont.innerHTML = '';
    
    var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    saved.forEach((q, idx) => {
      var row = document.createElement('div');
      row.draggable = true;
      row.style.cssText = "background:#fff; border-bottom:1px solid #eee; padding:2px 8px; font-size:11px; color:#000; display:flex; align-items:center; height:22px; box-sizing:border-box; position:relative; cursor:grab;";
      
      var txt = document.createElement('span');
      txt.style.cssText = "flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer;";
      txt.innerText = "- " + q.replace(/\n/g, ' ');
      txt.onclick = () => { tx.value = q; };
      
      var delBtn = document.createElement('button');
      delBtn.innerHTML = '&times;';
      delBtn.style.cssText = "background:none; color:#aaa; border:none; cursor:pointer; font-size:16px; padding:0 3px; line-height:1;";
      delBtn.onclick = (e) => {
        e.stopPropagation();
        if (document.getElementById('confirm-pop')) return;
        var pop = document.createElement('div');
        pop.id = 'confirm-pop';
        pop.style.cssText = `position:absolute; right:30px; background:#455a64; color:#fff; padding:2px 8px; border-radius:4px; font-size:10px; display:flex; gap:6px; align-items:center; z-index:10;`;
        pop.innerHTML = `<span>Delete?</span><b id="del-yes" style="cursor:pointer; color:#ff8a65;">YES</b><b id="del-no" style="cursor:pointer;">NO</b><div style="position:absolute; right:-6px; top:6px; border-top:5px solid transparent; border-bottom:5px solid transparent; border-left:6px solid #455a64;"></div>`;
        
        pop.querySelector('#del-yes').onclick = () => { 
          saved.splice(idx, 1); 
          localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); 
          loadQueries(); 
        };
        pop.querySelector('#del-no').onclick = () => pop.remove();
        row.appendChild(pop);
      };
      
      row.ondragstart = (e) => { e.dataTransfer.setData('text/plain', idx); row.style.opacity = '0.5'; };
      row.ondragend = () => { row.style.opacity = '1'; };
      row.ondragover = (e) => { e.preventDefault(); };
      row.ondrop = (e) => {
        e.preventDefault();
        var fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
        var toIdx = idx;
        if (fromIdx === toIdx) return;
        var item = saved.splice(fromIdx, 1)[0]; 
        saved.splice(toIdx, 0, item);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        loadQueries();
      };
      row.appendChild(txt);
      row.appendChild(delBtn);
      listCont.appendChild(row);
    });
  }

  // 初期ロードの実行
  loadQueries();
  
  // 保存ボタンの処理（分類なしで一括保存）
  document.getElementById('ai-save').onclick = () => {
    var q = tx.value.trim();
    if (!q) return;
    var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!saved.includes(q)) { 
      saved.unshift(q); 
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); 
      loadQueries(); 
    }
  };
