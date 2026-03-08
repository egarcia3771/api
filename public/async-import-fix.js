// 邮箱异步导入优化脚本 - 消除转圈圈等待
// 使用方法: 在mail.html页面的控制台粘贴此脚本

(function() {
    console.log('🚀 异步导入优化脚本已加载');

    // 保存原始函数
    const originalProcessImport = window.processImport;
    const originalExecuteImport = window.executeImport;

    // 异步导入处理函数
    async function asyncProcessImport(content, delimiter) {
        // 立即关闭加载动画
        hideLoading();
        
        // 显示进度提示
        showModal('开始导入', '正在后台处理数据,请稍候...');
        
        const lines = content.split('\n').filter(line => line.trim() !== '');
        const encryptedData = localStorage.getItem('emailData') || '';
        let data = encryptedData ? decryptData(encryptedData) || [] : [];
        const existingEmails = new Set(data.map(item => item.email.toLowerCase()));
        
        let successCount = 0;
        let duplicateCount = 0;
        let errorCount = 0;
        const batchSize = 500; // 每批处理500条
        
        // 分批异步处理
        for (let i = 0; i < lines.length; i += batchSize) {
            // 使用setTimeout让出主线程,避免阻塞UI
            await new Promise(resolve => setTimeout(resolve, 0));
            
            const batch = lines.slice(i, i + batchSize);
            const batchStart = successCount;
            
            batch.forEach(line => {
                const fields = line.split(delimiter).map(field => field.trim());
                if (fields.length >= 4) {
                    const email = fields[0].trim();
                    const password = fields[1].trim();
                    let group = '默认分组';
                    let remark = '';
                    let clientId = '';
                    let refreshToken = '';
                    
                    if (fields.length >= 6) {
                        group = fields[2].trim() || '默认分组';
                        remark = fields[3].trim();
                        clientId = fields[4].trim();
                        refreshToken = fields[5].trim();
                    } else {
                        clientId = fields[2].trim();
                        refreshToken = fields[3].trim();
                    }
                    
                    if (email && password && clientId && refreshToken) {
                        if (existingEmails.has(email.toLowerCase())) {
                            duplicateCount++;
                            return;
                        }
                        
                        const groups = getGroups();
                        if (!groups.includes(group)) {
                            groups.push(group);
                            saveGroups(groups);
                        }
                        
                        data.push({email, password, group, remark, clientId, refreshToken});
                        existingEmails.add(email.toLowerCase());
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } else {
                    errorCount++;
                }
            });
            
            // 每批保存一次
            try {
                localStorage.setItem('emailData', encryptData(data));
                
                // 更新进度提示
                const progress = Math.floor(((i + batchSize) / lines.length) * 100);
                const batchSuccess = successCount - batchStart;
                console.log(`✅ 进度: ${Math.min(progress, 100)}% | 已导入: ${successCount} 条 | 本批: ${batchSuccess} 条`);
                
                // 每5批更新一次界面
                if (i % (batchSize * 5) === 0) {
                    showModal('导入进度', `已处理: ${Math.min(i + batchSize, lines.length)}/${lines.length}<br>成功: ${successCount} 条<br>重复: ${duplicateCount} 条<br>错误: ${errorCount} 条`);
                }
                
            } catch (e) {
                console.error('❌ 存储失败,已达到配额上限:', e);
                showModal('配额已满', `已成功导入 ${successCount} 条数据,无法继续导入更多。<br><br>建议:<br>1. 导出当前数据备份<br>2. 清理不需要的数据<br>3. 使用服务端存储方案`);
                loadData();
                return;
            }
        }
        
        // 完成后刷新界面
        loadData();
        showModal('导入完成', `✅ 成功导入：${successCount} 条<br>⚠️ 重复跳过：${duplicateCount} 条<br>❌ 格式错误：${errorCount} 条`);
        console.log('🎉 导入完成!', {successCount, duplicateCount, errorCount});
    }

    // 替换原始函数
    window.processImport = asyncProcessImport;

    // 优化executeImport,移除showLoading调用
    window.executeImport = function() {
        const delimiter = document.getElementById('modal-delimiter').value.trim();
        if (!delimiter) {
            showModal('错误', '请输入分隔符！');
            return;
        }
        
        const fileInput = document.getElementById('modal-file-input');
        const pasteInput = document.getElementById('modal-paste-input');
        const pasteContent = pasteInput.value.trim();
        const hasClickFile = fileInput && fileInput.files && fileInput.files.length > 0;
        const hasDragFile = window.draggedFile !== null;
        const hasPaste = pasteContent !== '';
        
        if (!hasClickFile && !hasDragFile && !hasPaste) {
            showModal('错误', '请选择文件或粘贴数据！');
            return;
        }
        
        let file = null;
        if (hasDragFile) {
            file = window.draggedFile;
        } else if (hasClickFile) {
            file = fileInput.files[0];
        }
        
        closeImportMethodModal();
        
        if (hasPaste) {
            asyncProcessImport(pasteContent, delimiter);
        } else if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                asyncProcessImport(e.target.result, delimiter);
                window.draggedFile = null;
            };
            reader.readAsText(file);
        } else {
            showModal('错误', '文件读取失败,请重新选择文件！');
        }
    };

    console.log('✅ 异步导入优化已启用 - 导入时不再显示转圈圈!');
    showModal('优化已启用', '✅ 异步导入优化已加载<br><br>现在导入邮箱时:<br>• 不会显示转圈圈<br>• 不会阻塞界面<br>• 可以实时查看进度<br>• 支持大批量数据');
})();
