/**
 * 寻道人 - 输入管理器
 * 处理键盘和鼠标输入
 */

class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            leftDown: false,
            rightDown: false,
            middleDown: false
        };
        this.callbacks = {
            keydown: [],
            keyup: [],
            mousedown: [],
            mouseup: [],
            mousemove: [],
            click: [],
            rightclick: []
        };
        
        this.enabled = false;
    }

    /**
     * 初始化输入监听
     */
    init(canvas) {
        this.canvas = canvas;
        
        // 键盘事件
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // 鼠标事件
        canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        canvas.addEventListener('click', this.handleClick.bind(this));
        canvas.addEventListener('contextmenu', this.handleRightClick.bind(this));
        
        this.enabled = true;
        console.log('输入管理器初始化完成');
    }

    /**
     * 启用/禁用输入
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * 处理按键按下
     */
    handleKeyDown(event) {
        if (!this.enabled) return;
        
        const key = event.key.toLowerCase();
        
        // 数字键（技能快捷键）不需要防重复，每次按下都应触发
        const isSkillKey = key >= '1' && key <= '9';
        
        // 防止重复触发（仅对移动键等）
        if (!isSkillKey && this.keys[key]) return;
        
        this.keys[key] = true;
        
        this.callbacks.keydown.forEach(cb => cb(key, event));
    }

    /**
     * 处理按键释放
     */
    handleKeyUp(event) {
        if (!this.enabled) return;
        
        const key = event.key.toLowerCase();
        this.keys[key] = false;
        
        this.callbacks.keyup.forEach(cb => cb(key, event));
    }

    /**
     * 处理鼠标按下
     */
    handleMouseDown(event) {
        if (!this.enabled) return;
        
        this.updateMousePosition(event);
        
        switch (event.button) {
            case 0: this.mouse.leftDown = true; break;
            case 1: this.mouse.middleDown = true; break;
            case 2: this.mouse.rightDown = true; break;
        }
        
        this.callbacks.mousedown.forEach(cb => cb(this.mouse, event));
    }

    /**
     * 处理鼠标释放
     */
    handleMouseUp(event) {
        if (!this.enabled) return;
        
        this.updateMousePosition(event);
        
        switch (event.button) {
            case 0: this.mouse.leftDown = false; break;
            case 1: this.mouse.middleDown = false; break;
            case 2: this.mouse.rightDown = false; break;
        }
        
        this.callbacks.mouseup.forEach(cb => cb(this.mouse, event));
    }

    /**
     * 处理鼠标移动
     */
    handleMouseMove(event) {
        if (!this.enabled) return;
        
        this.updateMousePosition(event);
        this.callbacks.mousemove.forEach(cb => cb(this.mouse, event));
    }

    /**
     * 处理左键点击
     */
    handleClick(event) {
        if (!this.enabled) return;
        
        this.updateMousePosition(event);
        this.callbacks.click.forEach(cb => cb(this.mouse, event));
    }

    /**
     * 处理右键点击
     */
    handleRightClick(event) {
        event.preventDefault();
        if (!this.enabled) return;
        
        this.updateMousePosition(event);
        this.callbacks.rightclick.forEach(cb => cb(this.mouse, event));
    }

    /**
     * 更新鼠标位置（归一化到-1到1）
     */
    updateMousePosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.mouse.clientX = event.clientX;
        this.mouse.clientY = event.clientY;
    }

    /**
     * 检查按键是否按下
     */
    isKeyDown(key) {
        return this.keys[key.toLowerCase()] || false;
    }

    /**
     * 注册回调
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    /**
     * 移除回调
     */
    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }

    /**
     * 获取移动方向向量
     */
    getMovementDirection() {
        let x = 0;
        let z = 0;
        
        if (this.isKeyDown('w') || this.isKeyDown('arrowup')) z -= 1;
        if (this.isKeyDown('s') || this.isKeyDown('arrowdown')) z += 1;
        if (this.isKeyDown('a') || this.isKeyDown('arrowleft')) x -= 1;
        if (this.isKeyDown('d') || this.isKeyDown('arrowright')) x += 1;
        
        // 归一化
        const length = Math.sqrt(x * x + z * z);
        if (length > 0) {
            x /= length;
            z /= length;
        }
        
        return { x, z };
    }
}

export default new InputManager();
