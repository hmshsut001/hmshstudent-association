# 和美高中學生會網站

這是一個可直接部署到 GitHub Pages 的靜態網站。訪客可以查看公告、活動、學生權益、幹部與部門職掌、資訊公開、歷屆學生會及意見提案入口。

## 預覽

請用本機網站伺服器開啟本資料夾，不要直接雙擊 `index.html`，否則瀏覽器可能阻擋 JSON 資料載入。

## 上線到 GitHub Pages

1. 將本資料夾內容放到 GitHub 公開儲存庫的預設分支。
2. 在儲存庫 Settings → Pages，選擇 Deploy from a branch。
3. 選擇預設分支與根目錄後儲存。
4. 設定 Google 試算表同步後，將 `config/google-sheets.example.json` 複製為 `config/google-sheets.json`，填入各工作表的「發布至網路」CSV 網址。

網站不需要伺服器、資料庫或付費主機。

## 資料更新方式

網站實際讀取 `data/site.json`。GitHub Actions 每 30 分鐘從公開的 Google Sheets CSV 下載資料、檢查格式，再更新這個 JSON。如此不會在瀏覽器中放置 API 金鑰，也不會受 Google Sheets 前端 CORS 影響。

只有預定公開的資料工作表可以「發布至網路」。學生提案表單回覆、姓名、電子郵件及其他個資不得公開。

完整設定請見同層輸出中的 `GOOGLE-MANAGEMENT.md`；換屆請見 `HANDOFF.md`。

## 第 10 屆資料狀態

第10屆幹部姓名依正式《學生會幹部名單》建立；組織架構與職掌依《學生會組織章程》呈現。後續換屆時，請在 Google 試算表新增屆次與幹部資料，不要覆蓋或刪除舊屆資料。
