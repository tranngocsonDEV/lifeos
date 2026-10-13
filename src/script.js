// =========================================================================
// LifeOS Alpine Component – all application logic
// =========================================================================
function lifeOSApp() {
  return {
    // --------------------------------------------------------------
    // 1. STATE (all data properties – persisted to localStorage)
    // --------------------------------------------------------------
    incomes: [],          // { id, desc, amount }
    expenses: [],         // { id, desc, amount, isBill, dueDate }
    savingsGoal: { target: 250000000, current: 90000000 },
    emergency: { target: 200000000, current: 55000000 },
    debtTotal: 160000000,      // tổng nợ
    debtPaid: 45000000,         // số tiền đã trả
    pantryItems: [],      // { id, name, qty, expiry, calsPerUnit }
    prepTasks: [],        // { id, name, completed }
    habitsList: [],       // { id, name, completed }
    inventoryItems: [],   // { id, name, category, status }
    notesText: "",

    // helper: unique ID for new items
    generateId() {
      return Date.now() + '-' + Math.random().toString(36).substr(2, 8);
    },

    // --------------------------------------------------------------
    // 2. PERSISTENCE: save whole state as single JSON object
    // --------------------------------------------------------------
    saveToLocalStorage() {
      const fullState = {
        incomes: this.incomes,
        expenses: this.expenses,
        savingsGoal: this.savingsGoal,
        emergency: this.emergency,
        debtTotal: this.debtTotal,
        debtPaid: this.debtPaid,
        pantryItems: this.pantryItems,
        prepTasks: this.prepTasks,
        habitsList: this.habitsList,
        inventoryItems: this.inventoryItems,
        notesText: this.notesText
      };
      localStorage.setItem('lifeOS_state', JSON.stringify(fullState));
    },

    // load from localStorage or init with default example data
    initializeApp() {
      const saved = localStorage.getItem('lifeOS_state');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          Object.assign(this, data);
        } catch (e) {
          console.warn(e);
          this.loadDefaultData();
        }
      } else {
        this.loadDefaultData();
      }
      // auto-save whenever any of these arrays/objects change
      ['incomes', 'expenses', 'pantryItems', 'prepTasks', 'habitsList', 'inventoryItems', 'notesText', 'savingsGoal', 'emergency'].forEach(key => {
        this.$watch(key, () => this.saveToLocalStorage(), { deep: true });
      });
      this.$watch('debtTotal', () => this.saveToLocalStorage());
      this.$watch('debtPaid', () => this.saveToLocalStorage());
    },

    // sensible starter data for first-time users
    loadDefaultData() {
      this.incomes = [
        { id: this.generateId(), desc: 'Lương (hàng tháng)', amount: 32000000 },
        { id: this.generateId(), desc: 'Làm thêm', amount: 4500000 }
      ];
      this.expenses = [
        { id: this.generateId(), desc: 'Thuê nhà', amount: 16000000, isBill: true, dueDate: '2026-05-01' },
        { id: this.generateId(), desc: 'Điện', amount: 1200000, isBill: true, dueDate: '2026-05-12' },
        { id: this.generateId(), desc: 'Mua groceries', amount: 4200000, isBill: false, dueDate: null },
        { id: this.generateId(), desc: 'Internet', amount: 700000, isBill: true, dueDate: '2026-05-18' }
      ];
      this.pantryItems = [
        { id: this.generateId(), name: 'Cá ngừ đóng hộp', qty: 6, expiry: '2026-10-20', calsPerUnit: 200 },
        { id: this.generateId(), name: 'Gạo (kg)', qty: 3, expiry: '2027-01-05', calsPerUnit: 1300 },
        { id: this.generateId(), name: 'Đậu đóng hộp', qty: 4, expiry: '2026-05-30', calsPerUnit: 350 }
      ];
      this.prepTasks = [
        { id: this.generateId(), name: '✅ Túi khẩn cấp đã chuẩn bị (quần áo, tiền mặt, giấy tờ)', completed: false },
        { id: this.generateId(), name: '💧 Đã dự trữ nước (3+ gallon/người)', completed: false },
        { id: this.generateId(), name: '🔦 Đèn pin & pin & radio', completed: true },
        { id: this.generateId(), name: '📄 Kế hoạch liên lạc gia đình & điểm hẹn', completed: false },
        { id: this.generateId(), name: '⚡ Dự phòng mất điện (điện thoại, chăn)', completed: false }
      ];
      this.habitsList = [
        { id: this.generateId(), name: '💧 Uống đủ nước', completed: false },
        { id: this.generateId(), name: '😴 Ngủ 7h', completed: false },
        { id: this.generateId(), name: '🌿 Thời gian ngoài trời', completed: false },
        { id: this.generateId(), name: '🏃 Tập thể dục / kéo giãn', completed: false },
        { id: this.generateId(), name: '🚫 Ngày không chi tiêu', completed: false },
        { id: this.generateId(), name: '🧹 Dọn dẹp nhanh (15 phút)', completed: false },
        { id: this.generateId(), name: '📖 Đọc / học tập', completed: false }
      ];
      this.inventoryItems = [
        { id: this.generateId(), name: 'Dụng cụ đa năng & dao', category: 'Dụng cụ', status: 'tốt' },
        { id: this.generateId(), name: 'Túi sơ cứu', category: 'Sơ cứu', status: 'tốt' },
        { id: this.generateId(), name: 'Giấy tờ quan trọng (thư mục)', category: 'Tài liệu', status: 'kiểm tra hạn sử dụng' },
        { id: this.generateId(), name: 'Bếp di động', category: 'Dụng cụ sinh tồn', status: 'thay nhiên liệu' }
      ];
      this.notesText = '🏡 Cuộc họp khẩn cấp: garage của hàng xóm\n📞 Liên hệ khẩn cấp: Mẹ + bạn đồng hành\n🎯 Kế hoạch bão mùa đông: thêm chăn, nước, kế hoạch thú cưng.\nMục tiêu tài chính: trả 20% nợ trong quý này.';
      this.saveToLocalStorage();
    },

    // --------------------------------------------------------------
    // 3. COMPUTED PROPERTIES (dashboard signals)
    // --------------------------------------------------------------
    get weeklyNet() {
      const totalMonthlyIncome = this.incomes.reduce((s, i) => s + i.amount, 0);
      const totalMonthlyExpenses = this.expenses.reduce((s, e) => s + e.amount, 0);
      return (totalMonthlyIncome - totalMonthlyExpenses) / 4.345;
    },

    get monthlyNetIncome() {
      return this.incomes.reduce((s, i) => s + i.amount, 0) - this.expenses.reduce((s, e) => s + e.amount, 0);
    },

    get upcomingBills() {
      const today = new Date().toISOString().slice(0, 10);
      return this.expenses
        .filter(e => e.isBill && e.dueDate && e.dueDate >= today)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    },

    get expiringItems() {
      const today = new Date();
      const threeDays = new Date();
      threeDays.setDate(today.getDate() + 3);
      return this.pantryItems.filter(item => {
        if (!item.expiry) return false;
        const expDate = new Date(item.expiry);
        return expDate <= threeDays && expDate >= today;
      });
    },

    get emergencyPercent() {
      return (this.emergency.current / this.emergency.target) * 100;
    },

    get completedHabitsCount() {
      return this.habitsList.filter(h => h.completed).length;
    },

    get prepScore() {
      if (!this.prepTasks.length) return 0;
      return Math.round((this.prepTasks.filter(t => t.completed).length / this.prepTasks.length) * 100);
    },

    get survivalNumberWeekly() {
      const essential = this.expenses
        .filter(e => e.desc.toLowerCase().includes('thuê') ||
          e.desc.toLowerCase().includes('mua groceries') ||
          e.desc.toLowerCase().includes('điện'))
        .reduce((s, e) => s + e.amount, 0);
      return Math.round(essential / 4.345);
    },

    get emergencyFoodDays() {
      let totalCals = this.pantryItems.reduce((sum, p) => sum + (p.calsPerUnit * p.qty), 0);
      return Math.floor(totalCals / 2000);
    },

    get lowStockAlerts() {
      return this.pantryItems.filter(i => i.qty <= 2).map(i => i.name);
    },

    get debtProgress() {
      return this.debtTotal > 0 ? (this.debtPaid / this.debtTotal) * 100 : 0;
    },

    formatMoney(val) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
      }).format(val);
    },

    // --------------------------------------------------------------
    // 4. ACTIONS (CRUD, imports/exports, debt management)
    // --------------------------------------------------------------

    // Debt actions – allows user to update total debt and amount paid
    setDebtTotal() {
      let newTotal = parseFloat(prompt('Nhập tổng số nợ (VND)', this.debtTotal));
      if (!isNaN(newTotal) && newTotal >= 0) this.debtTotal = newTotal;
    },

    setDebtPaid() {
      let newPaid = parseFloat(prompt('Nhập số tiền đã trả (VND)', this.debtPaid));
      if (!isNaN(newPaid) && newPaid >= 0) this.debtPaid = Math.min(newPaid, this.debtTotal);
    },

    // Full JSON backup (complete state) – perfect for device transfer or sharing
    exportFullJSON() {
      const fullState = {
        incomes: this.incomes,
        expenses: this.expenses,
        savingsGoal: this.savingsGoal,
        emergency: this.emergency,
        debtTotal: this.debtTotal,
        debtPaid: this.debtPaid,
        pantryItems: this.pantryItems,
        prepTasks: this.prepTasks,
        habitsList: this.habitsList,
        inventoryItems: this.inventoryItems,
        notesText: this.notesText
      };
      const jsonStr = JSON.stringify(fullState, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `lifeos_backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
    },

    importFullJSON(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          const required = [
            'incomes', 'expenses', 'savingsGoal', 'emergency',
            'debtTotal', 'debtPaid', 'pantryItems', 'prepTasks',
            'habitsList', 'inventoryItems', 'notesText'
          ];
          for (let key of required) {
            if (!(key in imported)) throw new Error(`Thiếu trường: ${key}`);
          }
          Object.assign(this, imported);
          this.saveToLocalStorage();
          alert('✅ Đã nhập toàn bộ dữ liệu thành công!');
        } catch (err) {
          alert('❌ File JSON không hợp lệ. Vui lòng dùng bản sao lưu LifeOS hợp lệ.');
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    },

    // Notes .txt import/export
    exportNotesTxt() {
      const blob = new Blob([this.notesText], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'lifeos_notes.txt';
      link.click();
      URL.revokeObjectURL(link.href);
    },

    importNotesFromFile(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.notesText = e.target.result;
        this.saveToLocalStorage();
      };
      reader.readAsText(file);
      event.target.value = '';
    },

    // Budget CSV import/export – useful for spreadsheet editing
    exportBudgetCSV() {
      let rows = [['type', 'description', 'amount', 'isBill', 'dueDate']];
      this.incomes.forEach(inc => rows.push(['income', inc.desc, inc.amount, '', '']));
      this.expenses.forEach(exp => rows.push(['expense', exp.desc, exp.amount, exp.isBill ? 'true' : 'false', exp.dueDate || '']));
      const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'lifeos_budget.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    },

    importBudgetFromCSV(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const rows = text.split(/\r?\n/).slice(1).filter(r => r.trim());
        const newIncomes = [], newExpenses = [];
        for (let row of rows) {
          const matches = row.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
          if (!matches || matches.length < 5) continue;
          const clean = matches.map(m => m.replace(/^"|"$/g, '').replace(/""/g, '"'));
          const type = clean[0], desc = clean[1], amount = parseFloat(clean[2]), isBill = clean[3] === 'true', dueDate = clean[4] || null;
          if (isNaN(amount)) continue;
          if (type === 'income') {
            newIncomes.push({ id: this.generateId(), desc, amount });
          } else if (type === 'expense') {
            newExpenses.push({ id: this.generateId(), desc, amount, isBill, dueDate });
          }
        }
        if (newIncomes.length || newExpenses.length) {
          this.incomes = newIncomes;
          this.expenses = newExpenses;
          alert(`Đã nhập ${newIncomes.length} khoản thu nhập, ${newExpenses.length} khoản chi phí.`);
        } else {
          alert('Không tìm thấy mục hợp lệ nào.');
        }
        this.saveToLocalStorage();
      };
      reader.readAsText(file);
      event.target.value = '';
    },

    // share app (mobile-friendly)
    shareApp() {
      const shareData = {
        title: 'LifeOS',
        text: 'Tổ chức cuộc sống, chuẩn bị cho tình huống khẩn cấp và xây dựng sự ổn định.',
        url: window.location.href
      };
      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Đã sao chép liên kết! Chia sẻ LifeOS với người khác.');
      }
    },

    // ========== Item management (simple prompt-based CRUD) ==========
    addIncomePrompt() {
      let desc = prompt('Mô tả khoản thu nhập');
      if (!desc) return;
      let amt = parseFloat(prompt('Số tiền (VND)'));
      if (isNaN(amt)) return;
      this.incomes.push({ id: this.generateId(), desc, amount: amt });
    },

    removeIncome(id) {
      this.incomes = this.incomes.filter(i => i.id !== id);
    },

    addExpensePrompt() {
      let desc = prompt('Tên chi phí');
      if (!desc) return;
      let amt = parseFloat(prompt('Số tiền hàng tháng'));
      if (isNaN(amt)) return;
      let isBill = confirm('Đây có phải hóa đơn định kỳ?');
      let dueDate = isBill ? prompt('Ngày đến hạn (YYYY-MM-DD)') : null;
      this.expenses.push({
        id: this.generateId(),
        desc,
        amount: amt,
        isBill: !!isBill,
        dueDate: dueDate || null
      });
    },

    removeExpense(id) {
      this.expenses = this.expenses.filter(e => e.id !== id);
    },

    updateSavingsGoal() {
      let t = parseFloat(prompt('Mục tiêu tiết kiệm', this.savingsGoal.target));
      if (!isNaN(t)) this.savingsGoal.target = t;
      let c = parseFloat(prompt('Số tiền hiện có', this.savingsGoal.current));
      if (!isNaN(c)) this.savingsGoal.current = c;
    },

    updateEmergencyFund() {
      let t = parseFloat(prompt('Mục tiêu quỹ khẩn cấp', this.emergency.target));
      if (!isNaN(t)) this.emergency.target = t;
      let c = parseFloat(prompt('Số tiền hiện có trong quỹ khẩn cấp', this.emergency.current));
      if (!isNaN(c)) this.emergency.current = c;
    },

    addPantryItemPrompt() {
      let name = prompt('Tên thực phẩm');
      if (!name) return;
      let qty = parseInt(prompt('Số lượng'));
      if (isNaN(qty)) return;
      let expiry = prompt('Hạn sử dụng (YYYY-MM-DD)');
      let cals = parseInt(prompt('Calories mỗi đơn vị', 250));
      if (isNaN(cals)) cals = 200;
      this.pantryItems.push({
        id: this.generateId(),
        name,
        qty,
        expiry,
        calsPerUnit: cals
      });
    },

    removePantryItem(id) {
      this.pantryItems = this.pantryItems.filter(p => p.id !== id);
    },

    addPrepTask() {
      let t = prompt('Nhiệm vụ mới');
      if (t) this.prepTasks.push({ id: this.generateId(), name: t, completed: false });
    },

    resetHabitsToday() {
      this.habitsList.forEach(h => h.completed = false);
    },

    addInventoryPrompt() {
      let name = prompt('Tên vật phẩm');
      if (!name) return;
      let cat = prompt('Phân loại', 'Dụng cụ');
      let stat = prompt('Tình trạng (tốt/sửa/chờ bán/quyên góp/thay mới)', 'tốt');
      this.inventoryItems.push({
        id: this.generateId(),
        name,
        category: cat || 'Khác',
        status: stat || 'tốt'
      });
    },

    removeInventoryItem(id) {
      this.inventoryItems = this.inventoryItems.filter(i => i.id !== id);
    },
  };
}