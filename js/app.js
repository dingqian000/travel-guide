
// 旅游攻略助手JavaScript功能

// 预算计算器
class BudgetCalculator {
    constructor() {
        this.budgetMultiplier = {
            '经济': 0.8,
            '中等': 1.0,
            '豪华': 1.5
        };
        
        this.baseBudget = {
            '住宿': 100,
            '餐饮': 120,
            '交通': 80,
            '门票': 60,
            '其他': 40
        };
    }
    
    calculate(peopleCount, days, budgetLevel) {
        const multiplier = this.budgetMultiplier[budgetLevel] || 1.0;
        const result = {};
        let totalBudget = 0;
        
        for (const [category, dailyCost] of Object.entries(this.baseBudget)) {
            let totalCost;
            if (category === '交通') {
                // 交通费按总行程计算，不是每天
                totalCost = dailyCost * multiplier * peopleCount * 2; // 往返
            } else {
                totalCost = dailyCost * multiplier * peopleCount * days;
            }
            result[category] = Math.round(totalCost);
            totalBudget += totalCost;
        }
        
        result['总计'] = Math.round(totalBudget);
        result['人均'] = Math.round(totalBudget / peopleCount);
        result['预算等级'] = budgetLevel;
        
        return result;
    }
}

// 初始化预算计算器
const budgetCalculator = new BudgetCalculator();

// 预算计算功能
function calculateBudget() {
    const peopleCount = parseInt(document.getElementById('people_count').value);
    const days = parseInt(document.getElementById('days').value);
    const budgetLevel = document.getElementById('budget_level').value;
    
    if (!peopleCount || !days) {
        alert('请填写完整的信息');
        return;
    }
    
    // 显示加载动画
    const resultDiv = document.getElementById('budget-result');
    resultDiv.innerHTML = '<div class="text-center"><div class="loading"></div> 计算中...</div>';
    
    // 模拟计算延迟
    setTimeout(() => {
        const result = budgetCalculator.calculate(peopleCount, days, budgetLevel);
        displayBudgetResult(result);
    }, 500);
}

// 显示预算结果
function displayBudgetResult(result) {
    const resultDiv = document.getElementById('budget-result');

    // 保存预算结果到本地存储，供花费记录页面使用
    localStorage.setItem('lastBudgetResult', JSON.stringify(result));

    let html = `
        <div class="budget-result fade-in">
            <h6 class="mb-3">💰 预算详情（${result['预算等级']}型）</h6>
            <div class="row">
                <div class="col-6">
                    <p class="mb-2"><strong>总预算：</strong></p>
                    <h4 class="text-primary">¥${result['总计'].toLocaleString()}</h4>
                </div>
                <div class="col-6">
                    <p class="mb-2"><strong>人均：</strong></p>
                    <h4 class="text-success">¥${result['人均'].toLocaleString()}</h4>
                </div>
            </div>
            <hr>
            <div class="row">
    `;

    for (const [category, amount] of Object.entries(result)) {
        if (!['总计', '人均', '预算等级'].includes(category)) {
            html += `
                <div class="col-6 mb-2">
                    <small class="text-muted">${category}</small><br>
                    <strong>¥${amount.toLocaleString()}</strong>
                </div>
            `;
        }
    }

    html += `
            </div>
            <div class="mt-3">
                <small class="text-muted">
                    💡 提示：预算仅供参考，实际费用可能因季节、选择而有所不同
                </small>
            </div>
            <div class="mt-3">
                <a href="expense.html" class="btn btn-outline-primary btn-sm">
                    📊 去记录实际花费
                </a>
            </div>
        </div>
    `;

    resultDiv.innerHTML = html;
}

// 打包清单功能
function toggleAllItems(checked) {
    const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = checked);
    updateProgress();
}

function updateProgress() {
    const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    const checkedCount = document.querySelectorAll('.checklist-item input[type="checkbox"]:checked').length;
    const totalCount = checkboxes.length;
    const percentage = Math.round((checkedCount / totalCount) * 100);
    
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    if (progressBar) {
        progressBar.style.width = percentage + '%';
        progressBar.setAttribute('aria-valuenow', percentage);
    }
    
    if (progressText) {
        progressText.textContent = `已完成 ${checkedCount}/${totalCount} 项 (${percentage}%)`;
    }
}

// 保存清单状态到本地存储
function saveChecklistState() {
    const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    const state = {};
    
    checkboxes.forEach((cb, index) => {
        state[index] = cb.checked;
    });
    
    localStorage.setItem('travelChecklistState', JSON.stringify(state));
}

// 加载清单状态
function loadChecklistState() {
    const savedState = localStorage.getItem('travelChecklistState');
    if (savedState) {
        const state = JSON.parse(savedState);
        const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
        
        checkboxes.forEach((cb, index) => {
            if (state[index] !== undefined) {
                cb.checked = state[index];
            }
        });
        
        updateProgress();
    }
}

// 打印功能
function printPage() {
    window.print();
}

// 分享功能
function shareGuide() {
    if (navigator.share) {
        navigator.share({
            title: '旅游攻略助手',
            text: '广西柳州出发-云南9日亲子游攻略',
            url: window.location.href
        });
    } else {
        // 复制链接到剪贴板
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('链接已复制到剪贴板');
        });
    }
}

// 花费记录管理类
class ExpenseManager {
    constructor() {
        this.expenses = this.loadExpenses();
        this.filteredExpenses = [...this.expenses];
        this.viewMode = 'grouped'; // 'grouped' 或 'list'

        this.categoryIcons = {
            '住宿': '🏨',
            '餐饮': '🍽️',
            '交通': '🚗',
            '门票': '🎫',
            '购物': '🛍️',
            '其他': '📦'
        };

        this.categoryColors = {
            '住宿': '#FF6384',
            '餐饮': '#36A2EB',
            '交通': '#FFCE56',
            '门票': '#4BC0C0',
            '购物': '#9966FF',
            '其他': '#FF9F40'
        };

        // 子类别定义
        this.subcategories = {
            '住宿': ['酒店', '民宿', '青旅', '客栈', '度假村'],
            '餐饮': ['早餐', '午餐', '晚餐', '小食', '饮品', '特色美食'],
            '交通': ['飞机', '火车', '汽车', '出租车', '公交', '地铁', '船票', '租车'],
            '门票': ['景点门票', '演出票', '体验项目', '导游费', '停车费'],
            '购物': ['纪念品', '特产', '服装', '日用品', '药品'],
            '其他': ['保险', '小费', '通讯', '紧急支出', '杂费']
        };

        this.chart = null;
    }

    // 加载花费记录
    loadExpenses() {
        const saved = localStorage.getItem('travelExpenses');
        return saved ? JSON.parse(saved) : [];
    }

    // 保存花费记录
    saveExpenses() {
        localStorage.setItem('travelExpenses', JSON.stringify(this.expenses));
    }

    // 添加花费记录
    addExpense(expense) {
        expense.id = Date.now().toString();
        expense.timestamp = new Date().toISOString();
        this.expenses.push(expense);
        this.saveExpenses();
        this.updateDisplay();
    }

    // 删除花费记录
    deleteExpense(id) {
        this.expenses = this.expenses.filter(expense => expense.id !== id);
        this.saveExpenses();
        this.updateDisplay();
    }

    // 更新花费记录
    updateExpense(id, updatedExpense) {
        const index = this.expenses.findIndex(expense => expense.id === id);
        if (index !== -1) {
            this.expenses[index] = { ...this.expenses[index], ...updatedExpense };
            this.saveExpenses();
            this.updateDisplay();
        }
    }

    // 获取统计数据
    getStatistics() {
        const total = this.expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
        const count = this.expenses.length;

        // 计算天数
        const dates = this.expenses.map(expense => expense.date);
        const uniqueDates = [...new Set(dates)];
        const days = uniqueDates.length;

        // 按类别统计
        const categoryStats = {};
        this.expenses.forEach(expense => {
            const category = expense.category;
            categoryStats[category] = (categoryStats[category] || 0) + parseFloat(expense.amount);
        });

        return {
            total,
            count,
            days,
            dailyAverage: days > 0 ? total / days : 0,
            categoryStats
        };
    }

    // 更新显示
    updateDisplay() {
        this.filteredExpenses = [...this.expenses];
        this.updateStatistics();
        this.updateExpenseList();
        this.updateChart();
        this.updateBudgetComparison();
    }

    // 更新统计信息
    updateStatistics() {
        const stats = this.getStatistics();

        document.getElementById('total-expense').textContent = `¥${stats.total.toLocaleString()}`;
        document.getElementById('expense-count').textContent = stats.count;
        document.getElementById('travel-days').textContent = stats.days;
        document.getElementById('daily-average').textContent = `¥${Math.round(stats.dailyAverage).toLocaleString()}`;
    }

    // 更新花费列表
    updateExpenseList() {
        const listContainer = document.getElementById('expense-list');
        const countElement = document.getElementById('expense-list-count');

        if (this.filteredExpenses.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center text-muted py-5">
                    <div style="font-size: 3rem;">📊</div>
                    <p>${this.expenses.length === 0 ? '还没有花费记录' : '没有符合条件的记录'}</p>
                    <small>${this.expenses.length === 0 ? '请在左侧添加您的第一笔花费' : '请调整筛选条件'}</small>
                </div>
            `;
            if (countElement) countElement.textContent = '0';
            return;
        }

        if (countElement) countElement.textContent = this.filteredExpenses.length;

        if (this.viewMode === 'grouped') {
            this.renderGroupedView(listContainer);
        } else {
            this.renderListView(listContainer);
        }
    }

    // 按日期分组显示
    renderGroupedView(container) {
        // 按日期分组
        const groupedByDate = {};
        this.filteredExpenses.forEach(expense => {
            const date = expense.date;
            if (!groupedByDate[date]) {
                groupedByDate[date] = [];
            }
            groupedByDate[date].push(expense);
        });

        // 按日期排序
        const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

        let html = '';
        sortedDates.forEach(date => {
            const expenses = groupedByDate[date];
            const dayTotal = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
            const dayName = this.getDayName(date);

            html += `
                <div class="date-group mb-4">
                    <div class="date-header d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
                        <div>
                            <h6 class="mb-0">📅 ${date} ${dayName}</h6>
                            <small class="text-muted">${expenses.length} 笔消费</small>
                        </div>
                        <div class="text-end">
                            <div class="h5 mb-0 text-primary">¥${dayTotal.toLocaleString()}</div>
                            <small class="text-muted">当日总计</small>
                        </div>
                    </div>
                    <div class="expenses-in-date">
            `;

            expenses.forEach(expense => {
                html += this.renderExpenseCard(expense, true);
            });

            html += `
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // 列表模式显示
    renderListView(container) {
        let html = '';
        this.filteredExpenses.forEach(expense => {
            html += this.renderExpenseCard(expense, false);
        });
        container.innerHTML = html;
    }

    // 渲染单个花费卡片
    renderExpenseCard(expense, isGrouped = false) {
        const icon = this.categoryIcons[expense.category] || '📦';
        const time = expense.time ? ` ${expense.time}` : '';
        const subcategory = expense.subcategory ? ` · ${expense.subcategory}` : '';
        const location = expense.location ? ` @ ${expense.location}` : '';
        const people = expense.people && expense.people > 1 ? ` (${expense.people}人)` : '';
        const necessary = expense.necessary ? ' ⭐' : '';
        const perPerson = expense.people && expense.people > 1 ?
            ` <small class="text-muted">(人均¥${(parseFloat(expense.amount) / expense.people).toFixed(2)})</small>` : '';

        return `
            <div class="expense-card card mb-2 ${isGrouped ? 'ms-3' : ''}">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-${isGrouped ? '3' : '2'}">
                            <div class="d-flex align-items-center">
                                <span class="badge category-badge me-2" style="background-color: ${this.categoryColors[expense.category]}">
                                    ${icon} ${expense.category}${subcategory}
                                </span>
                                ${necessary}
                            </div>
                            ${!isGrouped ? `<small class="text-muted">${expense.date}${time}</small>` :
                              (time ? `<small class="text-muted">${time}</small>` : '')}
                        </div>
                        <div class="col-md-${isGrouped ? '4' : '3'}">
                            <div class="fw-bold">${expense.title || '未命名费用'}</div>
                            <small class="text-muted">${location}${people}</small>
                        </div>
                        <div class="col-md-${isGrouped ? '3' : '4'}">
                            <div class="expense-amount text-primary">¥${parseFloat(expense.amount).toLocaleString()}</div>
                            ${perPerson}
                            ${expense.note ? `<small class="text-muted d-block">${expense.note}</small>` : ''}
                        </div>
                        <div class="col-md-2 text-end">
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="editExpense('${expense.id}')" title="编辑">
                                ✏️
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteExpenseConfirm('${expense.id}')" title="删除">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 获取星期几
    getDayName(dateString) {
        const date = new Date(dateString);
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return days[date.getDay()];
    }

    // 更新图表
    updateChart() {
        const canvas = document.getElementById('category-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const stats = this.getStatistics();

        // 销毁现有图表
        if (this.chart) {
            this.chart.destroy();
        }

        if (Object.keys(stats.categoryStats).length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#6c757d';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据', canvas.width / 2, canvas.height / 2);
            return;
        }

        const labels = Object.keys(stats.categoryStats);
        const data = Object.values(stats.categoryStats);
        const colors = labels.map(label => this.categoryColors[label]);

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.map(label => `${this.categoryIcons[label]} ${label}`),
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ¥${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // 更新预算对比
    updateBudgetComparison() {
        const comparisonDiv = document.getElementById('budget-comparison');
        if (!comparisonDiv) return;

        // 尝试获取保存的预算数据
        const savedBudget = localStorage.getItem('lastBudgetResult');
        if (!savedBudget) {
            comparisonDiv.innerHTML = `
                <p class="text-muted text-center">
                    <i class="fas fa-chart-pie fa-2x"></i><br>
                    暂无预算数据<br>
                    <small>请先在预算计算页面设置预算</small>
                </p>
            `;
            return;
        }

        const budget = JSON.parse(savedBudget);
        const stats = this.getStatistics();

        let html = '<h6 class="mb-3">💰 预算 vs 实际</h6>';

        for (const [category, budgetAmount] of Object.entries(budget)) {
            if (['总计', '人均', '预算等级'].includes(category)) continue;

            const actualAmount = stats.categoryStats[category] || 0;
            const percentage = budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0;
            const isOver = percentage > 100;

            html += `
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <small>${this.categoryIcons[category]} ${category}</small>
                        <small class="${isOver ? 'text-danger' : 'text-success'}">
                            ${percentage.toFixed(1)}%
                        </small>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar ${isOver ? 'bg-danger' : 'bg-success'}"
                             style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div class="d-flex justify-content-between">
                        <small class="text-muted">实际: ¥${actualAmount.toLocaleString()}</small>
                        <small class="text-muted">预算: ¥${budgetAmount.toLocaleString()}</small>
                    </div>
                </div>
            `;
        }

        comparisonDiv.innerHTML = html;
    }

    // 导出数据
    exportData() {
        const data = {
            expenses: this.expenses,
            statistics: this.getStatistics(),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `travel-expenses-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // 清空所有数据
    clearAll() {
        this.expenses = [];
        this.filteredExpenses = [];
        this.saveExpenses();
        this.updateDisplay();
    }

    // 筛选功能
    filterExpenses() {
        const categoryFilter = document.getElementById('filter-category')?.value || '';
        const dateFilter = document.getElementById('filter-date')?.value || '';

        this.filteredExpenses = this.expenses.filter(expense => {
            const categoryMatch = !categoryFilter || expense.category === categoryFilter;
            const dateMatch = !dateFilter || expense.date === dateFilter;
            return categoryMatch && dateMatch;
        });

        this.updateExpenseList();
        this.updateChart();
    }

    // 排序功能
    sortExpenses() {
        const sortBy = document.getElementById('sort-by')?.value || 'date-desc';

        this.filteredExpenses.sort((a, b) => {
            switch (sortBy) {
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'amount-asc':
                    return parseFloat(a.amount) - parseFloat(b.amount);
                case 'amount-desc':
                    return parseFloat(b.amount) - parseFloat(a.amount);
                case 'category':
                    return a.category.localeCompare(b.category);
                default:
                    return new Date(b.date) - new Date(a.date);
            }
        });

        this.updateExpenseList();
    }

    // 切换视图模式
    toggleViewMode() {
        const groupedRadio = document.getElementById('view-grouped');
        this.viewMode = groupedRadio?.checked ? 'grouped' : 'list';
        this.updateExpenseList();
    }

    // 重置筛选
    resetFilters() {
        const categoryFilter = document.getElementById('filter-category');
        const dateFilter = document.getElementById('filter-date');

        if (categoryFilter) categoryFilter.value = '';
        if (dateFilter) dateFilter.value = '';

        this.filteredExpenses = [...this.expenses];
        this.updateExpenseList();
        this.updateChart();
    }
}

// 初始化花费管理器
const expenseManager = new ExpenseManager();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 加载清单状态
    loadChecklistState();

    // 绑定清单变化事件
    const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            updateProgress();
            saveChecklistState();
        });
    });

    // 初始化花费记录页面
    if (document.getElementById('expense-form')) {
        initializeExpensePage();
    }

    // 添加淡入动画
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('fade-in');
        }, index * 100);
    });
});

// 天气信息
const weatherData = {
    '大理': {
        temp: '15-25°C',
        desc: '8月多雨，早晚温差大，需备外套',
        icon: '🌤️'
    },
    '西双版纳': {
        temp: '22-32°C', 
        desc: '8月湿热多雨，蚊虫较多，需防蚊',
        icon: '🌴'
    }
};

// 显示天气信息
function showWeatherInfo(city) {
    const weather = weatherData[city];
    if (weather) {
        alert(`${weather.icon} ${city}天气\n温度：${weather.temp}\n提醒：${weather.desc}`);
    }
}

// 花费记录页面功能
function initializeExpensePage() {
    // 设置默认日期为今天
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('expense-date');
    const editDateInput = document.getElementById('edit-expense-date');

    if (dateInput) dateInput.value = today;
    if (editDateInput) editDateInput.value = today;

    // 设置默认人数
    const peopleInput = document.getElementById('expense-people');
    if (peopleInput) peopleInput.value = '1';

    // 绑定表单提交事件
    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) {
        expenseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addExpenseRecord();
        });
    }

    // 初始化筛选器
    const filterCategory = document.getElementById('filter-category');
    const filterDate = document.getElementById('filter-date');
    const sortBy = document.getElementById('sort-by');

    if (filterCategory) filterCategory.addEventListener('change', filterExpenses);
    if (filterDate) filterDate.addEventListener('change', filterExpenses);
    if (sortBy) sortBy.addEventListener('change', sortExpenses);

    // 初始化视图模式切换
    const viewGrouped = document.getElementById('view-grouped');
    const viewList = document.getElementById('view-list');

    if (viewGrouped) viewGrouped.addEventListener('change', toggleViewMode);
    if (viewList) viewList.addEventListener('change', toggleViewMode);

    // 初始化显示
    expenseManager.updateDisplay();
}

// 添加花费记录
function addExpenseRecord() {
    const date = document.getElementById('expense-date').value;
    const time = document.getElementById('expense-time').value;
    const category = document.getElementById('expense-category').value;
    const subcategory = document.getElementById('expense-subcategory').value;
    const title = document.getElementById('expense-title').value;
    const amount = document.getElementById('expense-amount').value;
    const people = document.getElementById('expense-people').value;
    const location = document.getElementById('expense-location').value;
    const note = document.getElementById('expense-note').value;
    const necessary = document.getElementById('expense-necessary').checked;

    if (!date || !category || !title || !amount) {
        alert('请填写必要信息：日期、类别、费用名称和金额');
        return;
    }

    const expense = {
        date,
        time: time || null,
        category,
        subcategory: subcategory || null,
        title: title.trim(),
        amount: parseFloat(amount),
        people: parseInt(people) || 1,
        location: location.trim() || null,
        note: note.trim() || null,
        necessary: necessary
    };

    expenseManager.addExpense(expense);

    // 清空表单
    document.getElementById('expense-form').reset();
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('expense-people').value = '1';
    document.getElementById('expense-necessary').checked = false;

    // 隐藏子类别选择
    document.getElementById('subcategory-section').style.display = 'none';

    // 显示成功消息
    showToast('✅ 花费记录添加成功！');
}

// 编辑花费记录
function editExpense(id) {
    const expense = expenseManager.expenses.find(e => e.id === id);
    if (!expense) return;

    // 填充编辑表单
    document.getElementById('edit-expense-id').value = expense.id;
    document.getElementById('edit-expense-date').value = expense.date;
    document.getElementById('edit-expense-time').value = expense.time || '';
    document.getElementById('edit-expense-category').value = expense.category;
    document.getElementById('edit-expense-title').value = expense.title || '';
    document.getElementById('edit-expense-amount').value = expense.amount;
    document.getElementById('edit-expense-people').value = expense.people || 1;
    document.getElementById('edit-expense-location').value = expense.location || '';
    document.getElementById('edit-expense-note').value = expense.note || '';
    document.getElementById('edit-expense-necessary').checked = expense.necessary || false;

    // 更新子类别
    updateEditSubcategories();
    if (expense.subcategory) {
        document.getElementById('edit-expense-subcategory').value = expense.subcategory;
    }

    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('editExpenseModal'));
    modal.show();
}

// 更新花费记录
function updateExpense() {
    const id = document.getElementById('edit-expense-id').value;
    const date = document.getElementById('edit-expense-date').value;
    const time = document.getElementById('edit-expense-time').value;
    const category = document.getElementById('edit-expense-category').value;
    const subcategory = document.getElementById('edit-expense-subcategory').value;
    const title = document.getElementById('edit-expense-title').value;
    const amount = document.getElementById('edit-expense-amount').value;
    const people = document.getElementById('edit-expense-people').value;
    const location = document.getElementById('edit-expense-location').value;
    const note = document.getElementById('edit-expense-note').value;
    const necessary = document.getElementById('edit-expense-necessary').checked;

    if (!date || !category || !title || !amount) {
        alert('请填写必要信息：日期、类别、费用名称和金额');
        return;
    }

    const updatedExpense = {
        date,
        time: time || null,
        category,
        subcategory: subcategory || null,
        title: title.trim(),
        amount: parseFloat(amount),
        people: parseInt(people) || 1,
        location: location.trim() || null,
        note: note.trim() || null,
        necessary: necessary
    };

    expenseManager.updateExpense(id, updatedExpense);

    // 关闭模态框
    const modal = bootstrap.Modal.getInstance(document.getElementById('editExpenseModal'));
    modal.hide();

    showToast('✅ 花费记录更新成功！');
}

// 删除花费记录确认
function deleteExpenseConfirm(id) {
    if (confirm('确定要删除这条花费记录吗？')) {
        expenseManager.deleteExpense(id);
        showToast('🗑️ 花费记录已删除');
    }
}

// 导出花费记录
function exportExpenses() {
    expenseManager.exportData();
    showToast('📤 花费记录已导出');
}

// 清空所有花费记录
function clearAllExpenses() {
    if (confirm('确定要清空所有花费记录吗？此操作不可恢复！')) {
        expenseManager.clearAll();
        showToast('🗑️ 所有花费记录已清空');
    }
}

// 更新子类别选项
function updateSubcategories() {
    const category = document.getElementById('expense-category').value;
    const subcategorySection = document.getElementById('subcategory-section');
    const subcategorySelect = document.getElementById('expense-subcategory');

    if (category && expenseManager.subcategories[category]) {
        subcategorySelect.innerHTML = '<option value="">请选择子类别</option>';
        expenseManager.subcategories[category].forEach(sub => {
            subcategorySelect.innerHTML += `<option value="${sub}">${sub}</option>`;
        });
        subcategorySection.style.display = 'block';
    } else {
        subcategorySection.style.display = 'none';
    }
}

// 更新编辑模态框的子类别选项
function updateEditSubcategories() {
    const category = document.getElementById('edit-expense-category').value;
    const subcategorySection = document.getElementById('edit-subcategory-section');
    const subcategorySelect = document.getElementById('edit-expense-subcategory');

    if (category && expenseManager.subcategories[category]) {
        subcategorySelect.innerHTML = '<option value="">请选择子类别</option>';
        expenseManager.subcategories[category].forEach(sub => {
            subcategorySelect.innerHTML += `<option value="${sub}">${sub}</option>`;
        });
        subcategorySection.style.display = 'block';
    } else {
        subcategorySection.style.display = 'none';
    }
}

// 筛选功能
function filterExpenses() {
    expenseManager.filterExpenses();
}

// 排序功能
function sortExpenses() {
    expenseManager.sortExpenses();
}

// 切换视图模式
function toggleViewMode() {
    expenseManager.toggleViewMode();
}

// 显示提示消息
function showToast(message) {
    // 创建提示元素
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 20px;
        border-radius: 5px;
        z-index: 9999;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);

    // 自动隐藏
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}
