// 性能测试脚本
// 用于收集基本的性能数据

function runPerformanceTest() {
  console.log('=== 开始性能测试 ===');
  
  // 测试内存使用情况
  if (performance && performance.memory) {
    const memory = performance.memory;
    console.log('内存使用情况:');
    console.log(`- 已使用内存: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- 总内存: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- 内存限制: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.log('内存测试: 浏览器不支持memory API');
  }
  
  // 测试页面加载时间
  if (performance && performance.timing) {
    const timing = performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    console.log(`页面加载时间: ${loadTime.toFixed(2)} ms`);
  } else {
    console.log('加载时间测试: 浏览器不支持timing API');
  }
  
  // 测试操作响应时间
  console.log('\n=== 测试操作响应时间 ===');
  
  // 测试DOM操作速度
  testDOMOperation();
  
  // 测试数据处理速度
  testDataProcessing();
  
  console.log('=== 性能测试完成 ===');
}

function testDOMOperation() {
  const startTime = performance.now();
  
  // 模拟DOM操作
  const div = document.createElement('div');
  div.textContent = '测试DOM操作';
  document.body.appendChild(div);
  document.body.removeChild(div);
  
  const endTime = performance.now();
  console.log(`DOM操作响应时间: ${(endTime - startTime).toFixed(2)} ms`);
}

function testDataProcessing() {
  const startTime = performance.now();
  
  // 模拟数据处理
  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
    sum += i;
  }
  
  const endTime = performance.now();
  console.log(`数据处理响应时间: ${(endTime - startTime).toFixed(2)} ms`);
}

// 页面加载完成后运行测试
window.addEventListener('load', runPerformanceTest);