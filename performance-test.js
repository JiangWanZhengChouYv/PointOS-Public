// 性能检测脚本：检测设备性能指标并标记到 body，供主脚本判断是否启用性能模式。
// 此脚本被 index.html 引用；即使初始化失败也不影响主功能运行。
(function () {
    'use strict';

    function detect() {
        var flags = {
            hardwareConcurrency: typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 0) : 0,
            deviceMemory: typeof navigator !== 'undefined' && navigator.deviceMemory ? navigator.deviceMemory : 0
        };
        return flags;
    }

    try {
        var meta = detect();
        // 简化的性能评估：CPU 核数 <= 2 或设备内存 < 4GB 视为低性能设备
        var isLowEnd = !!(meta.hardwareConcurrency && meta.hardwareConcurrency <= 2) ||
                        !!(meta.deviceMemory && meta.deviceMemory < 4);
        if (document.documentElement) {
            document.documentElement.setAttribute('data-low-end', isLowEnd ? 'true' : 'false');
        }
        if (typeof window !== 'undefined' && typeof window.performance !== 'undefined') {
            if (PerformanceObserver) {
                try {
                    var perfObserver = new PerformanceObserver(function () {});
                    perfObserver.observe({ type: 'paint', buffered: true });
                } catch (e) { /* 忽略观察器错误 */ }
            }
        }
    } catch (err) {
        // 检测失败时保持静默，不影响页面功能
    }
})();