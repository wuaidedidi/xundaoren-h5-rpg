/**
 * 寻道人 - H5多端适配模块
 * 使用 vw/vh + rem 实现响应式布局
 * 支持折叠屏、刘海屏、异形屏适配
 * CSS中严禁使用px，全部使用相对单位
 */

class ResponsiveAdapter {
    constructor() {
        // 设计稿尺寸（以 iPhone 6/7/8 为基准：375x667）
        this.designWidth = 375
        this.designHeight = 667

        // 根字体大小基准（1rem = 16px 在 375px 宽度下）
        this.baseFontSize = 16

        // 当前设备信息
        this.deviceInfo = {
            width: window.innerWidth,
            height: window.innerHeight,
            dpr: window.devicePixelRatio || 1,
            isLandscape: window.innerWidth > window.innerHeight,
            isFoldable: false,
            hasNotch: false,
            safeArea: { top: 0, right: 0, bottom: 0, left: 0 }
        }

        // 断点定义
        this.breakpoints = {
            xs: 320,    // 小屏手机
            sm: 375,    // 标准手机
            md: 414,    // 大屏手机
            lg: 768,    // 平板竖屏
            xl: 1024,   // 平板横屏/小桌面
            xxl: 1440   // 桌面
        }

        // 监听状态
        this.isListening = false
        this.resizeTimer = null
    }

    /**
     * 初始化适配
     */
    init() {
        this.updateDeviceInfo()
        this.setupViewport()
        this.setRootFontSize()
        this.injectResponsiveStyles()
        this.setupEventListeners()

        console.log('响应式适配初始化完成:', this.deviceInfo)
    }

    /**
     * 更新设备信息
     */
    updateDeviceInfo() {
        const width = window.innerWidth
        const height = window.innerHeight

        // 检测折叠屏（通过屏幕比例变化或特定API）
        const isFoldable = this.detectFoldable()

        // 检测刘海屏
        const hasNotch = this.detectNotch()

        // 计算安全区域
        const safeArea = this.calculateSafeArea()

        this.deviceInfo = {
            width,
            height,
            dpr: window.devicePixelRatio || 1,
            isLandscape: width > height,
            isFoldable,
            hasNotch,
            safeArea
        }

        // 更新 CSS 变量
        this.updateCSSVariables()
    }

    /**
     * 检测折叠屏
     */
    detectFoldable() {
        // 检测折叠屏的启发式方法
        // 1. 检查屏幕折叠API
        if ('screen' in window && window.screen.fold) {
            return true
        }

        // 2. 通过视口变化模式检测
        const aspectRatio = window.screen.width / window.screen.height
        // 折叠屏通常有特殊的宽高比
        if (aspectRatio > 0.6 && aspectRatio < 0.75) {
            return true
        }

        // 3. 检查是否为三星折叠设备等
        const ua = navigator.userAgent.toLowerCase()
        if (ua.includes('samsung') && (ua.includes('sm-f') || ua.includes('fold'))) {
            return true
        }

        return false
    }

    /**
     * 检测刘海屏/挖孔屏
     */
    detectNotch() {
        // 检查 CSS 环境变量支持
        if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
            const safeTop = parseInt(getComputedStyle(document.documentElement)
                .getPropertyValue('--sat') || '0')
            return safeTop > 20
        }

        // iPhone X 及以上检测
        const iPhoneNotch = /iPhone/.test(navigator.userAgent) &&
            window.screen.height >= 812 &&
            window.devicePixelRatio >= 2

        // Android 刘海屏检测（通过特征）
        const androidNotch = /Android/.test(navigator.userAgent) &&
            window.screen.height / window.screen.width > 2

        return iPhoneNotch || androidNotch
    }

    /**
     * 计算安全区域
     */
    calculateSafeArea() {
        // 使用 CSS env() 变量获取安全区域
        const safeArea = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }

        // 尝试读取 CSS 环境变量
        if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
            const styles = getComputedStyle(document.documentElement)
            safeArea.top = parseFloat(styles.getPropertyValue('--sat')) || 0
            safeArea.right = parseFloat(styles.getPropertyValue('--sar')) || 0
            safeArea.bottom = parseFloat(styles.getPropertyValue('--sab')) || 0
            safeArea.left = parseFloat(styles.getPropertyValue('--sal')) || 0
        } else {
            // 回退方案：根据设备类型估算
            if (this.detectNotch()) {
                safeArea.top = 44 // iPhone X 状态栏高度
                safeArea.bottom = 34 // iPhone X 底部安全区域
            }
        }

        return safeArea
    }

    /**
     * 设置视口
     */
    setupViewport() {
        let viewport = document.querySelector('meta[name="viewport"]')

        if (!viewport) {
            viewport = document.createElement('meta')
            viewport.name = 'viewport'
            document.head.appendChild(viewport)
        }

        // 配置视口，支持刘海屏
        viewport.content = [
            'width=device-width',
            'initial-scale=1',
            'maximum-scale=1',
            'user-scalable=no',
            'viewport-fit=cover' // 支持刘海屏全屏
        ].join(',')
    }

    /**
     * 设置根字体大小（rem 基准）
     */
    setRootFontSize() {
        const { width, height, isLandscape } = this.deviceInfo

        // 根据屏幕宽度计算根字体大小
        let baseWidth = isLandscape ? height : width

        // 折叠屏特殊处理
        if (this.deviceInfo.isFoldable && isLandscape) {
            // 折叠屏展开时，以折叠后的宽度为基准
            baseWidth = Math.min(width, height)
        }

        // 计算字体大小：设计稿 375px 对应 16px
        const fontSize = (baseWidth / this.designWidth) * this.baseFontSize

        // 限制字体大小范围，保证可读性
        const clampedFontSize = Math.max(12, Math.min(fontSize, 20))

        document.documentElement.style.fontSize = `${clampedFontSize}px`

        // 存储当前字体大小供 JavaScript 使用
        this.currentFontSize = clampedFontSize
    }

    /**
     * 更新 CSS 变量
     */
    updateCSSVariables() {
        const { width, height, safeArea, dpr } = this.deviceInfo

        const root = document.documentElement

        // 基础尺寸变量
        root.style.setProperty('--vw', `${width / 100}px`)
        root.style.setProperty('--vh', `${height / 100}px`)
        root.style.setProperty('--dpr', dpr)
        root.style.setProperty('--rem', `${this.currentFontSize}px`)

        // 安全区域变量
        root.style.setProperty('--safe-top', `${safeArea.top}px`)
        root.style.setProperty('--safe-right', `${safeArea.right}px`)
        root.style.setProperty('--safe-bottom', `${safeArea.bottom}px`)
        root.style.setProperty('--safe-left', `${safeArea.left}px`)

        // 刘海屏环境变量（供 CSS env() 使用）
        root.style.setProperty('--sat', `${safeArea.top}px`)
        root.style.setProperty('--sar', `${safeArea.right}px`)
        root.style.setProperty('--sab', `${safeArea.bottom}px`)
        root.style.setProperty('--sal', `${safeArea.left}px`)

        // 设计稿比例变量
        root.style.setProperty('--design-width', this.designWidth)
        root.style.setProperty('--design-height', this.designHeight)

        // 响应式断点
        root.style.setProperty('--bp-xs', this.breakpoints.xs)
        root.style.setProperty('--bp-sm', this.breakpoints.sm)
        root.style.setProperty('--bp-md', this.breakpoints.md)
        root.style.setProperty('--bp-lg', this.breakpoints.lg)
        root.style.setProperty('--bp-xl', this.breakpoints.xl)
        root.style.setProperty('--bp-xxl', this.breakpoints.xxl)
    }

    /**
     * 注入响应式样式
     */
    injectResponsiveStyles() {
        const style = document.createElement('style')
        style.textContent = `
            /* 基础响应式样式 */
            *, *::before, *::after {
                box-sizing: border-box;
            }

            html {
                /* 禁止字体大小调整 */
                -webkit-text-size-adjust: 100%;
                text-size-adjust: 100%;
            }

            body {
                margin: 0;
                padding: 0;
                /* 适配刘海屏 */
                padding-top: env(safe-area-inset-top);
                padding-bottom: env(safe-area-inset-bottom);
                padding-left: env(safe-area-inset-left);
                padding-right: env(safe-area-inset-right);
            }

            /* 游戏容器 */
            #game-container {
                width: 100vw;
                height: 100vh;
                overflow: hidden;
                position: relative;
            }

            /* 使用 vw/vh 的实用类 */
            .w-full { width: 100vw; }
            .h-full { height: 100vh; }
            .w-half { width: 50vw; }
            .h-half { height: 50vh; }

            /* 使用 rem 的实用类 */
            .text-xs { font-size: 0.75rem; }
            .text-sm { font-size: 0.875rem; }
            .text-base { font-size: 1rem; }
            .text-lg { font-size: 1.125rem; }
            .text-xl { font-size: 1.25rem; }
            .text-2xl { font-size: 1.5rem; }

            /* 间距实用类 */
            .p-1 { padding: 0.25rem; }
            .p-2 { padding: 0.5rem; }
            .p-3 { padding: 0.75rem; }
            .p-4 { padding: 1rem; }

            .m-1 { margin: 0.25rem; }
            .m-2 { margin: 0.5rem; }
            .m-3 { margin: 0.75rem; }
            .m-4 { margin: 1rem; }

            /* 安全区域内边距 */
            .safe-area-top { padding-top: var(--safe-top); }
            .safe-area-bottom { padding-bottom: var(--safe-bottom); }
            .safe-area-left { padding-left: var(--safe-left); }
            .safe-area-right { padding-right: var(--safe-right); }

            /* 横屏适配 */
            @media (orientation: landscape) {
                .landscape-hidden { display: none !important; }
                .landscape-flex { display: flex !important; }
            }

            /* 竖屏适配 */
            @media (orientation: portrait) {
                .portrait-hidden { display: none !important; }
                .portrait-flex { display: flex !important; }
            }

            /* 折叠屏适配 */
            @media (screen-fold-posture: folded) {
                .folded-visible { display: block !important; }
                .unfolded-visible { display: none !important; }
            }

            @media (screen-fold-posture: unfolded) {
                .folded-visible { display: none !important; }
                .unfolded-visible { display: block !important; }
            }

            /* 响应式断点 */
            @media (min-width: 768px) {
                .md-text-lg { font-size: 1.125rem; }
                .md-p-6 { padding: 1.5rem; }
            }

            @media (min-width: 1024px) {
                .xl-text-xl { font-size: 1.25rem; }
                .xl-p-8 { padding: 2rem; }
            }
        `
        document.head.appendChild(style)
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        if (this.isListening) return

        // 窗口大小变化（防抖）
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimer)
            this.resizeTimer = setTimeout(() => {
                this.handleResize()
            }, 250)
        })

        // 屏幕方向变化
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 300)
        })

        // 折叠屏状态变化
        if ('screen' in window && window.screen.addEventListener) {
            window.screen.addEventListener('change', () => {
                this.handleResize()
            })
        }

        this.isListening = true
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        const prevInfo = { ...this.deviceInfo }
        this.updateDeviceInfo()
        this.setRootFontSize()

        // 触发事件
        const event = new CustomEvent('responsive:resize', {
            detail: {
                prev: prevInfo,
                current: this.deviceInfo
            }
        })
        window.dispatchEvent(event)
    }

    /**
     * px 转 rem
     * @param {number} px - px 值
     * @returns {string} rem 值
     */
    px2rem(px) {
        return `${px / this.baseFontSize}rem`
    }

    /**
     * px 转 vw
     * @param {number} px - px 值（基于设计稿 375px）
     * @returns {string} vw 值
     */
    px2vw(px) {
        return `${(px / this.designWidth) * 100}vw`
    }

    /**
     * px 转 vh
     * @param {number} px - px 值（基于设计稿 667px）
     * @returns {string} vh 值
     */
    px2vh(px) {
        return `${(px / this.designHeight) * 100}vh`
    }

    /**
     * 获取当前断点
     */
    getCurrentBreakpoint() {
        const width = this.deviceInfo.width

        if (width >= this.breakpoints.xxl) return 'xxl'
        if (width >= this.breakpoints.xl) return 'xl'
        if (width >= this.breakpoints.lg) return 'lg'
        if (width >= this.breakpoints.md) return 'md'
        if (width >= this.breakpoints.sm) return 'sm'
        return 'xs'
    }

    /**
     * 检查当前断点
     */
    isBreakpoint(breakpoint) {
        const current = this.getCurrentBreakpoint()
        const order = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
        return order.indexOf(current) >= order.indexOf(breakpoint)
    }

    /**
     * 获取设备信息
     */
    getDeviceInfo() {
        return { ...this.deviceInfo }
    }

    /**
     * 销毁
     */
    destroy() {
        window.removeEventListener('resize', this.handleResize)
        window.removeEventListener('orientationchange', this.handleResize)
        clearTimeout(this.resizeTimer)
        this.isListening = false
    }
}

// 导出单例
export default new ResponsiveAdapter()
