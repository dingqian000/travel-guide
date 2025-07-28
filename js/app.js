
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
