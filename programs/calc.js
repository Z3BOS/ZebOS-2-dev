// programs/calc.js
export class RetroCalculator {
    constructor(onCloseRequest) {
        this.onCloseRequest = onCloseRequest;

        this.bodyElement = null;
        this.displayEl = null;
        this.gridEl = null;

        this.currentValue = "0";
        this.storedValue = null;
        this.activeOperator = null;
        this.resetOnNextInput = false;

        this.keyHandler = (e) => this.handleKeyDown(e);
        this.clickHandler = (e) => this.handleButtonClick(e);
    }

    open(windowBodyElement) {
        this.bodyElement = windowBodyElement;
        this.bodyElement.style.height = "100%";

        this.bodyElement.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%; box-sizing:border-box; padding:8px; gap:8px; background:#c0c0c0; font-family:'Courier New', monospace;">
                <div class="calc-display" style="background:#9fbf8f; color:#0b1a08; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; padding:10px; text-align:right; font-size:2em; font-weight:bold; letter-spacing:1px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">0</div>
                <button class="calc-btn" data-value="C" style="font-size:1em; font-weight:bold; cursor:pointer; padding:6px; background-color:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; color:#000000;">C</button>
                <div class="calc-grid" style="flex-grow:1; display:grid; grid-template-columns:repeat(4, 1fr); grid-template-rows:repeat(4, 1fr); gap:6px;"></div>
            </div>
        `;

        this.displayEl = this.bodyElement.querySelector('.calc-display');
        this.gridEl = this.bodyElement.querySelector('.calc-grid');

        const layout = [
            ['7', '8', '9', '/'],
            ['4', '5', '6', '*'],
            ['1', '2', '3', '-'],
            ['0', '.', '=', '+']
        ];

        layout.flat().forEach(label => {
            const btn = document.createElement('button');
            btn.className = 'calc-btn';
            btn.textContent = label;
            btn.dataset.value = label;
            btn.style.cssText = `
                font-size:1.1em; font-weight:bold; cursor:pointer;
                background-color:#c0c0c0; border:2px solid #ffffff;
                border-right-color:#000000; border-bottom-color:#000000;
                color:#000000;
            `;
            this.gridEl.appendChild(btn);
        });

        this.clearAll();
        window.addEventListener('keydown', this.keyHandler);
        this.bodyElement.addEventListener('click', this.clickHandler);
    }

    handleButtonClick(e) {
        if (!e.target.classList.contains('calc-btn')) return;
        this.processInput(e.target.dataset.value);
    }

    handleKeyDown(e) {
        if (e.key === 'Escape') { e.preventDefault(); this.onCloseRequest(); return; }
        const validKeys = "0123456789.+-*/=";
        if (validKeys.includes(e.key)) this.processInput(e.key);
        else if (e.key === 'Enter') this.processInput('=');
        else if (e.key.toLowerCase() === 'c') this.processInput('C');
    }

    processInput(value) {
        if (!isNaN(value) || value === '.') this.appendDigit(value);
        else if (value === 'C') this.clearAll();
        else if (value === '=') this.evaluateEquation();
        else this.setOperator(value);
        this.updateDisplay();
    }

    appendDigit(digit) {
        if (this.resetOnNextInput) { this.currentValue = ""; this.resetOnNextInput = false; }
        if (digit === '.' && this.currentValue.includes('.')) return;
        if (this.currentValue === "0" && digit !== '.') this.currentValue = "";
        this.currentValue += digit;
    }

    setOperator(op) {
        if (this.activeOperator && !this.resetOnNextInput) this.evaluateEquation();
        this.storedValue = parseFloat(this.currentValue);
        this.activeOperator = op;
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
        }
        this.currentValue = result.toString();
        this.activeOperator = null;
        this.storedValue = null;
        this.resetOnNextInput = true;
    }

    clearAll() {
        this.currentValue = "0"; this.storedValue = null; this.activeOperator = null; this.resetOnNextInput = false; this.updateDisplay();
    }

    updateDisplay() {
        this.displayEl.textContent = this.currentValue.length > 14 ? this.currentValue.substring(0, 14) : this.currentValue;
    }

    cleanup() {
        window.removeEventListener('keydown', this.keyHandler);
        if (this.bodyElement) this.bodyElement.removeEventListener('click', this.clickHandler);
    }
}
