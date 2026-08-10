// programs/calc.js - ZebCalculator Pro (Standard & Scientific)
export class RetroCalculator {
    constructor(onCloseRequest) {
        this.onCloseRequest = onCloseRequest;

        this.bodyElement = null;
        this.displayEl = null;
        this.expressionEl = null;
        this.memoryTagEl = null;

        this.mode = 'standard'; // 'standard' or 'scientific'
        this.currentValue = "0";
        this.storedValue = null;
        this.activeOperator = null;
        this.expressionText = "";
        this.resetOnNextInput = false;
        this.memoryValue = 0;

        this.keyHandler = (e) => this.handleKeyDown(e);
    }

    open(windowBodyElement) {
        this.bodyElement = windowBodyElement;
        this.bodyElement.style.height = "100%";

        this.render();
        window.addEventListener('keydown', this.keyHandler);
    }

    render() {
        if (!this.bodyElement) return;

        const isSci = this.mode === 'scientific';

        this.bodyElement.innerHTML = `
            <style>
                .calc-btn-retro {
                    font-size: 11px;
                    font-weight: bold;
                    cursor: pointer;
                    background-color: #c0c0c0;
                    border: 2px solid #ffffff;
                    border-right-color: #000000;
                    border-bottom-color: #000000;
                    color: #000000;
                    user-select: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-sizing: border-box;
                    padding: 4px;
                }
                .calc-btn-retro:active {
                    border: 2px solid #000000;
                    border-right-color: #ffffff;
                    border-bottom-color: #ffffff;
                    background-color: #e0e0e0;
                    padding-top: 5px;
                    padding-left: 5px;
                }
                .calc-btn-op {
                    color: #000080;
                    background-color: #d0d0d0;
                }
                .calc-btn-num {
                    font-weight: 800;
                    font-size: 13px;
                }
                .calc-btn-eq {
                    background-color: #000080;
                    color: #ffffff;
                }
                .calc-btn-eq:active {
                    background-color: #000050;
                }
                .calc-mode-tab {
                    padding: 2px 10px;
                    font-size: 11px;
                    cursor: pointer;
                    background: #c0c0c0;
                    border: 1px solid #808080;
                    border-bottom: none;
                }
                .calc-mode-tab.active-tab {
                    font-weight: bold;
                    background: #e0e0e0;
                    border: 2px solid #ffffff;
                    border-right-color: #000;
                    border-bottom-color: #e0e0e0;
                    color: #000080;
                }
            </style>
            <div style="display:flex; flex-direction:column; height:100%; box-sizing:border-box; padding:6px; background:#c0c0c0; font-family:Arial, sans-serif; user-select:none; overflow:hidden;">
                
                <!-- Mode Tabs Header (Standard / Scientific) -->
                <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid #808080; margin-bottom:6px; padding-bottom:2px;">
                    <div style="display:flex; gap:2px;">
                        <div class="calc-mode-tab ${!isSci ? 'active-tab' : ''}" data-mode="standard">Standard</div>
                        <div class="calc-mode-tab ${isSci ? 'active-tab' : ''}" data-mode="scientific">Scientific</div>
                    </div>
                    <span style="font-size:10px; color:#555; font-weight:bold; padding-right:4px;">ZebCalc Pro</span>
                </div>

                <!-- Retro Sunken LCD Display Screen -->
                <div style="background:#9fbf8f; color:#0b1a08; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; padding:6px 8px; display:flex; flex-direction:column; justify-content:space-between; height:54px; margin-bottom:6px; font-family:'Courier New', monospace; box-sizing:border-box;">
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; opacity:0.85; min-height:14px;">
                        <span class="calc-mem-tag" style="font-weight:bold; color:#000080; display:${this.memoryValue !== 0 ? 'inline' : 'none'};">M</span>
                        <span class="calc-expr-line" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:right; flex-grow:1; margin-left:8px;">${this.expressionText}</span>
                    </div>
                    <div class="calc-display-line" style="text-align:right; font-size:1.6em; font-weight:bold; letter-spacing:1px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">0</div>
                </div>

                <!-- Memory Toolbar Strip -->
                <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:3px; margin-bottom:6px;">
                    <button class="calc-btn-retro calc-btn-mem" data-action="MC">MC</button>
                    <button class="calc-btn-retro calc-btn-mem" data-action="MR">MR</button>
                    <button class="calc-btn-retro calc-btn-mem" data-action="MS">MS</button>
                    <button class="calc-btn-retro calc-btn-mem" data-action="M+">M+</button>
                    <button class="calc-btn-retro calc-btn-mem" data-action="M-">M-</button>
                </div>

                <!-- Keypad Grid Container -->
                <div class="calc-keypad-grid" style="flex-grow:1; display:grid; ${isSci ? 'grid-template-columns:repeat(5, 1fr); grid-template-rows:repeat(6, 1fr);' : 'grid-template-columns:repeat(4, 1fr); grid-template-rows:repeat(6, 1fr);'} gap:4px;"></div>
            </div>
        `;

        this.displayEl = this.bodyElement.querySelector('.calc-display-line');
        this.expressionEl = this.bodyElement.querySelector('.calc-expr-line');
        this.memoryTagEl = this.bodyElement.querySelector('.calc-mem-tag');

        const grid = this.bodyElement.querySelector('.calc-keypad-grid');

        // Layout definitions
        const standardLayout = [
            [{ label: '%', action: 'pct', cls: 'calc-btn-op' }, { label: '√', action: 'sqrt', cls: 'calc-btn-op' }, { label: 'x²', action: 'sqr', cls: 'calc-btn-op' }, { label: '1/x', action: 'recip', cls: 'calc-btn-op' }],
            [{ label: 'CE', action: 'CE', cls: 'calc-btn-op' }, { label: 'C', action: 'C', cls: 'calc-btn-op' }, { label: '⌫', action: 'back', cls: 'calc-btn-op' }, { label: '÷', action: '/', cls: 'calc-btn-op' }],
            [{ label: '7', action: '7', cls: 'calc-btn-num' }, { label: '8', action: '8', cls: 'calc-btn-num' }, { label: '9', action: '9', cls: 'calc-btn-num' }, { label: '×', action: '*', cls: 'calc-btn-op' }],
            [{ label: '4', action: '4', cls: 'calc-btn-num' }, { label: '5', action: '5', cls: 'calc-btn-num' }, { label: '6', action: '6', cls: 'calc-btn-num' }, { label: '-', action: '-', cls: 'calc-btn-op' }],
            [{ label: '1', action: '1', cls: 'calc-btn-num' }, { label: '2', action: '2', cls: 'calc-btn-num' }, { label: '3', action: '3', cls: 'calc-btn-num' }, { label: '+', action: '+', cls: 'calc-btn-op' }],
            [{ label: '±', action: 'pm', cls: 'calc-btn-num' }, { label: '0', action: '0', cls: 'calc-btn-num' }, { label: '.', action: '.', cls: 'calc-btn-num' }, { label: '=', action: '=', cls: 'calc-btn-eq' }]
        ];

        const scientificLayout = [
            [{ label: 'sin', action: 'sin', cls: 'calc-btn-op' }, { label: 'cos', action: 'cos', cls: 'calc-btn-op' }, { label: 'tan', action: 'tan', cls: 'calc-btn-op' }, { label: 'π', action: 'pi', cls: 'calc-btn-op' }, { label: 'e', action: 'e_const', cls: 'calc-btn-op' }],
            [{ label: 'asin', action: 'asin', cls: 'calc-btn-op' }, { label: 'acos', action: 'acos', cls: 'calc-btn-op' }, { label: 'atan', action: 'atan', cls: 'calc-btn-op' }, { label: 'ln', action: 'ln', cls: 'calc-btn-op' }, { label: 'log', action: 'log', cls: 'calc-btn-op' }],
            [{ label: 'x^y', action: '^', cls: 'calc-btn-op' }, { label: '√', action: 'sqrt', cls: 'calc-btn-op' }, { label: 'CE', action: 'CE', cls: 'calc-btn-op' }, { label: 'C', action: 'C', cls: 'calc-btn-op' }, { label: '⌫', action: 'back', cls: 'calc-btn-op' }],
            [{ label: 'n!', action: 'fact', cls: 'calc-btn-op' }, { label: '7', action: '7', cls: 'calc-btn-num' }, { label: '8', action: '8', cls: 'calc-btn-num' }, { label: '9', action: '9', cls: 'calc-btn-num' }, { label: '÷', action: '/', cls: 'calc-btn-op' }],
            [{ label: '1/x', action: 'recip', cls: 'calc-btn-op' }, { label: '4', action: '4', cls: 'calc-btn-num' }, { label: '5', action: '5', cls: 'calc-btn-num' }, { label: '6', action: '6', cls: 'calc-btn-num' }, { label: '×', action: '*', cls: 'calc-btn-op' }],
            [{ label: '±', action: 'pm', cls: 'calc-btn-num' }, { label: '1', action: '1', cls: 'calc-btn-num' }, { label: '2', action: '2', cls: 'calc-btn-num' }, { label: '3', action: '3', cls: 'calc-btn-num' }, { label: '-', action: '-', cls: 'calc-btn-op' }],
            [{ label: '0', action: '0', cls: 'calc-btn-num' }, { label: '.', action: '.', cls: 'calc-btn-num' }, { label: '=', action: '=', cls: 'calc-btn-eq' }, { label: '+', action: '+', cls: 'calc-btn-op' }]
        ];

        const layout = isSci ? scientificLayout : standardLayout;

        layout.flat().forEach(btn => {
            const el = document.createElement('button');
            el.className = `calc-btn-retro ${btn.cls || ''}`;
            el.textContent = btn.label;
            el.dataset.action = btn.action;
            grid.appendChild(el);
        });

        // Mode switch tabs
        this.bodyElement.querySelectorAll('.calc-mode-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.mode = tab.dataset.mode;
                this.render();
            });
        });

        // Keypad button click handlers
        this.bodyElement.addEventListener('click', (e) => {
            const target = e.target.closest('.calc-btn-retro');
            if (target && target.dataset.action) {
                this.processAction(target.dataset.action);
            }
        });

        this.updateDisplay();
    }

    handleKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            this.clearAll();
            return;
        }

        if (e.key >= '0' && e.key <= '9') this.processAction(e.key);
        else if (e.key === '.') this.processAction('.');
        else if (e.key === '+') this.processAction('+');
        else if (e.key === '-') this.processAction('-');
        else if (e.key === '*') this.processAction('*');
        else if (e.key === '/') this.processAction('/');
        else if (e.key === 'Enter' || e.key === '=') this.processAction('=');
        else if (e.key === 'Backspace') this.processAction('back');
        else if (e.key === '%') this.processAction('pct');
        else if (e.key === '^') this.processAction('^');
    }

    processAction(action) {
        if (!isNaN(action)) {
            this.appendDigit(action);
        } else if (action === '.') {
            this.appendDigit('.');
        } else if (action === 'C') {
            this.clearAll();
        } else if (action === 'CE') {
            this.currentValue = "0";
        } else if (action === 'back') {
            if (this.currentValue.length > 1 && this.currentValue !== "0") {
                this.currentValue = this.currentValue.slice(0, -1);
            } else {
                this.currentValue = "0";
            }
        } else if (['+', '-', '*', '/', '^'].includes(action)) {
            this.setOperator(action);
        } else if (action === '=') {
            this.evaluateEquation();
        } else if (action === 'pm') {
            if (this.currentValue !== "0") {
                this.currentValue = (parseFloat(this.currentValue) * -1).toString();
            }
        } else if (action === 'sqr') {
            const val = parseFloat(this.currentValue);
            this.currentValue = (val * val).toString();
        } else if (action === 'sqrt') {
            const val = parseFloat(this.currentValue);
            this.currentValue = val >= 0 ? Math.sqrt(val).toString() : "ERR: INVALID";
        } else if (action === 'recip') {
            const val = parseFloat(this.currentValue);
            this.currentValue = val !== 0 ? (1 / val).toString() : "ERR: DIV/0";
        } else if (action === 'pct') {
            const val = parseFloat(this.currentValue);
            this.currentValue = (val / 100).toString();
        } else if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'fact', 'pi', 'e_const'].includes(action)) {
            this.evaluateScientific(action);
        } else if (['MC', 'MR', 'MS', 'M+', 'M-'].includes(action)) {
            this.handleMemory(action);
        }

        this.updateDisplay();
    }

    appendDigit(digit) {
        if (this.resetOnNextInput) {
            this.currentValue = "";
            this.resetOnNextInput = false;
        }
        if (digit === '.' && this.currentValue.includes('.')) return;
        if (this.currentValue === "0" && digit !== '.') this.currentValue = "";
        this.currentValue += digit;
    }

    setOperator(op) {
        if (this.activeOperator && !this.resetOnNextInput) {
            this.evaluateEquation();
        }
        this.storedValue = parseFloat(this.currentValue);
        this.activeOperator = op;
        const opSymbol = op === '*' ? '×' : (op === '/' ? '÷' : op);
        this.expressionText = `${this.storedValue} ${opSymbol}`;
        this.resetOnNextInput = true;
    }

    evaluateEquation() {
        if (!this.activeOperator || this.storedValue === null) return;
        const current = parseFloat(this.currentValue);
        let result = 0;

        switch (this.activeOperator) {
            case '+': result = this.storedValue + current; break;
            case '-': result = this.storedValue - current; break;
            case '*': result = this.storedValue * current; break;
            case '/': result = current !== 0 ? this.storedValue / current : "ERR: DIV/0"; break;
            case '^': result = Math.pow(this.storedValue, current); break;
        }

        const opSymbol = this.activeOperator === '*' ? '×' : (this.activeOperator === '/' ? '÷' : this.activeOperator);
        this.expressionText = `${this.storedValue} ${opSymbol} ${current} =`;
        this.currentValue = typeof result === 'number' ? this.formatResult(result) : result;
        this.activeOperator = null;
        this.storedValue = null;
        this.resetOnNextInput = true;
    }

    evaluateScientific(fn) {
        const val = parseFloat(this.currentValue);
        let res = 0;
        switch (fn) {
            case 'sin': res = Math.sin(val); break;
            case 'cos': res = Math.cos(val); break;
            case 'tan': res = Math.tan(val); break;
            case 'asin': res = Math.asin(val); break;
            case 'acos': res = Math.acos(val); break;
            case 'atan': res = Math.atan(val); break;
            case 'ln': res = val > 0 ? Math.log(val) : "ERR: INVALID"; break;
            case 'log': res = val > 0 ? Math.log10(val) : "ERR: INVALID"; break;
            case 'pi': res = Math.PI; break;
            case 'e_const': res = Math.E; break;
            case 'fact':
                if (val < 0 || !Number.isInteger(val)) res = "ERR: INVALID";
                else {
                    let f = 1;
                    for (let i = 1; i <= val; i++) f *= i;
                    res = f;
                }
                break;
        }
        this.expressionText = `${fn}(${val}) =`;
        this.currentValue = typeof res === 'number' ? this.formatResult(res) : res;
        this.resetOnNextInput = true;
    }

    handleMemory(action) {
        const current = parseFloat(this.currentValue) || 0;
        if (action === 'MC') this.memoryValue = 0;
        else if (action === 'MR') this.currentValue = this.memoryValue.toString();
        else if (action === 'MS') this.memoryValue = current;
        else if (action === 'M+') this.memoryValue += current;
        else if (action === 'M-') this.memoryValue -= current;
    }

    formatResult(num) {
        if (isNaN(num)) return "ERR";
        const str = num.toString();
        return str.length > 14 ? num.toPrecision(10) : str;
    }

    clearAll() {
        this.currentValue = "0";
        this.storedValue = null;
        this.activeOperator = null;
        this.expressionText = "";
        this.resetOnNextInput = false;
        this.updateDisplay();
    }

    updateDisplay() {
        if (this.displayEl) this.displayEl.textContent = this.currentValue;
        if (this.expressionEl) this.expressionEl.textContent = this.expressionText;
        if (this.memoryTagEl) this.memoryTagEl.style.display = this.memoryValue !== 0 ? 'inline' : 'none';
    }

    cleanup() {
        window.removeEventListener('keydown', this.keyHandler);
    }
}
