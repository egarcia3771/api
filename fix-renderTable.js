// 修复后的 renderTable 函数
async function renderTable(data) {
    const emailTableBody = document.querySelector('#email-table tbody');
    emailTableBody.innerHTML = '';
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = data.slice(start, end);
    
    for (let index = 0; index < pageData.length; index++) {
        const item = pageData[index];
        const row = document.createElement('tr');
        
        // 复选框
        const checkboxCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.email = item.email;
        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell);
        
        // 邮箱
        row.appendChild(document.createElement('td')).textContent = item.email;
        
        // 密码
        const passwordCell = document.createElement('td');
        passwordCell.className = 'password-cell';
        const passwordSpan = document.createElement('span');
        passwordSpan.className = 'password-text';
        passwordSpan.textContent = passwordVisible ? item.password : '••••••••';
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = passwordVisible ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            const isVisible = passwordSpan.textContent !== '••••••••';
            passwordSpan.textContent = isVisible ? '••••••••' : item.password;
            toggleBtn.innerHTML = isVisible ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        };
        passwordCell.appendChild(passwordSpan);
        passwordCell.appendChild(toggleBtn);
        row.appendChild(passwordCell);
        
        // 分组
        row.appendChild(document.createElement('td')).textContent = item.group || '默认分组';
        
        // 备注
        const remarkCell = document.createElement('td');
        remarkCell.className = 'remark-cell';
        remarkCell.title = item.remark || '无备注';
        remarkCell.textContent = item.remark || '无备注';
        row.appendChild(remarkCell);
        
        // Client ID
        row.appendChild(document.createElement('td')).textContent = item.clientId;
        
        // Refresh Token
        const refreshTokenCell = document.createElement('td');
        refreshTokenCell.className = 'refresh-token';
        refreshTokenCell.title = item.refreshToken;
        refreshTokenCell.textContent = item.refreshToken.substring(0, 20) + '...';
        row.appendChild(refreshTokenCell);
        
        // API短链接 - 关键修复点
        const shortUrlCell = document.createElement('td');
        shortUrlCell.className = 'short-url-cell';
        
        if (item.shortUrl) {
            // 如果已有短链接,直接显示
            const link = document.createElement('a');
            link.href = item.shortUrl;
            link.target = '_blank';
            link.textContent = '查看链接';
            link.style.color = '#4CAF50';
            shortUrlCell.appendChild(link);
        } else {
            // 如果没有短链接,显示"生成中..."并异步生成
            shortUrlCell.textContent = '生成中...';
            shortUrlCell.style.color = '#888';
            
            // 异步生成短链接
            generateShortLink(item).then(shortUrl => {
                if (shortUrl) {
                    // 生成成功,保存并更新显示
                    saveShortUrlToStorage(item.email, shortUrl);
                    shortUrlCell.innerHTML = '';
                    const link = document.createElement('a');
                    link.href = shortUrl;
                    link.target = '_blank';
                    link.textContent = '查看链接';
                    link.style.color = '#4CAF50';
                    shortUrlCell.appendChild(link);
                } else {
                    // 生成失败
                    shortUrlCell.textContent = '生成失败';
                    shortUrlCell.style.color = '#f44336';
                }
            }).catch(error => {
                console.error('生成短链接异常:', error);
                shortUrlCell.textContent = '生成失败';
                shortUrlCell.style.color = '#f44336';
            });
        }
        row.appendChild(shortUrlCell);
        
        // 操作按钮
        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions';
        actionsCell.innerHTML = `
            <button onclick="viewInbox(${start + index})">收件箱</button>
            <button onclick="viewJunk(${start + index})">垃圾箱</button>
            <button onclick="editEmail(${start + index})">编辑</button>
            <button onclick="showDeleteConfirm(${start + index})" class="delete-btn">删除</button>
        `;
        row.appendChild(actionsCell);
        
        emailTableBody.appendChild(row);
    }
}
